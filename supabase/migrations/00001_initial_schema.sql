-- Migration: Initial schema with authentication and RLS for Quiz Maker
-- This consolidated migration includes database schema, auth isolation, and storage policies.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================
-- QUIZZES TABLE
-- ===================
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL DEFAULT 'Untitled Quiz',
  description TEXT DEFAULT '',
  time_limit INTEGER CHECK (time_limit IS NULL OR (time_limit >= 5 AND time_limit <= 180)),
  tags TEXT[] DEFAULT '{}',
  share_code VARCHAR(20) UNIQUE,

  -- Questions stored as JSONB array
  -- Structure: [{
  --   id: string,
  --   question: string,
  --   hint?: string,
  --   imageUrl?: string,
  --   type: 'single' | 'multiple',
  --   answerOptions: [{
  --     id: string,
  --     text: string,
  --     isCorrect: boolean,
  --     rationale?: string,
  --     imageUrl?: string
  --   }]
  -- }]
  questions JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- QUIZ DRAFTS TABLE
-- ===================
CREATE TABLE quiz_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) DEFAULT 'Untitled Quiz',
  description TEXT DEFAULT '',
  time_limit INTEGER CHECK (time_limit IS NULL OR (time_limit >= 5 AND time_limit <= 180)),
  tags TEXT[] DEFAULT '{}',
  auto_generate_share_code BOOLEAN DEFAULT TRUE,
  questions JSONB NOT NULL DEFAULT '[]',
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 3),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- ATTEMPTS TABLE
-- ===================
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,

  -- Answers stored as JSONB array
  -- Structure: [{
  --   questionId: string,
  --   selectedOptionIds: string[],
  --   correctOptionIds: string[],
  --   pointsEarned: number,
  --   isCorrect: boolean
  -- }]
  answers JSONB NOT NULL DEFAULT '[]',

  score DECIMAL(10,4) DEFAULT 0,
  total_points DECIMAL(10,4) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER DEFAULT 0, -- seconds
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('immediate', 'end')),
  questions_skipped INTEGER DEFAULT 0
);

-- ===================
-- PROGRESS TABLE (for resumable quizzes)
-- ===================
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  current_question_index INTEGER DEFAULT 0,

  -- Answers stored as JSONB object: { "questionId": ["optionId1", "optionId2"] }
  answers JSONB DEFAULT '{}',

  skipped_questions TEXT[] DEFAULT '{}',
  mode VARCHAR(20) CHECK (mode IN ('immediate', 'end')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One progress record per user per quiz
  CONSTRAINT progress_quiz_user_id_unique UNIQUE(quiz_id, user_id)
);

-- ===================
-- INDEXES
-- ===================
CREATE INDEX idx_quizzes_updated_at ON quizzes(updated_at DESC);
CREATE INDEX idx_quizzes_share_code ON quizzes(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_quizzes_user_updated ON quizzes(user_id, updated_at DESC);

CREATE INDEX idx_quiz_drafts_user_id ON quiz_drafts(user_id);
CREATE INDEX idx_quiz_drafts_user_updated ON quiz_drafts(user_id, updated_at DESC);

CREATE INDEX idx_attempts_quiz_id ON attempts(quiz_id);
CREATE INDEX idx_attempts_completed_at ON attempts(completed_at DESC);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_user_quiz ON attempts(user_id, quiz_id);

CREATE INDEX idx_progress_quiz_id ON progress(quiz_id);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_user_quiz ON progress(user_id, quiz_id);

-- ===================
-- AUTO-UPDATE TRIGGER FOR updated_at
-- ===================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER quiz_drafts_updated_at
  BEFORE UPDATE ON quiz_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===================
-- ROW LEVEL SECURITY
-- ===================
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Restrictive user-scoped policies
CREATE POLICY "Users can SELECT own quizzes"
ON quizzes FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can INSERT own quizzes"
ON quizzes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can UPDATE own quizzes"
ON quizzes FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can DELETE own quizzes"
ON quizzes FOR DELETE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can SELECT own drafts"
ON quiz_drafts FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can INSERT own drafts"
ON quiz_drafts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can UPDATE own drafts"
ON quiz_drafts FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can DELETE own drafts"
ON quiz_drafts FOR DELETE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can SELECT own attempts"
ON attempts FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can INSERT own attempts"
ON attempts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can UPDATE own attempts"
ON attempts FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can DELETE own attempts"
ON attempts FOR DELETE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can SELECT own progress"
ON progress FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can INSERT own progress"
ON progress FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can UPDATE own progress"
ON progress FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can DELETE own progress"
ON progress FOR DELETE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ===================
-- STORAGE BUCKET + POLICIES
-- ===================
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-images', 'quiz-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'quiz-images');

CREATE POLICY "Allow Uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'quiz-images');

CREATE POLICY "Allow Updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'quiz-images');

CREATE POLICY "Allow Deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'quiz-images');
