import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateQuizData, normalizeQuestion } from '@/lib/validation'
import { processQuestions } from '@/lib/quizHelpers'
import { v4 as uuidv4 } from 'uuid'

// GET /api/quizzes - List all quizzes owned by current user with stats
export async function GET() {
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

    // Query only the current user's quizzes (RLS enforces this on DB level too)
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      // Using a join to fetch attempts in the same query to fix N+1
      .select('id, title, questions, created_at, updated_at, share_code, user_id, attempts(percentage, completed_at)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Compute stats in memory
    const quizzesWithStats = (quizzes || []).map((quiz) => {
      const quizData = quiz as Record<string, unknown>
      const attemptsData = (quizData.attempts || []) as Array<{
        percentage: number
        completed_at: string
      }>
      
      // Remove attempts from the returned quiz object to keep response clean
      delete quizData.attempts

      const bestScore =
        attemptsData.length > 0
          ? Math.max(...attemptsData.map((a) => a.percentage))
          : null
      const lastAttempt =
        attemptsData.length > 0
          ? attemptsData.sort(
            (a, b) =>
              new Date(b.completed_at).getTime() -
              new Date(a.completed_at).getTime()
          )[0].completed_at
          : null

      return {
        ...quizData,
        questionCount: Array.isArray(quizData.questions) ? quizData.questions.length : 0,
        attemptCount: attemptsData.length,
        bestScore,
        lastAttempt,
      }
    })

    return NextResponse.json(quizzesWithStats)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch quizzes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/quizzes - Create new quiz owned by current user
export async function POST(request: NextRequest) {
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

    // Validate
    const errors = validateQuizData(body)
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    // Process questions and infer types
    const processedQuestions = processQuestions(body.questions)

    const shareCode =
      body.autoGenerateShareCode !== false
        ? `QUIZ-${uuidv4().substring(0, 8).toUpperCase()}`
        : body.shareCode || null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('quizzes')
      .insert({
        user_id: user.id,
        title: body.title || 'Untitled Quiz',
        description: body.description || '',
        time_limit: body.timeLimit || null,
        tags: body.tags || [],
        questions: processedQuestions,
        share_code: shareCode,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create quiz'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
