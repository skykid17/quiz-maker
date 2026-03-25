import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/quizzes/[id]/share - Generate share code
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // First check if quiz exists and has share code
  const { data: quiz, error: fetchError } = await supabase
    .from('quizzes')
    .select('id, share_code')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const quizData = quiz as Record<string, unknown>

  // If already has share code, return it
  if (quizData.share_code) {
    return NextResponse.json({ shareCode: quizData.share_code })
  }

  // Generate new share code
  const shareCode = `QUIZ-${uuidv4().substring(0, 8).toUpperCase()}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('quizzes')
    .update({ share_code: shareCode })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ shareCode })
}
