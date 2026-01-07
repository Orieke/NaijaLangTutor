-- ============================================
-- Asụsụ Ohafia - Supabase Database Schema
-- Digital Igbo Language Tutor (Ohafia Dialect)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('learner', 'contributor', 'reviewer', 'admin');
CREATE TYPE age_group AS ENUM ('child', 'teen', 'adult', 'elder');
CREATE TYPE learning_style AS ENUM ('visual', 'auditory', 'kinesthetic', 'reading');
CREATE TYPE proficiency_level AS ENUM ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'fluent');
CREATE TYPE asset_type AS ENUM ('word', 'phrase', 'sentence', 'proverb', 'greeting', 'dialogue');
CREATE TYPE asset_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE attempt_type AS ENUM ('pronunciation', 'listening', 'flashcard', 'quiz');

-- ============================================
-- PROFILES TABLE
-- Extended user data linked to Supabase Auth
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    age_group age_group,
    learning_style learning_style,
    proficiency_level proficiency_level DEFAULT 'beginner',
    native_language TEXT DEFAULT 'English',
    learning_goals TEXT[],
    role user_role DEFAULT 'learner',
    streak_count INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LESSONS TABLE
-- Structured learning units
-- ============================================

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty proficiency_level DEFAULT 'beginner',
    order_index INTEGER DEFAULT 0,
    estimated_minutes INTEGER DEFAULT 10,
    xp_reward INTEGER DEFAULT 10,
    is_published BOOLEAN DEFAULT FALSE,
    prerequisites UUID[],
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASSETS TABLE
-- Learning content (words, phrases, sentences)
-- ============================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    type asset_type NOT NULL,
    igbo_text TEXT NOT NULL,
    english_text TEXT NOT NULL,
    pronunciation_guide TEXT,
    cultural_note TEXT,
    category TEXT,
    tags TEXT[],
    audio_url TEXT,
    image_url TEXT,
    status asset_status DEFAULT 'draft',
    difficulty proficiency_level DEFAULT 'beginner',
    usage_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES profiles(id),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATTEMPTS TABLE
-- Learning activity records
-- ============================================

CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    type attempt_type NOT NULL,
    is_correct BOOLEAN,
    score DECIMAL(5,2),
    time_spent_seconds INTEGER,
    user_audio_url TEXT,
    feedback JSONB,
    synced BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROGRESS TABLE
-- User progress tracking per lesson
-- ============================================

CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_assets UUID[] DEFAULT '{}',
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    last_practiced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- ============================================
-- AUDIO SUBMISSIONS TABLE
-- Community audio recordings
-- ============================================

CREATE TABLE audio_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER,
    status asset_status DEFAULT 'pending',
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    is_primary BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACHIEVEMENTS TABLE
-- Gamification achievements
-- ============================================

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    xp_reward INTEGER DEFAULT 0,
    criteria JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- Track earned achievements
-- ============================================

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_last_active ON profiles(last_active_at);

-- Lessons
CREATE INDEX idx_lessons_category ON lessons(category);
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty);
CREATE INDEX idx_lessons_order ON lessons(order_index);
CREATE INDEX idx_lessons_published ON lessons(is_published);

-- Assets
CREATE INDEX idx_assets_lesson ON assets(lesson_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_created_by ON assets(created_by);

-- Attempts
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_asset ON attempts(asset_id);
CREATE INDEX idx_attempts_lesson ON attempts(lesson_id);
CREATE INDEX idx_attempts_created ON attempts(created_at);
CREATE INDEX idx_attempts_synced ON attempts(synced) WHERE synced = FALSE;

-- Progress
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_lesson ON progress(lesson_id);

-- Audio submissions
CREATE INDEX idx_audio_asset ON audio_submissions(asset_id);
CREATE INDEX idx_audio_status ON audio_submissions(status);
CREATE INDEX idx_audio_submitted_by ON audio_submissions(submitted_by);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON profiles
    FOR SELECT USING (TRUE);

-- Lessons policies
CREATE POLICY "Published lessons are viewable by all" ON lessons
    FOR SELECT USING (is_published = TRUE OR created_by = auth.uid());

CREATE POLICY "Contributors can create lessons" ON lessons
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('contributor', 'reviewer', 'admin'))
    );

