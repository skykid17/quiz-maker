import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Helper to verify user owns the quiz
 */
async function verifyQuizOwnership(
  supabase: any,
  quizId: string,
  userId: string
): Promise<{ quiz: any; error: null | { status: number; message: string } }> {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { quiz: null, error: { status: 404, message: 'Quiz not found' } }
    }
    return { quiz: null, error: { status: 500, message: error.message } }
  }

  return { quiz, error: null }
}

// GET /api/quizzes/[id] - Get quiz by ID (user must own it)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
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

    // Fetch quiz and attempts in parallel
    const [{ data: quiz, error: quizError }, { data: attempts }] = await Promise.all([
      supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('attempts')
        .select('id, score, total_points, percentage, completed_at, duration, mode, questions_skipped')
        .eq('quiz_id', id)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false }),
    ])

    if (quizError) {
      if (quizError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
      }
      return NextResponse.json({ error: quizError.message }, { status: 500 })
    }

    return NextResponse.json(
      { quiz, attempts: attempts || [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch quiz'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/quizzes/[id] - Update quiz (user must own it)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
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

    // Verify user owns this quiz
    const { quiz: existingQuiz, error: ownershipError } = await verifyQuizOwnership(
      supabase,
      id,
      user.id
    )

    if (ownershipError) {
      return NextResponse.json(
        { error: ownershipError.message },
        { status: ownershipError.status }
      )
    }

    const body = await request.json()
    const { title, description, time_limit, tags, feedback_mode, backtracking } = body

    const updateData: Record<string, unknown> = { title }
    if (description !== undefined) updateData.description = description
    if (time_limit !== undefined) updateData.time_limit = time_limit
    if (tags !== undefined) updateData.tags = tags
    if (feedback_mode !== undefined) updateData.feedback_mode = feedback_mode
    if (backtracking !== undefined) updateData.backtracking = backtracking

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedQuiz, error } = await (supabase as any)
      .from('quizzes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedQuiz)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update quiz'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/quizzes/[id] - Delete quiz (user must own it)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
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

    // Verify user owns this quiz
    const { quiz: existingQuiz, error: ownershipError } = await verifyQuizOwnership(
      supabase,
      id,
      user.id
    )

    if (ownershipError) {
      return NextResponse.json(
        { error: ownershipError.message },
        { status: ownershipError.status }
      )
    }

    // Delete quiz (RLS policies and FK cascades ensure data integrity)
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete quiz'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
