import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lesson, Asset, Progress } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { queueAttempt, getUnsyncedAttempts, markAttemptsSynced } from '@/lib/offline-db';

interface LessonWithProgress extends Lesson {
  progress?: number; // 0-100 percentage
  assetCount?: number;
  completedAssets?: number;
}

interface LearnerState {
  // Daily plan
  todaysPlan: LessonWithProgress[];
  currentLesson: Lesson | null;
  currentAssets: Asset[];
  currentStepIndex: number;
  
  // Continue learning - most recent incomplete lesson
  continueLesson: LessonWithProgress | null;
  
  // Progress
  progressMap: Record<string, Progress>; // lessonId -> Progress
  streak: number;
  lastActiveDate: string | null;
  dailyGoal: { completed: number; total: number };
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  fetchTodaysPlan: (userId: string, level?: string) => Promise<void>;
  fetchContinueLesson: (userId: string) => Promise<void>;
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
  fetchAllProgress: (userId: string) => Promise<void>;
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
      continueLesson: null,
      progressMap: {},
      streak: 0,
      lastActiveDate: null,
      dailyGoal: { completed: 0, total: 5 },
      isLoading: false,
      isSyncing: false,
      error: null,

      fetchTodaysPlan: async (userId, level) => {
        try {
          set({ isLoading: true, error: null });
          
          // Fetch published lessons, optionally filtered by difficulty
          let query = supabase
            .from('lessons')
            .select('*')
            .eq('is_published', true)
            .order('order_index', { ascending: true })
            .limit(5);
          
          if (level) {
            query = query.eq('difficulty', level);
          }

          const { data: lessons, error } = await query;

          if (error) throw error;
          
          // Fetch user's progress for these lessons
          const lessonIds = (lessons || []).map(l => l.id);
          const { data: progressData } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', userId)
            .in('lesson_id', lessonIds);
          
          // Create progress map
          const progressByLesson: Record<string, Progress> = {};
          (progressData || []).forEach(p => {
            progressByLesson[p.lesson_id] = p as Progress;
          });

          // Fetch asset counts for each lesson
          const { data: assetCounts } = await supabase
            .from('assets')
            .select('lesson_id')
            .eq('status', 'approved')
            .in('lesson_id', lessonIds);
          
          const countByLesson: Record<string, number> = {};
          (assetCounts || []).forEach(a => {
            countByLesson[a.lesson_id] = (countByLesson[a.lesson_id] || 0) + 1;
          });

          // Combine lessons with progress
          const lessonsWithProgress: LessonWithProgress[] = (lessons || []).map(lesson => {
            const prog = progressByLesson[lesson.id];
            const assetCount = countByLesson[lesson.id] || 0;
            const completedAssets = prog?.completed_assets?.length || 0;
            const progress = assetCount > 0 ? Math.round((completedAssets / assetCount) * 100) : 0;
            
            return {
              ...lesson,
              progress,
              assetCount,
              completedAssets,
            } as LessonWithProgress;
          });

          // Calculate daily goal
          const completedToday = lessonsWithProgress.filter(l => l.progress === 100).length;
          
          set({ 
            todaysPlan: lessonsWithProgress, 
            progressMap: progressByLesson,
            dailyGoal: { completed: completedToday, total: 5 },
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch lessons',
            isLoading: false 
          });
        }
      },

      fetchContinueLesson: async (userId) => {
        try {
          // First, get all published lessons ordered by index
          const { data: allLessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('is_published', true)
            .order('order_index', { ascending: true });

          if (lessonsError) {
            console.error('Error fetching lessons:', lessonsError);
            return;
          }

          if (!allLessons || allLessons.length === 0) {
            set({ continueLesson: null });
            return;
          }

          // Get all user's progress records
          const { data: userProgress, error: progressError } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', userId);

          if (progressError && progressError.code !== 'PGRST116') {
            console.error('Error fetching progress:', progressError);
          }

          // Create a map of completed lessons
          const completedLessonIds = new Set(
            (userProgress || [])
              .filter(p => p.is_completed)
              .map(p => p.lesson_id)
          );

          // Find the first lesson that is NOT completed
          const nextLesson = allLessons.find(lesson => !completedLessonIds.has(lesson.id));

          if (nextLesson) {
            // Get asset count for this lesson
            const { count } = await supabase
              .from('assets')
              .select('*', { count: 'exact', head: true })
              .eq('lesson_id', nextLesson.id)
              .eq('status', 'approved');
            
            // Check if there's existing progress for this lesson
            const existingProgress = (userProgress || []).find(p => p.lesson_id === nextLesson.id);
            const assetCount = count || 0;
            const completedAssets = existingProgress?.completed_assets?.length || 0;
            const progress = assetCount > 0 ? Math.round((completedAssets / assetCount) * 100) : 0;

            set({
              continueLesson: {
                ...nextLesson,
                progress,
                assetCount,
                completedAssets,
              } as LessonWithProgress,
            });
          } else {
            // All lessons completed - show the last lesson as "completed"
            const lastLesson = allLessons[allLessons.length - 1];
            const { count } = await supabase
              .from('assets')
              .select('*', { count: 'exact', head: true })
              .eq('lesson_id', lastLesson.id)
              .eq('status', 'approved');

            set({
              continueLesson: {
                ...lastLesson,
                progress: 100,
                assetCount: count || 0,
                completedAssets: count || 0,
              } as LessonWithProgress,
            });
          }
        } catch (error) {
          console.error('Error in fetchContinueLesson:', error);
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

      fetchAllProgress: async (userId) => {
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', userId);

          if (error && error.code !== 'PGRST116') throw error;
          
          const progressMap: Record<string, Progress> = {};
          (data || []).forEach((p: Progress) => {
            progressMap[p.lesson_id] = p;
          });
          
          set({ progressMap, isLoading: false });
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
