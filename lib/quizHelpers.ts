import type { Question, AnswerOption } from './supabase/types'
import { generateId, inferQuestionType } from './validation'

// Image validation
export function validateImageFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!validTypes.includes(file.type)) {
    return 'Supported image formats: JPG, PNG, GIF, WebP'
  }

  if (file.size > maxSize) {
    return 'Image size must not exceed 5MB'
  }

  return null
}

// Quiz summary generation
export interface QuizSummary {
  totalQuestions: number
  totalOptions: number
  multiSelectCount: number
  singleSelectCount: number
  withImages: number
  withHints: number
  withRationales: number
}

export function generateQuizSummary(quizData: { questions?: Question[] }): QuizSummary {
  const totalQuestions = quizData.questions?.length || 0
  const totalOptions =
    quizData.questions?.reduce((sum, q) => sum + (q.answerOptions?.length || 0), 0) || 0
  const multiSelectCount =
    quizData.questions?.filter(
      (q) => q.answerOptions?.filter((a) => a.isCorrect).length > 1
    ).length || 0
  const withImages =
    quizData.questions?.filter(
      (q) => q.imageUrl || q.answerOptions?.some((a) => a.imageUrl)
    ).length || 0

  return {
    totalQuestions,
    totalOptions,
    multiSelectCount,
    singleSelectCount: totalQuestions - multiSelectCount,
    withImages,
    withHints: quizData.questions?.filter((q) => q.hint).length || 0,
    withRationales:
      quizData.questions?.filter((q) => q.answerOptions?.some((a) => a.rationale))
        .length || 0,
  }
}

// Factory functions for creating empty entities
export function createEmptyQuestion(): Question {
  return {
    id: generateId(),
    question: '',
    hint: '',
    imageUrl: '',
    type: 'single',
    answerOptions: [createEmptyOption(), createEmptyOption()],
  }
}

export function createEmptyOption(): AnswerOption {
  return {
    id: generateId(),
    text: '',
    isCorrect: false,
    rationale: '',
    imageUrl: '',
  }
}

// Process questions to ensure proper structure
export function processQuestions(questions: Partial<Question>[]): Question[] {
  return questions.map((q) => {
    const answerOptions = (q.answerOptions || []).map((a) => ({
      id: a.id || generateId(),
      text: a.text || '',
      isCorrect: a.isCorrect || false,
      rationale: a.rationale || '',
      imageUrl: a.imageUrl || '',
    }))

    return {
      id: q.id || generateId(),
      question: q.question || '',
      hint: q.hint || '',
      imageUrl: q.imageUrl || '',
      answerOptions,
      type: inferQuestionType(answerOptions),
    }
  })
}
