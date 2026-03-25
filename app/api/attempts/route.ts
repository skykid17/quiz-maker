import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateScore } from '@/lib/scoring'
import type { Question } from '@/lib/supabase/types'

// GET /api/attempts - Get all attempts for current user (history)
export async function GET() {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get attempts with quiz info, filtered by user_id
    const { data: attempts, error } = await supabase
      .from('attempts')
      .select(
        `
      *,
      quizzes (
        id,
        title
      )
    `
      )
      .eq('user_id', user.id)
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch attempts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/attempts - Submit quiz attempt
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quizId, answers, startedAt, mode } = body

    // Get quiz and verify user owns it
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*, user_id')
      .eq('id', quizId)
      .single()

    if (quizError) {
      if (quizError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
      }
      return NextResponse.json({ error: quizError.message }, { status: 500 })
    }

    // Verify current user owns this quiz (important for shared quizzes)
    const quizData = quiz as { user_id?: string; questions: Question[] }
    if (quizData.user_id !== user.id) {
      // User didn't create this quiz, but they can still take it
      // Just ensure it exists (RLS will handle visibility)
    }

    const completedAt = new Date().toISOString()
    const duration = Math.floor(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
    )

    const scoreResult = calculateScore(quizData.questions, answers)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attempt, error: insertError } = await (supabase as any)
      .from('attempts')
      .insert({
        user_id: user.id,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit attempt'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
