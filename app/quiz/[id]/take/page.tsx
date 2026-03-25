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

  // Quiz data
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Quiz state
  const [mode, setMode] = useState<FeedbackMode | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [skippedQuestions, setSkippedQuestions] = useState<string[]>([])
  const [startedAt, setStartedAt] = useState<string>('')
  const [showHint, setShowHint] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  // Auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasUnsavedChanges = useRef(false)

  // Load quiz and progress
  useEffect(() => {
    loadQuizAndProgress()
  }, [id])

  const loadQuizAndProgress = async () => {
    try {
      setLoading(true)
      const { quiz: quizData } = await quizApi.get(id!)
      setQuiz(quizData)

      // Check for existing progress
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

  // Auto-save progress
  const saveProgress = useCallback(async () => {
    if (!id || !mode) return

    try {
      await progressApi.save(id, {
        currentQuestionIndex: currentIndex,
        answers,
        skippedQuestions,
        mode,
      })
      hasUnsavedChanges.current = false
    } catch (err) {
      console.error('Failed to save progress:', err)
    }
  }, [id, mode, currentIndex, answers, skippedQuestions])

  // Debounced save
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

  // Start quiz with selected mode
  const handleStartQuiz = (selectedMode: FeedbackMode) => {
    setMode(selectedMode)
    setStartedAt(new Date().toISOString())
    setCurrentIndex(0)
    setAnswers({})
    setSkippedQuestions([])
  }

  // Handle answer selection
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

    // Remove from skipped if answered
    if (newAnswers.length > 0 && skippedQuestions.includes(questionId)) {
      setSkippedQuestions(skippedQuestions.filter((id) => id !== questionId))
    }
  }

  // Submit answer for immediate feedback
  const handleSubmitAnswer = () => {
    setShowFeedback(true)
    hasUnsavedChanges.current = true
    saveProgress()
  }

  // Navigate to next question
  const handleNext = () => {
    if (!quiz) return

    setShowFeedback(false)
    setShowHint(false)

    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      hasUnsavedChanges.current = true
    }
  }

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowFeedback(false)
      setShowHint(false)
      hasUnsavedChanges.current = true
    }
  }

  // Skip current question
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

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (!quiz || !mode) return

    setIsSubmitting(true)
    setShowSubmitConfirm(false)

    try {
      // Format answers for submission
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

      // Clear progress
      await progressApi.clear(quiz.id)

      // Navigate to review page
      router.push(`/quiz/${quiz.id}/review/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz')
      setIsSubmitting(false)
    }
  }

  // Handle timer expiry
  const handleTimerExpire = () => {
    handleSubmitQuiz()
  }

  // Calculate progress
  const answeredCount = quiz
    ? quiz.questions.filter((q) => (answers[q.id]?.length || 0) > 0).length
    : 0
  const progressPercent = quiz ? (answeredCount / quiz.questions.length) * 100 : 0

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Error state
  if (error || !quiz) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Quiz</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href={`/quiz/${id}`}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to quiz
          </Link>
        </div>
      </div>
    )
  }

  // Mode selection screen
  if (!mode) {
    return (
      <div className="max-w-xl mx-auto">
        <Link
          href={`/quiz/${id}`}
          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to quiz
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          <p className="text-gray-600 mb-6">
            {quiz.questions.length} questions
            {quiz.time_limit && ` • ${quiz.time_limit} minute time limit`}
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Feedback Mode</h2>

          <div className="space-y-4">
            <button
              onClick={() => handleStartQuiz('immediate')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900 mb-1">Immediate Feedback</div>
              <div className="text-sm text-gray-600">
                See if your answer is correct after each question
              </div>
            </button>

            <button
              onClick={() => handleStartQuiz('end')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900 mb-1">End Feedback</div>
              <div className="text-sm text-gray-600">
                See all results only after completing the quiz
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Current question
  const question = quiz.questions[currentIndex]
  const selectedAnswers = answers[question.id] || []
  const isLastQuestion = currentIndex === quiz.questions.length - 1
  const hasAnswer = selectedAnswers.length > 0

  // Check if answer is correct (for immediate feedback)
  const correctOptionIds = question.answerOptions
    .filter((opt) => opt.isCorrect)
    .map((opt) => opt.id)
  const isCorrect =
    selectedAnswers.length === correctOptionIds.length &&
    selectedAnswers.every((id) => correctOptionIds.includes(id))

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/quiz/${id}`}
          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
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

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentIndex + 1} of {quiz.questions.length}
          </span>
          <span className="text-sm text-gray-500">
            {answeredCount} answered
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* Question */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-medium text-gray-900">{question.question}</h2>
            {question.hint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                  showHint
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Show hint"
              >
                <Lightbulb className="w-5 h-5" />
              </button>
            )}
          </div>

          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Question"
              className="mt-4 rounded-lg max-h-64 object-contain"
            />
          )}

          {showHint && question.hint && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{question.hint}</p>
            </div>
          )}

          <p className="mt-3 text-sm text-gray-500">
            {question.type === 'single' ? 'Select one answer' : 'Select all that apply'}
          </p>
        </div>

        {/* Answer Options */}
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
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  showCorrect
                    ? 'border-green-500 bg-green-50'
                    : showWrong
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      showCorrect
                        ? 'border-green-500 bg-green-500 text-white'
                        : showWrong
                          ? 'border-red-500 bg-red-500 text-white'
                          : isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300'
                    }`}
                  >
                    {showCorrect && <Check className="w-3 h-3" />}
                    {showWrong && <X className="w-3 h-3" />}
                    {!showFeedback && isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-900">{option.text}</span>
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt="Option"
                        className="mt-2 rounded max-h-32 object-contain"
                      />
                    )}
                    {showFeedback && option.rationale && (
                      <p className="mt-2 text-sm text-gray-600">{option.rationale}</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Immediate Feedback Result */}
        {showFeedback && (
          <div
            className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
              isCorrect ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            {isCorrect ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-medium text-green-800">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="font-medium text-red-800">Incorrect</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-3">
          {!showFeedback && (
            <button
              onClick={handleSkip}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
          )}

          {mode === 'immediate' && !showFeedback && hasAnswer && (
            <button
              onClick={handleSubmitAnswer}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Check Answer
            </button>
          )}

          {(mode === 'end' || showFeedback) && !isLastQuestion && (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isLastQuestion && (mode === 'end' || showFeedback) && (
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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

      {/* Question Navigation Dots */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
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
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                isCurrent
                  ? 'bg-blue-600 text-white'
                  : hasAnswerForQ
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : isSkipped
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Quiz?</h3>
            <p className="text-gray-600 mb-4">
              You have answered {answeredCount} of {quiz.questions.length} questions.
              {answeredCount < quiz.questions.length && (
                <span className="block mt-2 text-yellow-600">
                  Warning: {quiz.questions.length - answeredCount} questions are unanswered.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Continue Quiz
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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