CREATE POLICY "Admins can update lessons" ON lessons
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('reviewer', 'admin'))
    );

-- Assets policies
CREATE POLICY "Approved assets are viewable" ON assets
    FOR SELECT USING (status = 'approved' OR created_by = auth.uid());

CREATE POLICY "Users can create assets" ON assets
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own draft assets" ON assets
    FOR UPDATE USING (created_by = auth.uid() AND status = 'draft');

CREATE POLICY "Reviewers can update asset status" ON assets
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('reviewer', 'admin'))
    );

-- Attempts policies
CREATE POLICY "Users can view own attempts" ON attempts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own attempts" ON attempts
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Progress policies
CREATE POLICY "Users can view own progress" ON progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own progress" ON progress
    FOR ALL USING (user_id = auth.uid());

-- Audio submissions policies
CREATE POLICY "Approved audio is viewable" ON audio_submissions
    FOR SELECT USING (status = 'approved' OR submitted_by = auth.uid());

CREATE POLICY "Users can submit audio" ON audio_submissions
    FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Reviewers can update audio status" ON audio_submissions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('reviewer', 'admin'))
    );

-- Achievements policies
CREATE POLICY "Achievements are viewable by all" ON achievements
    FOR SELECT USING (is_active = TRUE);

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA - Sample Achievements
-- (No profile dependency)
-- ============================================

INSERT INTO achievements (name, description, icon, xp_reward, criteria) VALUES
    ('First Steps', 'Complete your first lesson', '🎯', 10, '{"lessons_completed": 1}'),
    ('Week Warrior', 'Maintain a 7-day streak', '🔥', 50, '{"streak_days": 7}'),
    ('Month Master', 'Maintain a 30-day streak', '⚡', 200, '{"streak_days": 30}'),
    ('Vocabulary Builder', 'Learn 50 words', '📚', 100, '{"words_learned": 50}'),
    ('Perfect Score', 'Get 100% on a lesson', '⭐', 25, '{"perfect_lessons": 1}'),
    ('Contributor', 'Submit your first asset', '✍️', 30, '{"assets_submitted": 1}'),
    ('Voice Actor', 'Record 10 pronunciations', '🎤', 50, '{"recordings": 10}'),
    ('Community Hero', 'Have 10 assets approved', '🏆', 150, '{"assets_approved": 10}');

-- ============================================
-- SEED DATA - Sample Lessons  
-- (No created_by, nullable field)
-- ============================================

INSERT INTO lessons (id, title, description, category, difficulty, order_index, estimated_minutes, xp_reward, is_published) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Greetings & Introductions', 'Learn essential Ohafia greetings and how to introduce yourself', 'basics', 'beginner', 1, 10, 15, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Numbers 1-10', 'Master counting from one to ten in Ohafia dialect', 'basics', 'beginner', 2, 8, 10, TRUE),
    ('33333333-3333-3333-3333-333333333333', 'Family Members', 'Learn words for family relationships', 'vocabulary', 'beginner', 3, 12, 15, TRUE),
    ('44444444-4444-4444-4444-444444444444', 'Common Phrases', 'Everyday expressions used in Ohafia', 'basics', 'beginner', 4, 15, 20, TRUE),
    ('55555555-5555-5555-5555-555555555555', 'Days & Time', 'Express days of the week and time concepts', 'vocabulary', 'elementary', 5, 10, 15, TRUE),
    ('66666666-6666-6666-6666-666666666666', 'Food & Dining', 'Vocabulary for food, cooking, and eating', 'vocabulary', 'elementary', 6, 15, 20, TRUE),
    ('77777777-7777-7777-7777-777777777777', 'Market Transactions', 'Practice buying and selling at the market', 'practical', 'intermediate', 7, 20, 30, TRUE),
    ('88888888-8888-8888-8888-888888888888', 'Ohafia Proverbs', 'Wisdom sayings and their meanings', 'culture', 'intermediate', 8, 25, 35, TRUE),
    ('99999999-9999-9999-9999-999999999999', 'Cultural Ceremonies', 'Language used in traditional Ohafia ceremonies', 'culture', 'upper_intermediate', 9, 30, 40, TRUE),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Advanced Conversations', 'Complex dialogues and discussions', 'advanced', 'advanced', 10, 35, 50, TRUE);

