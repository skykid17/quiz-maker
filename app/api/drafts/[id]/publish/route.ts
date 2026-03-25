import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { processQuestions } from '@/lib/quizHelpers'
import { v4 as uuidv4 } from 'uuid'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/drafts/[id]/publish - Convert draft to quiz
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Get the draft
  const { data: draft, error: fetchError } = await supabase
    .from('quiz_drafts')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Type assertion for Supabase data
  const draftData = draft as Record<string, unknown>

  // Validate minimum requirements
  const questions = draftData.questions as unknown[]
  if (!questions || questions.length === 0) {
    return NextResponse.json(
      { error: 'Quiz must have at least one question' },
      { status: 400 }
    )
  }

  // Create quiz from draft
  const shareCode = draftData.auto_generate_share_code
    ? `QUIZ-${uuidv4().substring(0, 8).toUpperCase()}`
    : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quiz, error: insertError } = await (supabase as any)
    .from('quizzes')
    .insert({
      title: draftData.title,
      description: draftData.description,
      time_limit: draftData.time_limit,
      tags: draftData.tags,
      questions: processQuestions(draftData.questions as []),
      share_code: shareCode,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const quizData = quiz as Record<string, unknown>

  // Delete the draft
  await supabase.from('quiz_drafts').delete().eq('id', id)

  return NextResponse.json(
    { quizId: quizData.id, quiz: quizData, message: 'Quiz published successfully' },
    { status: 201 }
  )
}
