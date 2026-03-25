import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ attemptId: string }>
}

// GET /api/attempts/[attemptId] - Get single attempt details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { attemptId } = await params
  const supabase = await createClient()

  const { data: attempt, error } = await supabase
    .from('attempts')
    .select(`
      *,
      quizzes (*)
    `)
    .eq('id', attemptId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  // Type assertion since Supabase returns unknown
  const attemptData = attempt as Record<string, unknown>

  return NextResponse.json({
    ...attemptData,
    _id: attemptData.id,
    quizId: attemptData.quizzes,
  })
}

// DELETE /api/attempts/[attemptId] - Delete attempt
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { attemptId } = await params
  const supabase = await createClient()

  const { error } = await supabase.from('attempts').delete().eq('id', attemptId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Attempt deleted' })
}