-- ============================================
-- SEED DATA - Sample Assets (Words & Phrases)
-- ============================================

-- Greetings & Introductions (Lesson 1)
INSERT INTO assets (lesson_id, type, igbo_text, english_text, pronunciation_guide, cultural_note, category, status, difficulty, created_by) VALUES
    ('11111111-1111-1111-1111-111111111111', 'greeting', 'Nna woo', 'Good morning', 'nna-woo-oo', 'Used from dawn until about 10am', 'greetings', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('11111111-1111-1111-1111-111111111111', 'greeting', 'Efifi ọma', 'Good afternoon', 'eh-fee-fee oh-mah', 'Used from noon until evening', 'greetings', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('11111111-1111-1111-1111-111111111111', 'greeting', 'Agbali ọma', 'Good evening', 'aa-gba-lee oh-mah', 'Used from late afternoon', 'greetings', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('11111111-1111-1111-1111-111111111111', 'phrase', 'Imelaghi?', 'How are you?', 'ime-laa-ghi', 'Casual greeting among friends', 'greetings', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('11111111-1111-1111-1111-111111111111', 'phrase', 'Ọ dị mma', 'I am fine / It is well', 'oh dee mm-mah', 'Common response to greetings', 'greetings', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('11111111-1111-1111-1111-111111111111', 'phrase', 'Afa m wụ...', 'My name is...', 'ah-faa mm wu', 'Used for introductions', 'introductions', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('11111111-1111-1111-1111-111111111111', 'phrase', 'Ndaa afa gị?', 'What is your name?', 'nda-aa ah-faa gee', 'Polite way to ask someone''s name', 'introductions', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('11111111-1111-1111-1111-111111111111', 'phrase', 'Nnọọ', 'Welcome', 'nn-naw-aw', 'Warm welcome to visitors', 'greetings', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000');

-- Numbers 1-10 (Lesson 2)
INSERT INTO assets (lesson_id, type, igbo_text, english_text, pronunciation_guide, category, status, difficulty, created_by) VALUES
    ('22222222-2222-2222-2222-222222222222', 'word', 'Olu', 'One', 'oh-loo', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222222', 'word', 'Abụọ', 'Two', 'ah-boo-oh', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222222', 'word', 'Atọ', 'Three', 'ah-taw', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222222', 'word', 'Anọ', 'Four', 'ah-naw', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222222', 'word', 'Ise', 'Five', 'ee-seh', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222222', 'word', 'Ishi', 'Six', 'ee-she', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222222', 'word', 'Asaa', 'Seven', 'ah-sah-ah', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222222', 'word', 'Asatọ', 'Eight', 'ah-sah-taw', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222222', 'word', 'Itoolu', 'Nine', 'ee-toh-loo', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222222', 'word', 'Iri', 'Ten', 'ee-ree', 'numbers', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000');

-- Family Members (Lesson 3)
INSERT INTO assets (lesson_id, type, igbo_text, english_text, pronunciation_guide, cultural_note, category, status, difficulty, created_by) VALUES
    ('33333333-3333-3333-3333-333333333333', 'word', 'Nna', 'Father', 'nn-nah', 'Also used as respectful address for elders', 'family', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333333', 'word', 'Nne', 'Mother', 'nn-neh', 'Term of endearment for women', 'family', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333333', 'word', 'Nwanne', 'Sibling', 'nwah-nneh', 'Literally means "child of mother"', 'family', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333333', 'word', 'Nwa', 'Child', 'nwah', 'Used affectionately', 'family', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333333', 'word', 'Nna ochie', 'Grandfather', 'nn-nah oh-chee-eh', 'Literally "old father"', 'family', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333333', 'word', 'Nne ochie', 'Grandmother', 'nn-neh oh-chee-eh', 'Literally "old mother"', 'family', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333333', 'word', 'Di', 'Husband', 'dee', 'Also means "owner" in some contexts', 'family', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333333', 'word', 'Nminye', 'Wife', 'nmee-nyeh', 'Respectful term', 'family', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000');

-- Common Phrases (Lesson 4)
INSERT INTO assets (lesson_id, type, igbo_text, english_text, pronunciation_guide, cultural_note, category, status, difficulty, created_by) VALUES
    ('44444444-4444-4444-4444-444444444444', 'phrase', 'Kaa', 'Thank you', 'ka-aa', 'Expression of gratitude', 'courtesy', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444444', 'phrase', 'Biko', 'Please', 'bee-koh', 'Used to make polite requests', 'courtesy', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444444', 'phrase', 'Kaa', 'Sorry', 'ka-aa', 'Expression of sympathy or apology', 'courtesy', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444444', 'phrase', 'Eh', 'Yes', 'ee-eh', 'Affirmative response', 'basics', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444444', 'phrase', 'Eh Eh', 'No', 'eeh-eh', 'Negative response', 'basics', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444444', 'phrase', 'Lee ruanya', 'Goodbye', 'lee-rua-aaa-yaa', 'Literally "let it be"', 'greetings', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444444', 'phrase', 'Ka odisia', 'See you later', 'kah oh-dee-see-ah', 'Casual farewell', 'greetings', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444444', 'phrase', 'Gịnị?', 'What?', 'gee-nee', 'Asking for clarification', 'questions', 'approved', 'beginner', '00000000-0000-0000-0000-000000000000');

-- Ohafia Proverbs (Lesson 8)
INSERT INTO assets (lesson_id, type, igbo_text, english_text, pronunciation_guide, cultural_note, category, status, difficulty, created_by) VALUES
    ('88888888-8888-8888-8888-888888888888', 'proverb', 'Onye weesa ọjị weesa ndụ', 'He who brings kola brings life', 'oh-nyeh weh-sa-aah oh-jee weh-sa-aah nn-doo', 'Reflects the sacred importance of kola nut in Igbo hospitality', 'proverbs', 'approved', 'intermediate', '00000000-0000-0000-0000-000000000000'),
    ('88888888-8888-8888-8888-888888888888', 'proverb', 'Egbe bere ugo bere', 'Let the kite perch, let the eagle perch', 'ehg-beh beh-reh oo-goh beh-reh', 'Philosophy of live and let live - peaceful coexistence', 'proverbs', 'approved', 'intermediate', '00000000-0000-0000-0000-000000000000'),
    ('88888888-8888-8888-8888-888888888888', 'proverb', 'Nwanta kpọọ nna ya oku, ọ ya-ata nkụ', 'A child who calls his father firewood will eat cold food', 'nwan-tah kpaw-aw nn-nah yah oh-koo, yaa-oo taa nku', 'Teaching respect for elders and consequences of disrespect', 'proverbs', 'approved', 'intermediate', '00000000-0000-0000-0000-000000000000'),
    ('88888888-8888-8888-8888-888888888888', 'proverb', 'Igwe bu ike', 'Unity is strength', 'ee-gweh boo ee-keh', 'Community and solidarity are paramount values', 'proverbs', 'approved', 'intermediate', '00000000-0000-0000-0000-000000000000'),
    ('88888888-8888-8888-8888-888888888888', 'proverb', 'Aka nri kwọọ aka ekpe, aka ekpe akwọọ aka nri', 'The right hand washes the left, the left washes the right', 'ah-kah nn-ree kwaw-aw ah-kah eh-kpeh', 'Mutual assistance and reciprocity in relationships', 'proverbs', 'approved', 'intermediate', '00000000-0000-0000-0000-000000000000');

-- ============================================
-- STORAGE BUCKETS & POLICIES
-- Run these in Supabase SQL Editor
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('audio', 'audio', TRUE, 10485760, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']),
    ('images', 'images', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('avatars', 'avatars', TRUE, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES - Audio Bucket
-- ============================================

-- Anyone can view audio files (public bucket)
CREATE POLICY "Public audio access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

-- Authenticated users can upload audio
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'audio' 
    AND auth.role() = 'authenticated'
);

-- Users can update their own audio files
CREATE POLICY "Users can update own audio"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own audio files
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- STORAGE POLICIES - Images Bucket
-- ============================================

-- Anyone can view images (public bucket)
CREATE POLICY "Public images access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Contributors/Admins can upload images
CREATE POLICY "Contributors can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('contributor', 'reviewer', 'admin')
    )
);

-- Admins can update images
CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'images' 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('reviewer', 'admin')
    )
);

-- Admins can delete images
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'images' 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- ============================================
-- STORAGE POLICIES - Avatars Bucket
-- ============================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Public avatars access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
