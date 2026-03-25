import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ quizId: string }>
}

// GET /api/progress/[quizId] - Get progress for a quiz (current user only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params
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

    // Get progress for this user's quiz
    const { data: progress, error } = await supabase
      .from('progress')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No progress found - return null
        return NextResponse.json(null)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(progress)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/progress/[quizId] - Save progress (current user only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params
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

    // Upsert progress using user_id + quiz_id as composite key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: progress, error } = await (supabase as any)
      .from('progress')
      .upsert(
        {
          user_id: user.id,
          quiz_id: quizId,
          current_question_index: body.currentQuestionIndex || 0,
          answers: body.answers || {},
          skipped_questions: body.skippedQuestions || [],
          mode: body.mode || null,
        },
        { onConflict: 'quiz_id,user_id' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(progress)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/progress/[quizId] - Clear progress (current user only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params
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

    const { error } = await supabase
      .from('progress')
      .delete()
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Progress cleared' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to clear progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
