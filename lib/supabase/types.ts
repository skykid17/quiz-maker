// Database types for Supabase PostgreSQL

export interface AnswerOption {
  id: string
  text: string
  isCorrect: boolean
  rationale?: string
  imageUrl?: string
}

export interface Question {
  id: string
  question: string
  hint?: string
  imageUrl?: string
  type: 'single' | 'multiple'
  answerOptions: AnswerOption[]
}

export interface Quiz {
  id: string
  title: string
  description: string
  time_limit: number | null
  tags: string[]
  share_code: string | null
  questions: Question[]
  created_at: string
  updated_at: string
}

export interface QuizDraft {
  id: string
  title: string
  description: string
  time_limit: number | null
  tags: string[]
  auto_generate_share_code: boolean
  questions: Question[]
  current_step: number
  created_at: string
  updated_at: string
}

export interface AttemptAnswer {
  questionId: string
  selectedOptionIds: string[]
  correctOptionIds: string[]
  pointsEarned: number
  isCorrect: boolean
}

export interface Attempt {
  id: string
  quiz_id: string
  answers: AttemptAnswer[]
  score: number
  total_points: number
  percentage: number
  started_at: string
  completed_at: string
  duration: number
  mode: 'immediate' | 'end'
  questions_skipped: number
}

export interface Progress {
  id: string
  quiz_id: string
  current_question_index: number
  answers: Record<string, string[]>
  skipped_questions: string[]
  mode: 'immediate' | 'end' | null
  started_at: string
  updated_at: string
}

// API response types (camelCase for frontend)
export interface QuizWithStats extends Quiz {
  questionCount: number
  attemptCount: number
  bestScore: number | null
  lastAttempt: string | null
}

// Database table types for Supabase
export interface Database {
  public: {
    Tables: {
      quizzes: {
        Row: Quiz
        Insert: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Quiz, 'id' | 'created_at'>>
      }
      quiz_drafts: {
        Row: QuizDraft
        Insert: Omit<QuizDraft, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<QuizDraft, 'id' | 'created_at'>>
      }
      attempts: {
        Row: Attempt
        Insert: Omit<Attempt, 'id'>
        Update: Partial<Omit<Attempt, 'id'>>
      }
      progress: {
        Row: Progress
        Insert: Omit<Progress, 'id' | 'started_at' | 'updated_at'>
        Update: Partial<Omit<Progress, 'id' | 'started_at'>>
      }
    }
  }
}
