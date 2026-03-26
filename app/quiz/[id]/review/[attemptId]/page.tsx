'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Circle,
    Clock,
    Loader2,
    Target,
    Trophy,
    XCircle,
} from 'lucide-react'
import { attemptApi } from '@/lib/api'
import type { Attempt, AttemptAnswer, Quiz } from '@/lib/supabase/types'

interface AttemptWithQuiz extends Attempt {
    quizId: Quiz
}

interface AnswerWithTiming extends AttemptAnswer {
    timeTaken?: number
}

function formatDuration(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds))
    const hours = Math.floor(safeSeconds / 3600)
    const mins = Math.floor((safeSeconds % 3600) / 60)
    const secs = safeSeconds % 60

    if (hours > 0) {
        return `${hours}h ${mins}m ${secs}s`
    }
    if (mins > 0) {
        return `${mins}m ${secs}s`
    }
    return `${secs}s`
}

function formatDate(dateInput: string): string {
    const date = new Date(dateInput)
    if (Number.isNaN(date.getTime())) {
        return 'Unknown date'
    }
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function ReviewPage() {
    const { id, attemptId } = useParams<{ id: string; attemptId: string }>()
    const [attempt, setAttempt] = useState<AttemptWithQuiz | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadAttempt = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await attemptApi.get(attemptId)
                setAttempt(data as AttemptWithQuiz)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load attempt')
            } finally {
                setLoading(false)
            }
        }

        if (attemptId) {
            loadAttempt()
        }
    }, [attemptId])

    const reviewStats = useMemo(() => {
        const quiz = attempt?.quizId
        if (!attempt || !quiz?.questions) {
            return null
        }

        const answers = attempt.answers as AnswerWithTiming[]
        const strictCorrect = answers.filter((a) => a.isCorrect).length
        const partial = answers.filter((a) => !a.isCorrect && a.pointsEarned > 0).length
        const skipped = answers.filter((a) => a.selectedOptionIds.length === 0).length
        const incorrect = answers.length - strictCorrect - partial - skipped
        const totalQuestions = quiz.questions.length || answers.length || 1

        return {
            strictCorrect,
            partial,
            skipped,
            incorrect,
            totalQuestions,
            avgTimePerQuestion: attempt.duration / totalQuestions,
        }
    }, [attempt])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !attempt || !attempt.quizId) {
        return (
            <div className="max-w-3xl mx-auto">
                <Link
                    href={`/quiz/${id}`}
                    className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to quiz
                </Link>

                <div className="card p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h1 className="text-lg font-semibold text-stone-900 mb-1">Unable to load review</h1>
                    <p className="text-stone-500 text-sm">{error || 'Attempt data is unavailable.'}</p>
                </div>
            </div>
        )
    }

    const quiz = attempt.quizId
    const answersByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer]))
    const scoreClass =
        attempt.percentage >= 80
            ? 'text-emerald-600'
            : attempt.percentage >= 60
                ? 'text-amber-600'
                : 'text-red-600'

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link
                href={`/quiz/${id}`}
                className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to quiz
            </Link>

            <div className="card p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-stone-900">Review Attempt</h1>
                        <p className="text-stone-500 text-sm mt-1">{quiz.title}</p>
                    </div>
                    <div className="text-left md:text-right">
                        <p className={`text-3xl font-bold tracking-tight ${scoreClass}`}>{attempt.percentage}%</p>
                        <p className="text-xs text-stone-500 mt-0.5">
                            {attempt.score.toFixed(2)} / {attempt.total_points} points
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                    <div className="bg-stone-50 rounded-xl p-3">
                        <p className="text-[11px] uppercase tracking-wider text-stone-400 mb-1">Completed</p>
                        <p className="font-medium text-stone-900 text-sm">{formatDate(attempt.completed_at)}</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3">
                        <p className="text-[11px] uppercase tracking-wider text-stone-400 mb-1">Mode</p>
                        <p className="font-medium text-stone-900 text-sm capitalize">{attempt.mode} feedback</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3">
                        <p className="text-[11px] uppercase tracking-wider text-stone-400 mb-1">Duration</p>
                        <p className="font-medium text-stone-900 text-sm flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(attempt.duration)}
                        </p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3">
                        <p className="text-[11px] uppercase tracking-wider text-stone-400 mb-1">Questions</p>
                        <p className="font-medium text-stone-900 text-sm">{quiz.questions.length}</p>
                    </div>
                </div>

                {reviewStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
                        <div className="bg-emerald-50 rounded-xl p-3">
                            <p className="text-[11px] uppercase tracking-wider text-emerald-600">Correct</p>
                            <p className="text-lg font-semibold text-emerald-700">{reviewStats.strictCorrect}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3">
                            <p className="text-[11px] uppercase tracking-wider text-blue-600">Partial</p>
                            <p className="text-lg font-semibold text-blue-700">{reviewStats.partial}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3">
                            <p className="text-[11px] uppercase tracking-wider text-red-600">Incorrect</p>
                            <p className="text-lg font-semibold text-red-700">{reviewStats.incorrect}</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3">
                            <p className="text-[11px] uppercase tracking-wider text-amber-600">Skipped</p>
                            <p className="text-lg font-semibold text-amber-700">{reviewStats.skipped}</p>
                        </div>
                        <div className="bg-stone-100 rounded-xl p-3">
                            <p className="text-[11px] uppercase tracking-wider text-stone-500">Avg / Q</p>
                            <p className="text-lg font-semibold text-stone-700">
                                {formatDuration(reviewStats.avgTimePerQuestion)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {quiz.questions.map((question, index) => {
                    const answer = answersByQuestion.get(question.id) as AnswerWithTiming | undefined
                    const selectedIds = answer?.selectedOptionIds || []
                    const correctIds =
                        answer?.correctOptionIds || question.answerOptions.filter((o) => o.isCorrect).map((o) => o.id)
                    const isSkipped = selectedIds.length === 0
                    const isStrictCorrect = answer?.isCorrect || false
                    const isPartial = (answer?.pointsEarned || 0) > 0 && !isStrictCorrect
                    const perQuestionDuration = answer?.timeTaken || reviewStats?.avgTimePerQuestion || 0

                    return (
                        <article key={question.id} className="card p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h2 className="font-medium text-stone-900 leading-relaxed">{question.question}</h2>
                                        <p className="text-xs text-stone-400 mt-1">
                                            {question.type === 'multiple' ? 'Multi-select' : 'Single-select'}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <p className="text-[11px] text-stone-400 uppercase tracking-wider">Time</p>
                                    <p className="text-sm font-medium text-stone-700">{formatDuration(perQuestionDuration)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm mb-4">
                                {isSkipped && (
                                    <span className="badge-amber">
                                        <Circle className="w-3 h-3 mr-1" />
                                        Skipped
                                    </span>
                                )}
                                {!isSkipped && isStrictCorrect && (
                                    <span className="badge-green">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Correct
                                    </span>
                                )}
                                {!isSkipped && isPartial && (
                                    <span className="badge-blue">
                                        <Target className="w-3 h-3 mr-1" />
                                        Partial ({(answer?.pointsEarned || 0).toFixed(2)} pts)
                                    </span>
                                )}
                                {!isSkipped && !isStrictCorrect && !isPartial && (
                                    <span className="badge-red">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Incorrect
                                    </span>
                                )}
                            </div>

                            {question.imageUrl && (
                                <img
                                    src={question.imageUrl}
                                    alt="Question"
                                    className="rounded-xl max-h-56 object-contain mb-4"
                                />
                            )}

                            <div className="space-y-2">
                                {question.answerOptions.map((option) => {
                                    const isSelected = selectedIds.includes(option.id)
                                    const isCorrectOption = correctIds.includes(option.id)

                                    let optionClass = 'border-stone-200 bg-white'
                                    if (isCorrectOption) {
                                        optionClass = 'border-emerald-200 bg-emerald-50'
                                    }
                                    if (isSelected && !isCorrectOption) {
                                        optionClass = 'border-red-200 bg-red-50'
                                    }

                                    return (
                                        <div key={option.id} className={`rounded-xl border p-3 ${optionClass}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-stone-900">{option.text}</p>
                                                    {option.rationale && (
                                                        <p className="text-xs text-stone-500 mt-1">
                                                            {option.rationale}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {isSelected && (
                                                        <span className="badge-blue">Your answer</span>
                                                    )}
                                                    {isCorrectOption && (
                                                        <span className="badge-green">Correct</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {question.hint && (
                                <div className="mt-3 text-xs text-stone-400 italic">Hint: {question.hint}</div>
                            )}
                        </article>
                    )
                })}
            </div>

            <div className="card p-5 flex items-center justify-between">
                <div>
                    <p className="text-stone-900 font-semibold flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Final Score: {attempt.percentage}%
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                        {attempt.score.toFixed(2)} out of {attempt.total_points} points earned
                    </p>
                </div>
                <Link
                    href={`/quiz/${quiz.id}/take`}
                    className="btn-primary text-sm"
                >
                    Retake Quiz
                </Link>
            </div>

            <p className="text-[11px] text-stone-400">
                Per-question time uses recorded values when available; otherwise estimated from total duration.
            </p>
        </div>
    )
}
