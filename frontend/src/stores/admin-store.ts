import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Asset, Audio, Profile, Lesson } from '@/types/database';

interface ReviewItem {
  id: string;
  type: 'asset' | 'audio';
  item: Asset | Audio;
  submittedBy: string;
  submittedAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalAssets: number;
  pendingReviews: number;
  totalLessons: number;
  activeContributors: number;
}

interface AdminState {
  reviewQueue: ReviewItem[];
  users: Profile[];
  lessons: Lesson[];
  assets: Asset[];
  stats: AdminStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchReviewQueue: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchLessons: () => Promise<void>;
  fetchAllAssets: () => Promise<void>;
  fetchStats: () => Promise<void>;
  approveItem: (id: string, type: 'asset' | 'audio', reviewerId: string, notes?: string) => Promise<void>;
  rejectItem: (id: string, type: 'asset' | 'audio', reviewerId: string, reason: string) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  createLesson: (lesson: Partial<Lesson>) => Promise<Lesson | null>;
  updateLesson: (id: string, updates: Partial<Lesson>) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set, _get) => ({
  reviewQueue: [],
  users: [],
  lessons: [],
  assets: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchReviewQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch pending assets
      const { data: pendingAssets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (assetsError) throw assetsError;

      // Fetch pending audio submissions
      const { data: pendingAudio, error: audioError } = await supabase
        .from('audio_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (audioError) throw audioError;

      const queue: ReviewItem[] = [
        ...(pendingAssets || []).map((asset: Asset) => ({
          id: asset.id,
          type: 'asset' as const,
          item: asset,
          submittedBy: asset.created_by,
          submittedAt: asset.created_at,
        })),
        ...(pendingAudio || []).map((audio: Audio) => ({
          id: audio.id,
          type: 'audio' as const,
          item: audio,
          submittedBy: audio.submitted_by,
          submittedAt: audio.created_at,
        })),
      ].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

      set({ reviewQueue: queue, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ users: (data || []) as Profile[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchLessons: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      set({ lessons: (data || []) as Lesson[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchAllAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ assets: (data || []) as Asset[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const [usersRes, assetsRes, pendingRes, lessonsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('assets').select('id', { count: 'exact', head: true }),
        supabase.from('assets').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
      ]);

      const { data: contributorData } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['contributor', 'admin']);

      set({
        stats: {
          totalUsers: usersRes.count || 0,
          totalAssets: assetsRes.count || 0,
          pendingReviews: pendingRes.count || 0,
          totalLessons: lessonsRes.count || 0,
          activeContributors: contributorData?.length || 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  },

  approveItem: async (id: string, type: 'asset' | 'audio', reviewerId: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const table = type === 'asset' ? 'assets' : 'audio_submissions';
      const { error } = await supabase
        .from(table)
        .update({
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        } as Record<string, unknown>)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        reviewQueue: state.reviewQueue.filter(item => item.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  rejectItem: async (id: string, type: 'asset' | 'audio', reviewerId: string, reason: string) => {
    set({ isLoading: true, error: null });
    try {
      const table = type === 'asset' ? 'assets' : 'audio_submissions';
      const { error } = await supabase
        .from(table)
        .update({
          status: 'rejected',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        } as Record<string, unknown>)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        reviewQueue: state.reviewQueue.filter(item => item.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateUserRole: async (userId: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role } as Record<string, unknown>)
        .eq('id', userId);

      if (error) throw error;

      set(state => ({
        users: state.users.map(u => 
          u.id === userId ? { ...u, role: role as Profile['role'] } : u
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createLesson: async (lesson: Partial<Lesson>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert(lesson as Record<string, unknown>)
        .select()
        .single();

      if (error) throw error;

      const newLesson = data as Lesson;
      set(state => ({
        lessons: [...state.lessons, newLesson],
        isLoading: false,
      }));
      return newLesson;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  updateLesson: async (id: string, updates: Partial<Lesson>) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('lessons')
        .update(updates as Record<string, unknown>)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        lessons: state.lessons.map(l => 
          l.id === id ? { ...l, ...updates } : l
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteLesson: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        lessons: state.lessons.filter(l => l.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateAsset: async (id: string, updates: Partial<Asset>) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('assets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        assets: state.assets.map(a =>
          a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
