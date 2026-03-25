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
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !attempt || !attempt.quizId) {
        return (
            <div className="max-w-3xl mx-auto">
                <Link
                    href={`/quiz/${id}`}
                    className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to quiz
                </Link>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                    <h1 className="text-xl font-semibold text-red-900 mb-1">Unable to load review</h1>
                    <p className="text-red-700">{error || 'Attempt data is unavailable.'}</p>
                </div>
            </div>
        )
    }

    const quiz = attempt.quizId
    const answersByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer]))
    const scoreClass =
        attempt.percentage >= 80
            ? 'text-green-600'
            : attempt.percentage >= 60
                ? 'text-amber-600'
                : 'text-red-600'

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link
                href={`/quiz/${id}`}
                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to quiz
            </Link>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Review Attempt</h1>
                        <p className="text-gray-600 mt-1">{quiz.title}</p>
                        <p className="text-sm text-gray-500 mt-1">Attempt: {attempt.id}</p>
                    </div>
                    <div className="text-left md:text-right">
                        <p className={`text-3xl font-bold ${scoreClass}`}>{attempt.percentage}%</p>
                        <p className="text-sm text-gray-600">
                            {attempt.score.toFixed(2)} / {attempt.total_points} points
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Completed</p>
                        <p className="font-semibold text-gray-900">{formatDate(attempt.completed_at)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Mode</p>
                        <p className="font-semibold text-gray-900 capitalize">{attempt.mode} feedback</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDuration(attempt.duration)}
                        </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Questions</p>
                        <p className="font-semibold text-gray-900">{quiz.questions.length}</p>
                    </div>
                </div>

                {reviewStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-xs text-green-700">Correct</p>
                            <p className="text-xl font-semibold text-green-800">{reviewStats.strictCorrect}</p>
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <p className="text-xs text-blue-700">Partial</p>
                            <p className="text-xl font-semibold text-blue-800">{reviewStats.partial}</p>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-xs text-red-700">Incorrect</p>
                            <p className="text-xl font-semibold text-red-800">{reviewStats.incorrect}</p>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs text-amber-700">Skipped</p>
                            <p className="text-xl font-semibold text-amber-800">{reviewStats.skipped}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs text-gray-700">Avg / Question</p>
                            <p className="text-xl font-semibold text-gray-900">
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
                        <article key={question.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold mt-0.5">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">{question.question}</h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {question.type === 'multiple' ? 'Multi-select' : 'Single-select'}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left sm:text-right">
                                    <p className="text-sm text-gray-500 mb-1">Time</p>
                                    <p className="text-sm font-medium text-gray-800">{formatDuration(perQuestionDuration)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm mb-4">
                                {isSkipped && (
                                    <>
                                        <Circle className="w-4 h-4 text-amber-600" />
                                        <span className="text-amber-700 font-medium">Skipped</span>
                                    </>
                                )}
                                {!isSkipped && isStrictCorrect && (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <span className="text-green-700 font-medium">Correct</span>
                                    </>
                                )}
                                {!isSkipped && isPartial && (
                                    <>
                                        <Target className="w-4 h-4 text-blue-600" />
                                        <span className="text-blue-700 font-medium">
                                            Partial ({(answer?.pointsEarned || 0).toFixed(2)} pts)
                                        </span>
                                    </>
                                )}
                                {!isSkipped && !isStrictCorrect && !isPartial && (
                                    <>
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        <span className="text-red-700 font-medium">Incorrect</span>
                                    </>
                                )}
                            </div>

                            {question.imageUrl && (
                                <img
                                    src={question.imageUrl}
                                    alt="Question"
                                    className="rounded-lg border border-gray-200 max-h-56 max-w-full object-contain mb-4"
                                />
                            )}

                            <div className="space-y-2">
                                {question.answerOptions.map((option) => {
                                    const isSelected = selectedIds.includes(option.id)
                                    const isCorrectOption = correctIds.includes(option.id)

                                    let optionClass = 'border-gray-200 bg-white'
                                    if (isCorrectOption) {
                                        optionClass = 'border-green-300 bg-green-50'
                                    }
                                    if (isSelected && !isCorrectOption) {
                                        optionClass = 'border-red-300 bg-red-50'
                                    }

                                    return (
                                        <div key={option.id} className={`rounded-lg border p-3 ${optionClass}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900">{option.text}</p>
                                                    {option.rationale && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Rationale: {option.rationale}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {isSelected && (
                                                        <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                                            Your answer
                                                        </span>
                                                    )}
                                                    {isCorrectOption && (
                                                        <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                            Correct
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {question.hint && (
                                <div className="mt-4 text-sm text-gray-600 italic">Hint: {question.hint}</div>
                            )}
                        </article>
                    )
                })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-xl border border-gray-200 p-5">
                <div>
                    <p className="text-gray-900 font-semibold flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Final Score: {attempt.percentage}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        {attempt.score.toFixed(2)} out of {attempt.total_points} points earned
                    </p>
                </div>
                <Link
                    href={`/quiz/${quiz.id}/take`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-10 w-full sm:w-auto rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                    Retake Quiz
                </Link>
            </div>

            <p className="text-xs text-gray-500">
                Per-question time uses recorded values when available; otherwise it is estimated from total attempt duration.
            </p>
        </div>
    )
}
