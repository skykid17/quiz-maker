import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Clock, Trophy, Eye, EyeOff, AlertCircle, ChevronLeft, 
  ChevronRight, HelpCircle, CheckCircle, XCircle, X
} from 'lucide-react'
import { quizApi, progressApi, attemptApi } from '../utils/api'

export default function TakeQuizPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(null) // 'immediate' | 'end'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: [optionId] }
  const [hintsUsed, setHintsUsed] = useState([]) // questionIds
  const [skipped, setSkipped] = useState([]) // questionIds
  const [questionRevealed, setQuestionRevealed] = useState(false) // for immediate mode
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [savedProgress, setSavedProgress] = useState(false)
  const [startedAt, setStartedAt] = useState(null) // track when quiz started

  useEffect(() => {
    loadQuiz()
  }, [id])

  useEffect(() => {
    if (quiz && mode) {
      saveProgress()
    }
  }, [answers, currentIndex, hintsUsed, skipped, mode])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      const response = await quizApi.get(id)
      
      // Backend returns { quiz, attempts }
      const quizData = response.quiz || response
      console.log('Loaded quiz:', quizData)
      setQuiz(quizData)
      
      // Check for existing progress
      try {
        const progress = await progressApi.get(id)
        if (progress) {
          setAnswers(progress.answers || {})
          setCurrentIndex(progress.currentQuestionIndex || 0)
          setHintsUsed(progress.hintsUsed || [])
          setSkipped(progress.skippedQuestions || [])
          setMode(progress.mode)
          setSavedProgress(true)
        }
      } catch (e) {
        // No progress found, start fresh
        console.log('No existing progress')
      }
    } catch (err) {
      console.error('Failed to load quiz:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = async () => {
    try {
      await progressApi.save(id, {
        currentQuestionIndex: currentIndex,
        answers,
        hintsUsed,
        skippedQuestions: skipped,
        mode
      })
    } catch (err) {
      console.error('Failed to save progress:', err)
    }
  }

  const handleStartQuiz = (selectedMode) => {
    setMode(selectedMode)
    setStartedAt(new Date().toISOString())
  }

  const currentQuestion = quiz?.questions?.[currentIndex]
  const isMultiSelect = currentQuestion?.answerOptions?.filter(o => o.isCorrect).length > 1
  const currentAnswer = answers[currentQuestion?._id] || []
  const isHintUsed = hintsUsed.includes(currentQuestion?._id)
  const isSkipped = skipped.includes(currentQuestion?._id)

  const handleSelectOption = (optionId) => {
    if (questionRevealed && mode === 'immediate') return // Can't change after reveal in immediate mode
    
    const questionId = currentQuestion._id
    
    if (isMultiSelect) {
      // Toggle selection for multi-select
      setAnswers(prev => {
        const current = prev[questionId] || []
        const newSelection = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
        return { ...prev, [questionId]: newSelection }
      })
    } else {
      // Single select
      setAnswers(prev => ({ ...prev, [questionId]: [optionId] }))
    }
    
    // Remove from skipped if answering
    if (skipped.includes(questionId)) {
      setSkipped(prev => prev.filter(id => id !== questionId))
    }
  }

  const handleUseHint = () => {
    if (!hintsUsed.includes(currentQuestion._id)) {
      setHintsUsed(prev => [...prev, currentQuestion._id])
    }
  }

  const handleSkip = () => {
    if (!skipped.includes(currentQuestion._id)) {
      setSkipped(prev => [...prev, currentQuestion._id])
    }
    goToNext()
  }

  const handleReveal = () => {
    setQuestionRevealed(true)
  }

  const goToNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setQuestionRevealed(false)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setQuestionRevealed(false)
    }
  }

  const goToQuestion = (index) => {
    setCurrentIndex(index)
    setQuestionRevealed(false)
  }

  const handleSubmit = async (force = false) => {
    const unanswered = quiz.questions.filter(q => !answers[q._id] || answers[q._id].length === 0)
    
    if (!force && unanswered.length > 0) {
      setShowSkipConfirm(true)
      return
    }
    
    try {
      // Calculate duration in seconds
      const duration = startedAt 
        ? Math.round((new Date() - new Date(startedAt)) / 1000)
        : 0
      
      const attemptData = {
        quizId: id,
        startedAt: startedAt || new Date().toISOString(),
        duration,
        answers: Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
          questionId,
          selectedOptionIds
        })),
        hintsUsed,
        mode,
        questionsSkipped: skipped.length
      }
      
      const attempt = await attemptApi.submit(attemptData)
      
      // Clear progress
      await progressApi.clear(id)
      
      navigate(`/quiz/${id}/review/${attempt._id}`)
    } catch (err) {
      console.error('Failed to submit quiz:', err)
    }
  }

  const handleExit = () => {
    setShowExitConfirm(true)
  }

  const confirmExit = () => {
    saveProgress()
    navigate(`/quiz/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Quiz not found</p>
      </div>
    )
  }

  // Mode selection screen
  if (!mode) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-gray-600 mb-6">{quiz.questions.length} questions</p>
          
          {savedProgress && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">You have unsaved progress</p>
                <p className="text-sm text-amber-700">Your previous attempt was saved. Select a mode to continue.</p>
              </div>
            </div>
          )}
          
          <h2 className="text-lg font-semibold mb-4">Choose your scoring mode</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => handleStartQuiz('immediate')}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium">Immediate Feedback</p>
                  <p className="text-sm text-gray-500">See answers and rationale after each question</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleStartQuiz('end')}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <EyeOff className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium">End Feedback</p>
                  <p className="text-sm text-gray-500">See all results after completing the quiz</p>
                </div>
              </div>
            </button>
          </div>
          
          <button
            onClick={() => navigate(`/quiz/${id}`)}
            className="mt-6 text-gray-600 hover:text-gray-800"
          >
            ← Back to quiz details
          </button>
        </div>
      </div>
    )
  }

  // Quiz taking screen
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold">{quiz.title}</h1>
            <p className="text-sm text-gray-500">
              Question {currentIndex + 1} of {quiz.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {mode === 'immediate' ? 'Immediate Feedback' : 'End Feedback'}
            </span>
            <button
              onClick={handleExit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Question navigator */}
        <div className="mt-4 flex flex-wrap gap-2">
          {quiz.questions.map((q, idx) => {
            const isAnswered = answers[q._id] && answers[q._id].length > 0
            const isSkippedQ = skipped.includes(q._id)
            const isCurrent = idx === currentIndex
            
            return (
              <button
                key={q._id}
                onClick={() => goToQuestion(idx)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isSkippedQ
                    ? 'bg-amber-100 text-amber-700'
                    : isAnswered
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isMultiSelect && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Multi-select
                </span>
              )}
              {isSkipped && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  Skipped
                </span>
              )}
            </div>
            <h2 className="text-lg font-medium">{currentQuestion.question || currentQuestion.text}</h2>
          </div>
          
          {currentQuestion.hint && (
            <button
              onClick={handleUseHint}
              disabled={isHintUsed}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                isHintUsed
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              {isHintUsed ? 'Hint Used' : 'Show Hint'}
            </button>
          )}
        </div>
        
        {isHintUsed && currentQuestion.hint && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            💡 {currentQuestion.hint}
          </div>
        )}

        {/* Answer options */}
        <div className="space-y-3">
          {currentQuestion.answerOptions.map((option) => {
            const isSelected = currentAnswer.includes(option._id)
            const showCorrectness = questionRevealed && mode === 'immediate'
            
            let optionClass = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            
            if (showCorrectness) {
              if (option.isCorrect) {
                optionClass = 'border-green-500 bg-green-50'
              } else if (isSelected && !option.isCorrect) {
                optionClass = 'border-red-500 bg-red-50'
              }
            } else if (isSelected) {
              optionClass = 'border-blue-500 bg-blue-50'
            }
            
            return (
              <button
                key={option._id}
                onClick={() => handleSelectOption(option._id)}
                disabled={showCorrectness}
                className={`w-full p-4 text-left border-2 rounded-xl transition-all ${optionClass}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="flex-1">{option.text}</span>
                  {showCorrectness && option.isCorrect && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {showCorrectness && isSelected && !option.isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Rationale (shown after reveal in immediate mode) */}
        {questionRevealed && mode === 'immediate' && (
          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-gray-700">Rationale</h3>
            {currentQuestion.answerOptions.map((option) => (
              <div key={option._id} className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-gray-700 mb-1">{option.text}</p>
                <p className="text-gray-600">{option.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        
        <div className="flex items-center gap-3">
          {mode === 'immediate' && !questionRevealed && (
            <button
              onClick={handleReveal}
              disabled={currentAnswer.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Reveal Answer
            </button>
          )}
          
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Skip
          </button>
          
          {currentIndex < quiz.questions.length - 1 ? (
            <button
              onClick={goToNext}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Exit Quiz?</h3>
            <p className="text-gray-600 mb-4">
              Your progress will be saved. You can continue later.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmExit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip confirmation modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold">Skipped Questions</h3>
                <p className="text-gray-600">
                  You have {quiz.questions.filter(q => !answers[q._id] || answers[q._id].length === 0).length} unanswered question(s). 
                  Skipped questions will receive 0 points.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Go Back
              </button>
              <button
                onClick={() => handleSubmit(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
