'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Lightbulb,
  SkipForward,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { quizApi, progressApi, attemptApi } from '@/lib/api'
import Timer from '@/components/Timer'
import type { Quiz, Question, AnswerOption } from '@/lib/supabase/types'

type FeedbackMode = 'immediate' | 'end'

interface QuizProgress {
  currentQuestionIndex: number
  answers: Record<string, string[]>
  skippedQuestions: string[]
  mode: FeedbackMode
  startedAt: string
}

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [mode, setMode] = useState<FeedbackMode | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [skippedQuestions, setSkippedQuestions] = useState<string[]>([])
  const [startedAt, setStartedAt] = useState<string>('')
  const [showHint, setShowHint] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasUnsavedChanges = useRef(false)

  useEffect(() => {
    loadQuizAndProgress()
  }, [id])

  const loadQuizAndProgress = async () => {
    try {
      setLoading(true)
      const { quiz: quizData } = await quizApi.get(id!)
      setQuiz(quizData)

      const progress = await progressApi.get(id!)
      if (progress) {
        setMode(progress.mode as FeedbackMode)
        setCurrentIndex(progress.current_question_index || 0)
        setAnswers(progress.answers || {})
        setSkippedQuestions(progress.skipped_questions || [])
        setStartedAt(progress.started_at || new Date().toISOString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = useCallback(async () => {
    if (!id || !mode) return

    try {
      await progressApi.save(id, {
        current_question_index: currentIndex,
        answers,
        skipped_questions: skippedQuestions,
        mode,
      })
      hasUnsavedChanges.current = false
    } catch (err) {
      console.error('Failed to save progress:', err)
    }
  }, [id, mode, currentIndex, answers, skippedQuestions])

  useEffect(() => {
    if (!mode || !hasUnsavedChanges.current) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveProgress()
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [answers, currentIndex, skippedQuestions, saveProgress, mode])

  const handleStartQuiz = (selectedMode: FeedbackMode) => {
    setMode(selectedMode)
    setStartedAt(new Date().toISOString())
    setCurrentIndex(0)
    setAnswers({})
    setSkippedQuestions([])
  }

  const handleAnswerSelect = (optionId: string) => {
    if (!quiz || showFeedback) return

    const question = quiz.questions[currentIndex]
    const questionId = question.id
    const currentAnswers = answers[questionId] || []

    let newAnswers: string[]
    if (question.type === 'single') {
      newAnswers = [optionId]
    } else {
      if (currentAnswers.includes(optionId)) {
        newAnswers = currentAnswers.filter((id) => id !== optionId)
      } else {
        newAnswers = [...currentAnswers, optionId]
      }
    }

    setAnswers({ ...answers, [questionId]: newAnswers })
    hasUnsavedChanges.current = true

    if (newAnswers.length > 0 && skippedQuestions.includes(questionId)) {
      setSkippedQuestions(skippedQuestions.filter((id) => id !== questionId))
    }
  }

  const handleSubmitAnswer = () => {
    setShowFeedback(true)
    hasUnsavedChanges.current = true
    saveProgress()
  }

  const handleNext = () => {
    if (!quiz) return
    setShowFeedback(false)
    setShowHint(false)
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      hasUnsavedChanges.current = true
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowFeedback(false)
      setShowHint(false)
      hasUnsavedChanges.current = true
    }
  }

  const handleSkip = () => {
    if (!quiz) return
    const questionId = quiz.questions[currentIndex].id
    if (!skippedQuestions.includes(questionId)) {
      setSkippedQuestions([...skippedQuestions, questionId])
    }
    setShowFeedback(false)
    setShowHint(false)
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    hasUnsavedChanges.current = true
  }

  const handleSubmitQuiz = async () => {
    if (!quiz || !mode) return
    setIsSubmitting(true)
    setShowSubmitConfirm(false)

    try {
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: answers[q.id] || [],
      }))

      const result = await attemptApi.submit({
        quizId: quiz.id,
        answers: formattedAnswers,
        startedAt,
        mode,
      })

      await progressApi.clear(quiz.id)
      router.push(`/quiz/${quiz.id}/review/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz')
      setIsSubmitting(false)
    }
  }

  const handleTimerExpire = () => {
    handleSubmitQuiz()
  }

  const answeredCount = quiz
    ? quiz.questions.filter((q) => (answers[q.id]?.length || 0) > 0).length
    : 0
  const progressPercent = quiz ? (answeredCount / quiz.questions.length) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-stone-900 mb-2">Error Loading Quiz</h2>
          <p className="text-stone-500 text-sm mb-4">{error}</p>
          <Link href={`/quiz/${id}`} className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to quiz
          </Link>
        </div>
      </div>
    )
  }

  if (!mode) {
    return (
      <div className="max-w-xl mx-auto">
        <Link
          href={`/quiz/${id}`}
          className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to quiz
        </Link>

        <div className="card p-8">
          <h1 className="text-xl font-semibold text-stone-900 mb-2">{quiz.title}</h1>
          <p className="text-stone-500 text-sm mb-6">
            {quiz.questions.length} questions
            {quiz.time_limit && ` · ${quiz.time_limit} minute time limit`}
          </p>

          <h2 className="text-base font-semibold text-stone-900 mb-4">Select Feedback Mode</h2>

          <div className="space-y-3">
            <button
              onClick={() => handleStartQuiz('immediate')}
              className="w-full p-4 border border-stone-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 text-left group"
            >
              <div className="font-medium text-stone-900 mb-1 group-hover:text-blue-700 transition-colors">Immediate Feedback</div>
              <div className="text-sm text-stone-500">
                See if your answer is correct after each question
              </div>
            </button>

            <button
              onClick={() => handleStartQuiz('end')}
              className="w-full p-4 border border-stone-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 text-left group"
            >
              <div className="font-medium text-stone-900 mb-1 group-hover:text-blue-700 transition-colors">End Feedback</div>
              <div className="text-sm text-stone-500">
                See all results only after completing the quiz
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const question = quiz.questions[currentIndex]
  const selectedAnswers = answers[question.id] || []
  const isLastQuestion = currentIndex === quiz.questions.length - 1
  const hasAnswer = selectedAnswers.length > 0

  const correctOptionIds = question.answerOptions
    .filter((opt) => opt.isCorrect)
    .map((opt) => opt.id)
  const isCorrect =
    selectedAnswers.length === correctOptionIds.length &&
    selectedAnswers.every((id) => correctOptionIds.includes(id))

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/quiz/${id}`}
          className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Quiz
        </Link>

        {quiz.time_limit && (
          <Timer
            initialSeconds={quiz.time_limit * 60}
            onExpire={handleTimerExpire}
          />
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">
            Question {currentIndex + 1} of {quiz.questions.length}
          </span>
          <span className="text-xs text-stone-500">
            {answeredCount} answered
          </span>
        </div>
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="card p-6 sm:p-8 mb-6">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-medium text-stone-900 leading-relaxed">{question.question}</h2>
            {question.hint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 ${
                  showHint
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
                title="Show hint"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
            )}
          </div>

          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Question"
              className="mt-4 rounded-xl max-h-64 object-contain"
            />
          )}

          {showHint && question.hint && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">{question.hint}</p>
            </div>
          )}

          <p className="mt-3 text-xs text-stone-400">
            {question.type === 'single' ? 'Select one answer' : 'Select all that apply'}
          </p>
        </div>

        <div className="space-y-3">
          {question.answerOptions.map((option) => {
            const isSelected = selectedAnswers.includes(option.id)
            const showCorrect = showFeedback && option.isCorrect
            const showWrong = showFeedback && isSelected && !option.isCorrect

            return (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                disabled={showFeedback}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  showCorrect
                    ? 'border-emerald-400 bg-emerald-50'
                    : showWrong
                      ? 'border-red-400 bg-red-50'
                      : isSelected
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      showCorrect
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : showWrong
                          ? 'border-red-500 bg-red-500 text-white'
                          : isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-stone-300'
                    }`}
                  >
                    {showCorrect && <Check className="w-3 h-3" />}
                    {showWrong && <X className="w-3 h-3" />}
                    {!showFeedback && isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-stone-900 text-sm">{option.text}</span>
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt="Option"
                        className="mt-2 rounded-lg max-h-32 object-contain"
                      />
                    )}
                    {showFeedback && option.rationale && (
                      <p className="mt-2 text-xs text-stone-500">{option.rationale}</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {showFeedback && (
          <div
            className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
              isCorrect ? 'bg-emerald-50' : 'bg-red-50'
            }`}
          >
            {isCorrect ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800 text-sm">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800 text-sm">Incorrect</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="btn-ghost"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {!showFeedback && (
            <button onClick={handleSkip} className="btn-ghost">
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
          )}

          {mode === 'immediate' && !showFeedback && hasAnswer && (
            <button onClick={handleSubmitAnswer} className="btn-primary text-sm">
              Check Answer
            </button>
          )}

          {(mode === 'end' || showFeedback) && !isLastQuestion && (
            <button onClick={handleNext} className="btn-primary text-sm">
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isLastQuestion && (mode === 'end' || showFeedback) && (
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Finish Quiz
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-1.5">
        {quiz.questions.map((q, idx) => {
          const hasAnswerForQ = (answers[q.id]?.length || 0) > 0
          const isSkipped = skippedQuestions.includes(q.id)
          const isCurrent = idx === currentIndex

          return (
            <button
              key={q.id}
              onClick={() => {
                setCurrentIndex(idx)
                setShowFeedback(false)
                setShowHint(false)
              }}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-warm-sm'
                  : hasAnswerForQ
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : isSkipped
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>

      {showSubmitConfirm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Submit Quiz?</h3>
            <p className="text-stone-500 text-sm mb-4">
              You have answered {answeredCount} of {quiz.questions.length} questions.
              {answeredCount < quiz.questions.length && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Warning: {quiz.questions.length - answeredCount} questions are unanswered.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="btn-ghost"
              >
                Continue Quiz
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
