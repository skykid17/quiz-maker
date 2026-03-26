import {
  validateQuizTitle,
  validateDescription,
  validateTimeLimit,
  validateTags,
  validateQuestion,
  inferQuestionType,
} from '../lib/validation'
import type { Question, AnswerOption } from '../lib/supabase/types'

describe('validation.ts', () => {
  describe('validateQuizTitle', () => {
    it('returns error for empty title', () => {
      expect(validateQuizTitle('')).toBe('Quiz title is required')
    })

    it('returns error for title too short', () => {
      expect(validateQuizTitle('ab')).toBe('Quiz title must be at least 3 characters')
    })

    it('returns error for title too long', () => {
      expect(validateQuizTitle('a'.repeat(201))).toBe('Quiz title must not exceed 200 characters')
    })

    it('returns null for valid title', () => {
      expect(validateQuizTitle('Valid Quiz Title')).toBeNull()
    })

    it('returns null for title at minimum length', () => {
      expect(validateQuizTitle('abc')).toBeNull()
    })
  })

  describe('validateDescription', () => {
    it('returns null for empty description (optional)', () => {
      expect(validateDescription('')).toBeNull()
    })

    it('returns error for description too long', () => {
      expect(validateDescription('a'.repeat(1001))).toBe('Description must not exceed 1000 characters')
    })

    it('returns null for valid description', () => {
      expect(validateDescription('A valid description')).toBeNull()
    })
  })

  describe('validateTimeLimit', () => {
    it('returns null for null time limit (optional)', () => {
      expect(validateTimeLimit(null)).toBeNull()
    })

    it('returns error for time limit too low', () => {
      expect(validateTimeLimit(4)).toBe('Time limit must be between 5 and 180 minutes')
    })

    it('returns error for time limit too high', () => {
      expect(validateTimeLimit(181)).toBe('Time limit must be between 5 and 180 minutes')
    })

    it('returns null for valid time limit', () => {
      expect(validateTimeLimit(30)).toBeNull()
    })

    it('returns null for time limit at boundaries', () => {
      expect(validateTimeLimit(5)).toBeNull()
      expect(validateTimeLimit(180)).toBeNull()
    })
  })

  describe('validateTags', () => {
    it('returns null for empty tags (optional)', () => {
      expect(validateTags([])).toBeNull()
    })

    it('returns error for too many tags', () => {
      expect(validateTags(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'])).toBe('Maximum 10 tags allowed')
    })

    it('returns error for tag too long', () => {
      expect(validateTags(['a'.repeat(31)])).toBe('Tag 1 must not exceed 30 characters')
    })

    it('returns null for valid tags', () => {
      expect(validateTags(['math', 'science', 'history'])).toBeNull()
    })
  })

  describe('validateQuestion', () => {
    const validOption: AnswerOption = {
      id: '1',
      text: 'Test option',
      isCorrect: true,
      rationale: '',
    }

    it('returns error for empty question text', () => {
      const question: Question = {
        id: 'q1',
        question: '',
        type: 'single',
        answerOptions: [validOption],
      }
      const errors = validateQuestion(question)
      expect(errors).toContain('Question text is required')
    })

    it('returns error for question text too short', () => {
      const question: Question = {
        id: 'q1',
        question: 'ab',
        type: 'single',
        answerOptions: [validOption],
      }
      const errors = validateQuestion(question)
      expect(errors).toContain('Question text must be at least 10 characters')
    })

    it('returns error for question text too long', () => {
      const question: Question = {
        id: 'q1',
        question: 'a'.repeat(501),
        type: 'single',
        answerOptions: [validOption],
      }
      const errors = validateQuestion(question)
      expect(errors).toContain('Question text must not exceed 500 characters')
    })

    it('returns error for less than 2 options', () => {
      const question: Question = {
        id: 'q1',
        question: 'Valid question?',
        type: 'single',
        answerOptions: [validOption],
      }
      const errors = validateQuestion(question)
      expect(errors).toContain('At least 2 answer options are required')
    })

    it('returns error for no correct answer', () => {
      const question: Question = {
        id: 'q1',
        question: 'Valid question?',
        type: 'single',
        answerOptions: [
          { id: '1', text: 'Wrong', isCorrect: false, rationale: '' },
          { id: '2', text: 'Also wrong', isCorrect: false, rationale: '' },
        ],
      }
      const errors = validateQuestion(question)
      expect(errors).toContain('At least one correct answer is required')
    })

    it('returns empty array for valid question', () => {
      const question: Question = {
        id: 'q1',
        question: 'What is 2+2?',
        type: 'single',
        answerOptions: [
          { id: '1', text: '3', isCorrect: false, rationale: '' },
          { id: '2', text: '4', isCorrect: true, rationale: '' },
        ],
      }
      expect(validateQuestion(question)).toEqual([])
    })
  })

  describe('inferQuestionType', () => {
    it('returns "single" when only one correct answer', () => {
      const options: AnswerOption[] = [
        { id: '1', text: 'A', isCorrect: true, rationale: '' },
        { id: '2', text: 'B', isCorrect: false, rationale: '' },
      ]
      expect(inferQuestionType(options)).toBe('single')
    })

    it('returns "multiple" when multiple correct answers', () => {
      const options: AnswerOption[] = [
        { id: '1', text: 'A', isCorrect: true, rationale: '' },
        { id: '2', text: 'B', isCorrect: true, rationale: '' },
      ]
      expect(inferQuestionType(options)).toBe('multiple')
    })

    it('returns "single" for empty options', () => {
      expect(inferQuestionType([])).toBe('single')
    })
  })
})