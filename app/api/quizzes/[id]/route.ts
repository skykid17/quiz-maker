import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/quizzes/[id] - Get quiz by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get attempt history
  const { data: attempts } = await supabase
    .from('attempts')
    .select('id, score, total_points, percentage, completed_at, duration, mode, questions_skipped')
    .eq('quiz_id', id)
    .order('completed_at', { ascending: false })

  return NextResponse.json({ quiz, attempts: attempts || [] })
}

// PUT /api/quizzes/[id] - Update quiz (rename)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { title } = await request.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quiz, error } = await (supabase as any)
    .from('quizzes')
    .update({ title })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(quiz)
}

// DELETE /api/quizzes/[id] - Delete quiz
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Delete quiz (progress and attempts will cascade delete due to FK)
  const { error } = await supabase.from('quizzes').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Quiz deleted successfully' })
}
