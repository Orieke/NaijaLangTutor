// Database types for Supabase - Asụsụ Ohafia
// Matches the schema in supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enums
export type UserRole = 'learner' | 'contributor' | 'reviewer' | 'admin';
export type AgeGroup = 'child' | 'teen' | 'adult' | 'elder';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading';
export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'fluent';
export type AssetType = 'word' | 'phrase' | 'sentence' | 'proverb' | 'greeting' | 'dialogue';
export type AssetStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type AttemptType = 'pronunciation' | 'listening' | 'flashcard' | 'quiz';

// Profile type (user data)
export interface Profile {
  id: string;
  display_name: string | null;
  age_group: AgeGroup | null;
  learning_style: LearningStyle | null;
  proficiency_level: ProficiencyLevel;
  native_language: string;
  learning_goals: string[] | null;
  role: UserRole;
  streak_count: number;
  longest_streak: number;
  total_xp: number;
  last_active_at: string | null;
  onboarding_completed: boolean;
  preferences: Json;
  created_at: string;
  updated_at: string;
}

// Lesson type
export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: ProficiencyLevel;
  order_index: number;
  estimated_minutes: number;
  xp_reward: number;
  is_published: boolean;
  prerequisites: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Asset type (vocabulary, phrases, etc.)
export interface Asset {
  id: string;
  lesson_id: string | null;
  type: AssetType;
  igbo_text: string;
  english_text: string;
  pronunciation_guide: string | null;
  cultural_note: string | null;
  category: string | null;
  tags: string[] | null;
  audio_url: string | null;
  image_url: string | null;
  status: AssetStatus;
  difficulty: ProficiencyLevel;
  usage_count: number;
  created_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Attempt type (learning activity)
export interface Attempt {
  id: string;
  user_id: string;
  asset_id: string;
  lesson_id: string | null;
  type: AttemptType;
  is_correct: boolean | null;
  score: number | null;
  time_spent_seconds: number | null;
  user_audio_url: string | null;
  feedback: Json | null;
  synced: boolean;
  created_at: string;
}

// Progress type (per lesson)
export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_assets: string[];
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  time_spent_seconds: number;
  is_completed: boolean;
  completed_at: string | null;
  last_practiced_at: string | null;
  created_at: string;
  updated_at: string;
}

// Audio submission type
export interface Audio {
  id: string;
  asset_id: string;
  submitted_by: string;
  audio_url: string;
  duration_seconds: number | null;
  status: AssetStatus;
  quality_rating: number | null;
  is_primary: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// Asset category type
export interface AssetCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: AssetStatus;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// Achievement type
export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
  criteria: Json;
  is_active: boolean;
  created_at: string;
}

// User achievement type
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

// Database interface for Supabase client typing
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      lessons: {
        Row: Lesson;
        Insert: Partial<Lesson> & { title: string };
        Update: Partial<Lesson>;
      };
      assets: {
        Row: Asset;
        Insert: Partial<Asset> & { type: AssetType; igbo_text: string; english_text: string; created_by: string };
        Update: Partial<Asset>;
      };
      attempts: {
        Row: Attempt;
        Insert: Partial<Attempt> & { user_id: string; asset_id: string; type: AttemptType };
        Update: Partial<Attempt>;
      };
      progress: {
        Row: Progress;
        Insert: Partial<Progress> & { user_id: string; lesson_id: string };
        Update: Partial<Progress>;
      };
      audio_submissions: {
        Row: Audio;
        Insert: Partial<Audio> & { asset_id: string; submitted_by: string; audio_url: string };
        Update: Partial<Audio>;
      };
      achievements: {
        Row: Achievement;
        Insert: Partial<Achievement> & { name: string; criteria: Json };
        Update: Partial<Achievement>;
      };
      user_achievements: {
        Row: UserAchievement;
        Insert: Partial<UserAchievement> & { user_id: string; achievement_id: string };
        Update: Partial<UserAchievement>;
      };
    };
  };
}
