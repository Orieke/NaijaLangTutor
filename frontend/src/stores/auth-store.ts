import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, AgeGroup, LearningStyle } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  completeOnboarding: (data: {
    fullName: string;
    ageGroup: AgeGroup;
    learningStyle: LearningStyle;
    goals: string[];
  }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isOnboardingComplete: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const typedProfile = profile as Profile | null;

            set({
              user: session.user,
              session,
              profile: typedProfile,
              isOnboardingComplete: !!typedProfile?.onboarding_completed,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              const typedProfile = profile as Profile | null;

              set({
                user: session.user,
                session,
                profile: typedProfile,
                isOnboardingComplete: !!typedProfile?.onboarding_completed,
              });
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                session: null,
                profile: null,
                isOnboardingComplete: false,
              });
            }
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize', 
            isLoading: false 
          });
        }
      },

      signUp: async (email, password, displayName) => {
        try {
          set({ isLoading: true, error: null });

          if (!isSupabaseConfigured()) {
            throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
          }
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                display_name: displayName || email.split('@')[0],
              },
            },
          });

          if (error) {
            // Provide more helpful error messages
            if (error.message.includes('already registered')) {
              throw new Error('This email is already registered. Please sign in instead.');
            }
            throw error;
          }

          // Handle case where user exists but is unconfirmed
          if (data.user && !data.session && data.user.identities?.length === 0) {
            throw new Error('This email is already registered. Please sign in or check your email for verification.');
          }

          set({ isLoading: false });
          
          // Check if email confirmation is required
          return { needsVerification: !data.session };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign up failed';
          console.error('Sign up error:', message);
          set({ 
            error: message, 
            isLoading: false 
          });
          throw error;
        }
      },

      signIn: async (email, password) => {
        try {
          set({ isLoading: true, error: null });

          if (!isSupabaseConfigured()) {
            throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
          }
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          // Fetch profile for the signed-in user
          if (data.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const typedProfile = profile as Profile | null;

            set({ 
              user: data.user,
              session: data.session,
              profile: typedProfile,
              isOnboardingComplete: !!typedProfile?.onboarding_completed,
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Sign in failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      signInWithOtp: async (email) => {
        try {
          set({ isLoading: true, error: null });

          if (!isSupabaseConfigured()) {
            throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
          }
          
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to send OTP', 
            isLoading: false 
          });
          throw error;
        }
      },

      verifyOtp: async (email, token) => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
          });

          if (error) throw error;
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Invalid verification code', 
            isLoading: false 
          });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await supabase.auth.signOut();
          
          if (error) throw error;
          
          set({
            user: null,
            session: null,
            profile: null,
            isOnboardingComplete: false,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Sign out failed', 
            isLoading: false 
          });
        }
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');

        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
            .eq('id', user.id)
            .select()
            .single();

          if (error) throw error;
          
          set({ profile: data as Profile, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update profile', 
            isLoading: false 
          });
          throw error;
        }
      },

      completeOnboarding: async (data) => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');

        try {
          set({ isLoading: true, error: null });
          
          const profileData = {
            display_name: data.fullName,
            age_group: data.ageGroup,
            learning_style: data.learningStyle,
            learning_goals: data.goals,
            proficiency_level: 'beginner',
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          };

          console.log('Updating profile with:', profileData);

          const { data: profile, error } = await supabase
            .from('profiles')
            .update(profileData as Record<string, unknown>)
            .eq('id', user.id)
            .select()
            .single();

          if (error) {
            console.error('Profile update error:', error);
            throw error;
          }

          console.log('Profile updated successfully:', profile);
          
          set({ profile: profile as Profile, isOnboardingComplete: true, isLoading: false });
        } catch (error) {
          console.error('completeOnboarding error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to complete onboarding', 
            isLoading: false 
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'asusu-ohafia-auth',
      partialize: (state) => ({
        isOnboardingComplete: state.isOnboardingComplete,
      }),
    }
  )
);
