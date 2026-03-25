import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/quizzes/[id]/duplicate - Duplicate quiz
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get original quiz
  const { data: original, error: fetchError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const originalData = original as Record<string, unknown>

  // Create duplicate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: duplicate, error: insertError } = await (supabase as any)
    .from('quizzes')
    .insert({
      user_id: user.id,
      title: `${originalData.title} (Copy)`,
      description: originalData.description,
      time_limit: originalData.time_limit,
      tags: originalData.tags,
      questions: originalData.questions,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(duplicate, { status: 201 })
}
