import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lesson, Asset, Progress } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { queueAttempt, getUnsyncedAttempts, markAttemptsSynced } from '@/lib/offline-db';

interface LearnerState {
  // Daily plan
  todaysPlan: Lesson[];
  currentLesson: Lesson | null;
  currentAssets: Asset[];
  currentStepIndex: number;
  
  // Progress
  progress: Progress | null;
  streak: number;
  lastActiveDate: string | null;
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  fetchTodaysPlan: (userId: string, level: string) => Promise<void>;
  startLesson: (lessonId: string) => Promise<void>;
  completeStep: () => void;
  recordAttempt: (data: {
    userId: string;
    assetId: string;
    lessonId?: string;
    mode: 'speak' | 'read' | 'write' | 'listen';
    score: number;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  fetchProgress: (userId: string) => Promise<void>;
  syncOfflineAttempts: (userId: string) => Promise<void>;
  updateStreak: (userId: string) => Promise<void>;
}

export const useLearnerStore = create<LearnerState>()(
  persist(
    (set, get) => ({
      todaysPlan: [],
      currentLesson: null,
      currentAssets: [],
      currentStepIndex: 0,
      progress: null,
      streak: 0,
      lastActiveDate: null,
      isLoading: false,
      isSyncing: false,
      error: null,

      fetchTodaysPlan: async (_userId, level) => {
        try {
          set({ isLoading: true, error: null });
          
          // Fetch lessons for user's level
          const { data: lessons, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('level', level)
            .order('order_index', { ascending: true })
            .limit(5);

          if (error) throw error;
          
          set({ todaysPlan: (lessons || []) as Lesson[], isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch lessons',
            isLoading: false 
          });
        }
      },

      startLesson: async (lessonId) => {
        try {
          set({ isLoading: true, error: null });
          
          // Fetch lesson and its assets
          const { data: lesson, error: lessonError } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();

          if (lessonError) throw lessonError;
          
          const typedLesson = lesson as Lesson;

          // Fetch assets associated with this lesson
          const { data: assets, error: assetsError } = await supabase
            .from('assets')
            .select('*')
            .eq('lesson_id', lessonId)
            .eq('status', 'approved');

          if (assetsError) throw assetsError;
          
          set({ 
            currentLesson: typedLesson,
            currentAssets: (assets || []) as Asset[],
            currentStepIndex: 0,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to start lesson',
            isLoading: false 
          });
        }
      },

      completeStep: () => {
        const { currentStepIndex, currentAssets } = get();
        if (currentStepIndex < currentAssets.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
        }
      },

      recordAttempt: async (data) => {
        const attemptId = crypto.randomUUID();
        const attemptData = {
          id: attemptId,
          ...data,
          createdAt: new Date().toISOString(),
        };

        // Always queue locally first (offline-first)
        await queueAttempt(attemptData);

        // Try to sync immediately if online
        if (navigator.onLine) {
          try {
            const insertData = {
              id: attemptId,
              user_id: data.userId,
              asset_id: data.assetId,
              lesson_id: data.lessonId,
              mode: data.mode,
              score: data.score,
              metadata: data.metadata,
            };
            await supabase.from('attempts').insert(insertData as Record<string, unknown>);
            await markAttemptsSynced([attemptId]);
          } catch {
            // Will sync later
            console.log('Attempt queued for later sync');
          }
        }
      },

      fetchProgress: async (userId) => {
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          
          set({ progress: data as Progress | null, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch progress',
            isLoading: false 
          });
        }
      },

      syncOfflineAttempts: async (userId) => {
        if (!navigator.onLine) return;
        
        set({ isSyncing: true });
        
        try {
          const unsynced = await getUnsyncedAttempts();
          
          if (unsynced.length === 0) {
            set({ isSyncing: false });
            return;
          }

          const toInsert = unsynced.map(a => ({
            id: a.id,
            user_id: userId,
            asset_id: a.assetId,
            lesson_id: a.lessonId,
            mode: a.mode,
            score: a.score,
            metadata: a.metadata,
            created_at: a.createdAt,
          }));

          const { error } = await supabase.from('attempts').upsert(toInsert as Record<string, unknown>[]);
          
          if (!error) {
            await markAttemptsSynced(unsynced.map(a => a.id));
          }
          
          set({ isSyncing: false });
        } catch {
          set({ isSyncing: false });
        }
      },

      updateStreak: async (userId) => {
        const today = new Date().toISOString().split('T')[0];
        const { lastActiveDate, streak } = get();
        
        if (lastActiveDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const newStreak = lastActiveDate === yesterdayStr ? streak + 1 : 1;

        try {
          const updateData = { 
            streak_count: newStreak,
            last_active_at: new Date().toISOString(),
          };
          await supabase
            .from('profiles')
            .update(updateData as Record<string, unknown>)
            .eq('id', userId);

          set({ streak: newStreak, lastActiveDate: today });
        } catch {
          // Silent fail, will retry
        }
      },
    }),
    {
      name: 'asusu-ohafia-learner',
      partialize: (state) => ({
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
      }),
    }
  )
);
