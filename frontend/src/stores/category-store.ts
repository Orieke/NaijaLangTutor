import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { AssetCategory } from '@/types/database';

interface CategoryState {
  categories: AssetCategory[];
  pendingCategories: AssetCategory[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCategories: () => Promise<void>;
  fetchPendingCategories: () => Promise<void>;
  createCategory: (category: Partial<AssetCategory>) => Promise<AssetCategory | null>;
  approveCategory: (id: string, approverId: string) => Promise<void>;
  rejectCategory: (id: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  pendingCategories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .eq('status', 'approved')
        .order('name', { ascending: true });

      if (error) throw error;
      set({ categories: (data || []) as AssetCategory[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchPendingCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ pendingCategories: (data || []) as AssetCategory[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createCategory: async (category: Partial<AssetCategory>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('asset_categories')
        .insert(category as Record<string, unknown>)
        .select()
        .single();

      if (error) throw error;

      const newCategory = data as AssetCategory;
      
      // If it's approved (admin created), add to categories list
      if (newCategory.status === 'approved') {
        set(state => ({
          categories: [...state.categories, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
          isLoading: false
        }));
      } else {
        // Otherwise it's pending
        set(state => ({
          pendingCategories: [...state.pendingCategories, newCategory],
          isLoading: false
        }));
      }
      
      return newCategory;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  approveCategory: async (id: string, approverId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('asset_categories')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Move from pending to approved
      const { pendingCategories } = get();
      const approvedCategory = pendingCategories.find(c => c.id === id);
      
      if (approvedCategory) {
        set(state => ({
          pendingCategories: state.pendingCategories.filter(c => c.id !== id),
          categories: [...state.categories, { ...approvedCategory, status: 'approved' as const }]
            .sort((a, b) => a.name.localeCompare(b.name)),
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  rejectCategory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('asset_categories')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        pendingCategories: state.pendingCategories.filter(c => c.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteCategory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('asset_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        categories: state.categories.filter(c => c.id !== id),
        pendingCategories: state.pendingCategories.filter(c => c.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
