import type { Question, AttemptAnswer } from './supabase/types'

interface UserAnswer {
  questionId: string
  selectedOptionIds: string[]
}

export interface ScoreResult {
  score: number
  totalPoints: number
  percentage: number
  answers: AttemptAnswer[]
  questionsSkipped: number
}

export function calculateScore(
  questions: Question[],
  answers: UserAnswer[]
): ScoreResult {
  let totalScore = 0
  const totalPossible = questions.length
  const answerResults: AttemptAnswer[] = []
  let skippedCount = 0

  questions.forEach((question) => {
    const userAnswer = answers.find((a) => a.questionId === question.id)
    const correctOptions = question.answerOptions
      .filter((a) => a.isCorrect)
      .map((a) => a.id)

    if (!userAnswer || userAnswer.selectedOptionIds.length === 0) {
      skippedCount++
      answerResults.push({
        questionId: question.id,
        selectedOptionIds: [],
        correctOptionIds: correctOptions,
        pointsEarned: 0,
        isCorrect: false,
      })
      return
    }

    const selectedCorrect = userAnswer.selectedOptionIds.filter((id) =>
      correctOptions.includes(id)
    )
    const selectedWrong = userAnswer.selectedOptionIds.filter(
      (id) => !correctOptions.includes(id)
    )

    let pointsEarned = 0
    const pointsPerCorrect = 1 / correctOptions.length

    // Add points for correct selections
    pointsEarned += selectedCorrect.length * pointsPerCorrect
    // Subtract points for wrong selections
    pointsEarned -= selectedWrong.length * pointsPerCorrect
    // Ensure non-negative
    pointsEarned = Math.max(0, pointsEarned)

    totalScore += pointsEarned

    answerResults.push({
      questionId: question.id,
      selectedOptionIds: userAnswer.selectedOptionIds,
      correctOptionIds: correctOptions,
      pointsEarned,
      isCorrect: pointsEarned >= 1 - 0.001, // Account for floating point
    })
  })

  return {
    score: totalScore,
    totalPoints: totalPossible,
    percentage: Math.round((totalScore / totalPossible) * 100 * 100) / 100,
    answers: answerResults,
    questionsSkipped: skippedCount,
  }
}
