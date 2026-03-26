import {
  generateQuizSummary,
  createEmptyQuestion,
  createEmptyOption,
  validateImageFile,
} from '../lib/quizHelpers'
import type { Question } from '../lib/supabase/types'

describe('quizHelpers.ts', () => {
  describe('generateQuizSummary', () => {
    it('counts total questions', () => {
      const questions: Question[] = [
        { id: '1', question: 'Q1', type: 'single', answerOptions: [] },
        { id: '2', question: 'Q2', type: 'single', answerOptions: [] },
        { id: '3', question: 'Q3', type: 'single', answerOptions: [] },
      ]
      const summary = generateQuizSummary({ questions })
      expect(summary.totalQuestions).toBe(3)
    })

    it('counts single-select questions', () => {
      const questions: Question[] = [
        { id: '1', question: 'Q1', type: 'single', answerOptions: [{ id: '1', text: 'A', isCorrect: true, rationale: '' }] },
        { id: '2', question: 'Q2', type: 'single', answerOptions: [{ id: '2', text: 'B', isCorrect: true, rationale: '' }] },
      ]
      const summary = generateQuizSummary({ questions })
      expect(summary.singleSelectCount).toBe(2)
      expect(summary.multiSelectCount).toBe(0)
    })

    it('counts multi-select questions', () => {
      const questions: Question[] = [
        { id: '1', question: 'Q1', type: 'multiple', answerOptions: [
          { id: '1', text: 'A', isCorrect: true, rationale: '' },
          { id: '2', text: 'B', isCorrect: true, rationale: '' },
        ] },
      ]
      const summary = generateQuizSummary({ questions })
      expect(summary.singleSelectCount).toBe(0)
      expect(summary.multiSelectCount).toBe(1)
    })

    it('counts questions with images', () => {
      const questions: Question[] = [
        { id: '1', question: 'Q1', type: 'single', answerOptions: [], imageUrl: 'http://example.com/img1.jpg' },
        { id: '2', question: 'Q2', type: 'single', answerOptions: [] },
        { id: '3', question: 'Q3', type: 'single', answerOptions: [], imageUrl: 'http://example.com/img2.jpg' },
      ]
      const summary = generateQuizSummary({ questions })
      expect(summary.withImages).toBe(2)
    })

    it('handles empty questions array', () => {
      const summary = generateQuizSummary({ questions: [] })
      expect(summary.totalQuestions).toBe(0)
      expect(summary.singleSelectCount).toBe(0)
      expect(summary.multiSelectCount).toBe(0)
      expect(summary.withImages).toBe(0)
    })
  })

  describe('createEmptyQuestion', () => {
    it('creates question with correct structure', () => {
      const question = createEmptyQuestion()
      expect(question.id).toBeDefined()
      expect(question.question).toBe('')
      expect(question.type).toBe('single')
      expect(question.answerOptions).toHaveLength(2)
      expect(question.hint).toBe('')
      expect(question.imageUrl).toBe('')
    })

    it('creates question with 2 default options', () => {
      const question = createEmptyQuestion()
      expect(question.answerOptions).toHaveLength(2)
      expect(question.answerOptions[0].text).toBe('')
      expect(question.answerOptions[0].isCorrect).toBe(false)
    })
  })

  describe('createEmptyOption', () => {
    it('creates option with correct structure', () => {
      const option = createEmptyOption()
      expect(option.id).toBeDefined()
      expect(option.text).toBe('')
      expect(option.isCorrect).toBe(false)
      expect(option.rationale).toBe('')
      expect(option.imageUrl).toBe('')
    })
  })

  describe('validateImageFile', () => {
    it('returns error for file too large', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }) // 6MB
      expect(validateImageFile(file)).toBe('Image size must not exceed 5MB')
    })

    it('returns error for invalid file type', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })
      expect(validateImageFile(file)).toBe('Supported image formats: JPG, PNG, GIF, WebP')
    })

    it('returns null for valid image', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB
      expect(validateImageFile(file)).toBeNull()
    })

    it('returns null for PNG', () => {
      const file = new File([''], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      expect(validateImageFile(file)).toBeNull()
    })

    it('returns null for GIF', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      expect(validateImageFile(file)).toBeNull()
    })

    it('returns null for WebP', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      expect(validateImageFile(file)).toBeNull()
    })
  })
})