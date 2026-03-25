import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ code: string }>
}

// GET /api/quizzes/shared/[code] - Get shared quiz by code
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { code } = await params
  const supabase = await createClient()

  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('share_code', code)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(quiz)
}
