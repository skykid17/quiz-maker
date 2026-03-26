import { calculateScore } from '../lib/scoring'
import type { Question } from '../lib/supabase/types'

describe('scoring.ts', () => {
  describe('calculateScore', () => {
    const createQuestion = (correctIds: string[], allIds: string[]): Question => {
      const options = allIds.map((id, idx) => ({
        id,
        text: `Option ${idx + 1}`,
        isCorrect: correctIds.includes(id),
        rationale: '',
      }))
      return {
        id: 'q1',
        question: 'Test question?',
        type: correctIds.length === 1 ? 'single' : 'multiple',
        answerOptions: options,
      }
    }

    it('returns 100% when all correct answers selected', () => {
      const question = createQuestion(['opt-A', 'opt-B'], ['opt-A', 'opt-B', 'opt-C', 'opt-D'])
      const answers = [{ questionId: 'q1', selectedOptionIds: ['opt-A', 'opt-B'] }]
      const result = calculateScore([question], answers)
      expect(result.percentage).toBe(100)
      expect(result.score).toBe(1)
    })

    it('returns 0% when no correct answers selected', () => {
      const question = createQuestion(['opt-A', 'opt-B'], ['opt-A', 'opt-B', 'opt-C', 'opt-D'])
      const answers = [{ questionId: 'q1', selectedOptionIds: ['opt-C', 'opt-D'] }]
      const result = calculateScore([question], answers)
      expect(result.percentage).toBe(0)
      expect(result.score).toBe(0)
    })

    it('returns 0% when wrong answer selected for single correct', () => {
      const question = createQuestion(['opt-A'], ['opt-A', 'opt-B', 'opt-C', 'opt-D'])
      const answers = [{ questionId: 'q1', selectedOptionIds: ['opt-B'] }]
      const result = calculateScore([question], answers)
      expect(result.percentage).toBe(0)
      expect(result.score).toBe(0)
    })

    it('returns 100% when only correct answer selected for single correct', () => {
      const question = createQuestion(['opt-A'], ['opt-A', 'opt-B', 'opt-C', 'opt-D'])
      const answers = [{ questionId: 'q1', selectedOptionIds: ['opt-A'] }]
      const result = calculateScore([question], answers)
      expect(result.percentage).toBe(100)
      expect(result.score).toBe(1)
    })

    it('handles partial credit for multi-select with some correct', () => {
      const question = createQuestion(['opt-A', 'opt-B'], ['opt-A', 'opt-B', 'opt-C', 'opt-D'])
      const answers = [{ questionId: 'q1', selectedOptionIds: ['opt-A'] }]
      const result = calculateScore([question], answers)
      expect(result.percentage).toBe(50)
      expect(result.score).toBe(0.5)
    })

    it('handles negative scoring for wrong selections', () => {
      const question = createQuestion(['opt-A', 'opt-B'], ['opt-A', 'opt-B', 'opt-C', 'opt-D'])
      const answers = [{ questionId: 'q1', selectedOptionIds: ['opt-A', 'opt-C'] }]
      const result = calculateScore([question], answers)
      // 0.5 (correct A) - 0.5 (wrong C) = 0
      expect(result.percentage).toBe(0)
      expect(result.score).toBe(0)
    })

    it('handles empty selection (skipped question)', () => {
      const question = createQuestion(['opt-A'], ['opt-A', 'opt-B', 'opt-C'])
      const answers = [{ questionId: 'q1', selectedOptionIds: [] }]
      const result = calculateScore([question], answers)
      expect(result.percentage).toBe(0)
      expect(result.questionsSkipped).toBe(1)
    })

    it('marks answer as correct when full score', () => {
      const question = createQuestion(['opt-A'], ['opt-A', 'opt-B', 'opt-C'])
      const answers = [{ questionId: 'q1', selectedOptionIds: ['opt-A'] }]
      const result = calculateScore([question], answers)
      expect(result.answers[0].isCorrect).toBe(true)
    })

    it('marks answer as incorrect when partial or zero score', () => {
      const question = createQuestion(['opt-A', 'opt-B'], ['opt-A', 'opt-B', 'opt-C'])
      const answers = [{ questionId: 'q1', selectedOptionIds: ['opt-A'] }]
      const result = calculateScore([question], answers)
      expect(result.answers[0].isCorrect).toBe(false)
    })
  })
})