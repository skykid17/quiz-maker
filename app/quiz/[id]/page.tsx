import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import QuizDetailClient from './QuizDetailClient'

export default async function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch quiz and attempts in parallel
  const [{ data: quiz, error: quizError }, { data: attempts }] = await Promise.all([
    supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('attempts')
      .select('id, score, total_points, percentage, completed_at, duration, mode, questions_skipped')
      .eq('quiz_id', id)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
  ])

  if (quizError || !quiz) {
    notFound()
  }

  return <QuizDetailClient initialQuiz={quiz} initialAttempts={attempts ?? []} />
}