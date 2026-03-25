-- Migration: Initial schema for Quiz Maker application
-- Creates tables: quizzes, quiz_drafts, attempts, progress

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================
-- QUIZZES TABLE
-- ===================
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  current_question_index INTEGER DEFAULT 0,

  -- Answers stored as JSONB object: { "questionId": ["optionId1", "optionId2"] }
  answers JSONB DEFAULT '{}',

  skipped_questions TEXT[] DEFAULT '{}',
  mode VARCHAR(20) CHECK (mode IN ('immediate', 'end')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One progress record per quiz (without auth, this is global)
  UNIQUE(quiz_id)
);

-- ===================
-- INDEXES
-- ===================
CREATE INDEX idx_quizzes_updated_at ON quizzes(updated_at DESC);
CREATE INDEX idx_quizzes_share_code ON quizzes(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX idx_attempts_quiz_id ON attempts(quiz_id);
CREATE INDEX idx_attempts_completed_at ON attempts(completed_at DESC);
CREATE INDEX idx_progress_quiz_id ON progress(quiz_id);

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
-- ROW LEVEL SECURITY (disabled for now - no auth)
-- ===================
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (for initial no-auth implementation)
CREATE POLICY "Allow all access to quizzes" ON quizzes FOR ALL USING (true);
CREATE POLICY "Allow all access to quiz_drafts" ON quiz_drafts FOR ALL USING (true);
CREATE POLICY "Allow all access to attempts" ON attempts FOR ALL USING (true);
CREATE POLICY "Allow all access to progress" ON progress FOR ALL USING (true);
