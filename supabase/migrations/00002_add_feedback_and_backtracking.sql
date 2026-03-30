-- Migration: Add feedback_mode and backtracking to quizzes and drafts
-- Allows quiz creators to preset feedback mode and enable/disable backtracking

-- ===================
-- QUIZZES TABLE UPDATES
-- ===================
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS feedback_mode VARCHAR(20) CHECK (feedback_mode IS NULL OR feedback_mode IN ('immediate', 'end')),
ADD COLUMN IF NOT EXISTS backtracking BOOLEAN DEFAULT TRUE;

-- ===================
-- QUIZ DRAFTS TABLE UPDATES
-- ===================
ALTER TABLE quiz_drafts
ADD COLUMN IF NOT EXISTS feedback_mode VARCHAR(20) CHECK (feedback_mode IS NULL OR feedback_mode IN ('immediate', 'end')),
ADD COLUMN IF NOT EXISTS backtracking BOOLEAN DEFAULT TRUE;

-- ===================
-- INDEXES FOR NEW COLUMNS
-- ===================
CREATE INDEX IF NOT EXISTS idx_quizzes_feedback_mode ON quizzes(feedback_mode) WHERE feedback_mode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_backtracking ON quizzes(backtracking) WHERE backtracking = FALSE;
