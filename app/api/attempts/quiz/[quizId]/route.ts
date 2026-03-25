import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ quizId: string }>
}

// GET /api/attempts/quiz/[quizId] - Get attempts for specific quiz
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data: attempts, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .order('completed_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const transformedAttempts = (attempts || []).map((attempt) => {
    const attemptData = attempt as Record<string, unknown>
    return {
      ...attemptData,
      _id: attemptData.id,
    }
  })

  return NextResponse.json(transformedAttempts)
}
