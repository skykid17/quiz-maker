import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/quizzes/[id]/export - Export quiz as JSON
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

  const quizData = quiz as Record<string, unknown>

  const exportData = {
    title: quizData.title,
    description: quizData.description,
    timeLimit: quizData.time_limit,
    tags: quizData.tags,
    questions: (quizData.questions as { question: string; hint?: string; imageUrl?: string; answerOptions: { text: string; isCorrect: boolean; rationale?: string; imageUrl?: string }[] }[]).map((q) => ({
      question: q.question,
      hint: q.hint,
      imageUrl: q.imageUrl,
      answerOptions: q.answerOptions.map((a) => ({
        text: a.text,
        isCorrect: a.isCorrect,
        rationale: a.rationale,
        imageUrl: a.imageUrl,
      })),
    })),
  }

  const safeTitle = String(quizData.title).replace(/[^a-z0-9]/gi, '_')

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${safeTitle}.json"`,
    },
  })
}
