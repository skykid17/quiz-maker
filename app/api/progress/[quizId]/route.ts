import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ quizId: string }>
}

// GET /api/progress/[quizId] - Get progress for a quiz
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data: progress, error } = await supabase
    .from('progress')
    .select('*')
    .eq('quiz_id', quizId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No progress found - return null
      return NextResponse.json(null)
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(progress)
}

// POST /api/progress/[quizId] - Save progress
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params
  const supabase = await createClient()
  const body = await request.json()

  // Upsert progress
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progress, error } = await (supabase as any)
    .from('progress')
    .upsert(
      {
        quiz_id: quizId,
        current_question_index: body.currentQuestionIndex || 0,
        answers: body.answers || {},
        skipped_questions: body.skippedQuestions || [],
        mode: body.mode || null,
      },
      { onConflict: 'quiz_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(progress)
}

// DELETE /api/progress/[quizId] - Clear progress
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params
  const supabase = await createClient()

  const { error } = await supabase.from('progress').delete().eq('quiz_id', quizId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Progress cleared' })
}
