import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Asset, Audio } from '@/types/database';

interface ContributionStats {
  totalAssets: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalRecordings: number;
}

interface ContributorState {
  myAssets: Asset[];
  myRecordings: Audio[];
  stats: ContributionStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMyContributions: (userId: string) => Promise<void>;
  fetchStats: (userId: string) => Promise<void>;
  createAsset: (asset: Partial<Asset>) => Promise<Asset | null>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  submitForReview: (assetId: string) => Promise<void>;
  uploadAudio: (file: Blob, assetId: string, userId: string) => Promise<string | null>;
  clearError: () => void;
}

export const useContributorStore = create<ContributorState>((set, get) => ({
  myAssets: [],
  myRecordings: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchMyContributions: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      const { data: recordings, error: recordingsError } = await supabase
        .from('audio_submissions')
        .select('*')
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false });

      if (recordingsError) throw recordingsError;

      set({ 
        myAssets: (assets || []) as Asset[], 
        myRecordings: (recordings || []) as Audio[],
        isLoading: false 
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchStats: async (userId: string) => {
    try {
      const { data: assets } = await supabase
        .from('assets')
        .select('status')
        .eq('created_by', userId);

      const { data: recordings } = await supabase
        .from('audio_submissions')
        .select('id')
        .eq('submitted_by', userId);

      const assetList = assets || [];
      const stats: ContributionStats = {
        totalAssets: assetList.length,
        pendingReview: assetList.filter((a: { status: string }) => a.status === 'pending').length,
        approved: assetList.filter((a: { status: string }) => a.status === 'approved').length,
        rejected: assetList.filter((a: { status: string }) => a.status === 'rejected').length,
        totalRecordings: recordings?.length || 0,
      };

      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  createAsset: async (asset: Partial<Asset>) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Creating asset in Supabase:', asset);
      const { data, error } = await supabase
        .from('assets')
        .insert(asset as Record<string, unknown>)
        .select()
        .single();

      console.log('Supabase response:', { data, error });

      if (error) throw error;

      const newAsset = data as Asset;
      set(state => ({ 
        myAssets: [newAsset, ...state.myAssets],
        isLoading: false 
      }));
      return newAsset;
    } catch (error) {
      console.error('Error creating asset:', error);
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  updateAsset: async (id: string, updates: Partial<Asset>) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('assets')
        .update(updates as Record<string, unknown>)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        myAssets: state.myAssets.map(a => 
          a.id === id ? { ...a, ...updates } : a
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteAsset: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        myAssets: state.myAssets.filter(a => a.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  submitForReview: async (assetId: string) => {
    const { updateAsset } = get();
    await updateAsset(assetId, { status: 'pending' });
  },

  uploadAudio: async (file: Blob, assetId: string, userId: string) => {
    try {
      const fileName = `${userId}/${assetId}/${Date.now()}.webm`;
      
      console.log('Uploading to storage:', fileName, 'Blob size:', file.size);
      
      // First, check if the bucket exists by listing files
      const { error: bucketError } = await supabase.storage
        .from('audio')
        .list('', { limit: 1 });
      
      if (bucketError) {
        console.error('Bucket check error:', bucketError);
        // Bucket might not exist - provide helpful error
        if (bucketError.message.includes('not found') || bucketError.message.includes('does not exist')) {
          throw new Error('Audio storage bucket does not exist. Please create it in Supabase Dashboard > Storage.');
        }
        throw bucketError;
      }
      
      console.log('Bucket exists, proceeding with upload...');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, file, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      const { data: urlData } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      console.log('Public URL:', urlData.publicUrl);

      // Create audio submission record
      console.log('Creating audio_submissions record...');
      const { data: dbData, error: dbError } = await supabase
        .from('audio_submissions')
        .insert({
          asset_id: assetId,
          submitted_by: userId,
          audio_url: urlData.publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Audio submission created:', dbData);
      return urlData.publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('uploadAudio error:', errorMessage);
      set({ error: errorMessage });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
