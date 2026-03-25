import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateScore } from '@/lib/scoring'
import type { Question } from '@/lib/supabase/types'

// GET /api/attempts - Get all attempts (history)
export async function GET() {
  const supabase = await createClient()

  // Get attempts with quiz info
  const { data: attempts, error } = await supabase
    .from('attempts')
    .select(`
      *,
      quizzes (
        id,
        title
      )
    `)
    .order('completed_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to match expected format
  const transformedAttempts = (attempts || []).map((attempt) => {
    const attemptData = attempt as Record<string, unknown>
    return {
      ...attemptData,
      _id: attemptData.id,
      quizId: attemptData.quizzes,
    }
  })

  return NextResponse.json(transformedAttempts)
}

// POST /api/attempts - Submit quiz attempt
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { quizId, answers, startedAt, mode } = body

  // Get quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (quizError) {
    if (quizError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    return NextResponse.json({ error: quizError.message }, { status: 500 })
  }

  const quizData = quiz as { questions: Question[] }
  const completedAt = new Date().toISOString()
  const duration = Math.floor(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
  )

  const scoreResult = calculateScore(quizData.questions, answers)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: attempt, error: insertError } = await (supabase as any)
    .from('attempts')
    .insert({
      quiz_id: quizId,
      answers: scoreResult.answers,
      score: scoreResult.score,
      total_points: scoreResult.totalPoints,
      percentage: scoreResult.percentage,
      started_at: startedAt,
      completed_at: completedAt,
      duration,
      mode,
      questions_skipped: scoreResult.questionsSkipped,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const attemptData = attempt as Record<string, unknown>
  return NextResponse.json(
    {
      ...attemptData,
      _id: attemptData.id,
    },
    { status: 201 }
  )
}
