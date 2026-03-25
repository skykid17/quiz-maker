import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateQuizData } from '@/lib/validation'
import { processQuestions } from '@/lib/quizHelpers'

// POST /api/quizzes/import - Import quiz from JSON
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const quizData = await request.json()

  // Validate
  const errors = validateQuizData(quizData)
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 })
  }

  // Process questions
  const processedQuestions = processQuestions(quizData.questions)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quizzes')
    .insert({
      title: quizData.title || 'Untitled Quiz',
      description: quizData.description || '',
      time_limit: quizData.timeLimit || null,
      tags: quizData.tags || [],
      questions: processedQuestions,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
