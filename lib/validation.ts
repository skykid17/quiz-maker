import type { Question, AnswerOption } from './supabase/types'

// Validation functions

export function validateQuizTitle(title: string | undefined | null): string | null {
  if (!title || title.trim().length === 0) {
    return 'Quiz title is required'
  }
  if (title.trim().length < 3) {
    return 'Quiz title must be at least 3 characters'
  }
  if (title.length > 200) {
    return 'Quiz title must not exceed 200 characters'
  }
  return null
}

export function validateDescription(description: string | undefined | null): string | null {
  if (description && description.length > 1000) {
    return 'Description must not exceed 1000 characters'
  }
  return null
}

export function validateTimeLimit(timeLimit: number | null | undefined): string | null {
  if (timeLimit !== null && timeLimit !== undefined) {
    if (isNaN(timeLimit)) {
      return 'Time limit must be a number'
    }
    if (timeLimit < 5 || timeLimit > 180) {
      return 'Time limit must be between 5 and 180 minutes'
    }
  }
  return null
}

export function validateTags(tags: string[] | undefined | null): string | null {
  if (tags && tags.length > 10) {
    return 'Maximum 10 tags allowed'
  }
  if (tags) {
    for (let i = 0; i < tags.length; i++) {
      if (tags[i].length > 30) {
        return `Tag ${i + 1} must not exceed 30 characters`
      }
    }
  }
  return null
}

export interface QuizData {
  title?: string
  description?: string
  timeLimit?: number | null
  tags?: string[]
  questions?: Question[]
}

export function validateQuizData(data: QuizData): string[] {
  const errors: string[] = []

  // Validate title
  if (data.title && data.title.trim().length < 3) {
    errors.push('Quiz title must be at least 3 characters')
  }

  if (data.title && data.title.length > 200) {
    errors.push('Quiz title must not exceed 200 characters')
  }

  // Validate description
  if (data.description && data.description.length > 1000) {
    errors.push('Description must not exceed 1000 characters')
  }

  // Validate time limit
  if (data.timeLimit !== null && data.timeLimit !== undefined) {
    if (data.timeLimit < 5 || data.timeLimit > 180) {
      errors.push('Time limit must be between 5 and 180 minutes')
    }
  }

  // Validate tags
  if (data.tags && data.tags.length > 10) {
    errors.push('Maximum 10 tags allowed')
  }

  if (data.tags) {
    data.tags.forEach((tag, index) => {
      if (tag.length > 30) {
        errors.push(`Tag ${index + 1} must not exceed 30 characters`)
      }
    })
  }

  if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('At least one question is required')
    return errors
  }

  if (data.questions.length > 100) {
    errors.push('Maximum 100 questions allowed')
  }

  data.questions.forEach((q, qIndex) => {
    const questionText = q.question
    if (!questionText || typeof questionText !== 'string') {
      errors.push(`Question ${qIndex + 1}: question text is required`)
    } else if (questionText.length < 5) {
      errors.push(`Question ${qIndex + 1}: question text must be at least 5 characters`)
    }

    if (!q.answerOptions || !Array.isArray(q.answerOptions)) {
      errors.push(`Question ${qIndex + 1}: answerOptions array is required`)
      return
    }

    if (q.answerOptions.length < 2) {
      errors.push(`Question ${qIndex + 1}: must have at least 2 answer options`)
    }

    if (q.answerOptions.length > 8) {
      errors.push(`Question ${qIndex + 1}: maximum 8 answer options allowed`)
    }

    const correctCount = q.answerOptions.filter((a) => a.isCorrect === true).length
    if (correctCount === 0) {
      errors.push(`Question ${qIndex + 1}: at least one correct answer is required`)
    }

    // Check for duplicate option texts
    const optionTexts = q.answerOptions.map((a) => a.text?.trim()).filter(Boolean)
    const uniqueTexts = new Set(optionTexts)
    if (optionTexts.length !== uniqueTexts.size) {
      errors.push(`Question ${qIndex + 1}: option texts must be unique`)
    }

    q.answerOptions.forEach((a, aIndex) => {
      if (!a.text || typeof a.text !== 'string' || a.text.trim().length === 0) {
        errors.push(`Question ${qIndex + 1}, Option ${aIndex + 1}: option text is required`)
      }
    })
  })

  return errors
}

// Infer question type from answer options
export function inferQuestionType(answerOptions: AnswerOption[]): 'single' | 'multiple' {
  const correctCount = answerOptions.filter((a) => a.isCorrect === true).length
  return correctCount > 1 ? 'multiple' : 'single'
}

// Normalize question data (ensure all fields have proper values)
export function normalizeQuestion(q: Partial<Question> & { text?: string }): Question {
  const answerOptions = (q.answerOptions || []).map((a) => ({
    id: a.id || generateId(),
    text: a.text || '',
    isCorrect: a.isCorrect || false,
    rationale: a.rationale || '',
    imageUrl: a.imageUrl || '',
  }))

  return {
    id: q.id || generateId(),
    question: q.text || q.question || '',
    hint: q.hint || '',
    imageUrl: q.imageUrl || '',
    answerOptions,
    type: inferQuestionType(answerOptions),
  }
}

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// Validate individual question (for frontend form validation)
export function validateQuestion(question: Question): string[] {
  const errors: string[] = []

  if (!question.question || question.question.trim().length === 0) {
    errors.push('Question text is required')
  } else if (question.question.trim().length < 10) {
    errors.push('Question text must be at least 10 characters')
  } else if (question.question.length > 500) {
    errors.push('Question text must not exceed 500 characters')
  }

  if (question.hint && question.hint.length > 300) {
    errors.push('Hint must not exceed 300 characters')
  }

  if (!question.answerOptions || question.answerOptions.length < 2) {
    errors.push('At least 2 answer options are required')
  } else if (question.answerOptions.length > 8) {
    errors.push('Maximum 8 answer options allowed')
  } else {
    const correctCount = question.answerOptions.filter((a) => a.isCorrect).length
    if (correctCount === 0) {
      errors.push('At least one correct answer is required')
    }

    // Check for duplicate option texts
    const optionTexts = question.answerOptions.map((a) => a.text?.trim()).filter(Boolean)
    const uniqueTexts = new Set(optionTexts)
    if (optionTexts.length !== uniqueTexts.size) {
      errors.push('Option texts must be unique')
    }

    // Validate each option
    question.answerOptions.forEach((option, index) => {
      if (!option.text || option.text.trim().length === 0) {
        errors.push(`Option ${index + 1} text is required`)
      } else if (option.text.length > 200) {
        errors.push(`Option ${index + 1} text must not exceed 200 characters`)
      }

      if (option.rationale && option.rationale.length > 300) {
        errors.push(`Option ${index + 1} rationale must not exceed 300 characters`)
      }
    })
  }

  return errors
}

// Validate single option
export function validateOption(
  option: AnswerOption,
  allOptions: AnswerOption[]
): string[] {
  const errors: string[] = []

  if (!option.text || option.text.trim().length === 0) {
    errors.push('Option text is required')
  } else if (option.text.length > 200) {
    errors.push('Option text must not exceed 200 characters')
  }

  // Check for duplicates among other options
  const duplicateCount = allOptions.filter(
    (o) => o.text?.trim().toLowerCase() === option.text?.trim().toLowerCase()
  ).length

  if (duplicateCount > 1) {
    errors.push('Option text must be unique')
  }

  return errors
}
