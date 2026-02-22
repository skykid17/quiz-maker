import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Trophy, Clock, CheckCircle, XCircle, ChevronLeft, 
  ChevronRight, Home, RotateCcw, AlertCircle
} from 'lucide-react'
import { attemptApi } from '../utils/api'

export default function ReviewPage() {
  const { id, attemptId } = useParams()
  const navigate = useNavigate()
  
  const [attempt, setAttempt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    loadAttempt()
  }, [attemptId])

  const loadAttempt = async () => {
    try {
      const data = await attemptApi.get(attemptId)
      setAttempt(data)
    } catch (err) {
      console.error('Failed to load attempt:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Attempt not found</p>
      </div>
    )
  }

  const { quizId, answers, score, totalPoints, percentage, completedAt, mode, hintsUsed, questionsSkipped } = attempt
  const questions = quizId?.questions || []
  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?._id)
  // Use percentage from backend, or calculate if not available
  const displayPercentage = percentage ?? (totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0)

  const isMultiSelect = currentQuestion?.answerOptions?.filter(o => o.isCorrect).length > 1
  const hintUsedForCurrent = hintsUsed?.includes(currentQuestion?._id)

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{quizId?.title || 'Quiz'}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Completed on {new Date(completedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${
              displayPercentage >= 70 ? 'text-green-600' : 
              displayPercentage >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {displayPercentage}%
            </div>
            <p className="text-gray-500 text-sm">{score} / {totalPoints} points</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>{displayPercentage >= 70 ? 'Great job!' : displayPercentage >= 50 ? 'Good effort!' : 'Keep practicing!'}</span>
          </div>
          {questionsSkipped > 0 && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span>{questionsSkipped} skipped</span>
            </div>
          )}
        </div>

        {/* Question navigator */}
        <div className="mt-4 flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const answer = answers.find(a => a.questionId === q._id)
            const isCorrect = answer?.isCorrect
            const isPartial = answer?.pointsEarned > 0 && !answer?.isCorrect
            
            return (
              <button
                key={q._id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  idx === currentIndex
                    ? 'bg-blue-600 text-white'
                    : isCorrect
                    ? 'bg-green-100 text-green-700'
                    : isPartial
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Question Review */}
      {currentQuestion && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Question {currentIndex + 1}</span>
              {isMultiSelect && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Multi-select
                </span>
              )}
              {hintUsedForCurrent && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Hint used
                </span>
              )}
            </div>
            <div className="text-sm">
              {currentAnswer?.isCorrect ? (
                <span className="text-green-600 font-medium">✓ Correct</span>
              ) : currentAnswer?.pointsEarned > 0 ? (
                <span className="text-amber-600 font-medium">~ Partial ({currentAnswer.pointsEarned} pts)</span>
              ) : (
                <span className="text-red-600 font-medium">✗ Incorrect</span>
              )}
            </div>
          </div>

          <h2 className="text-lg font-medium">{currentQuestion.question || currentQuestion.text}</h2>

          {/* Answer options */}
          <div className="space-y-3">
            {currentQuestion.answerOptions.map((option) => {
              const isSelected = currentAnswer?.selectedOptionIds?.includes(option._id)
              
              let optionClass = 'border-gray-200'
              if (option.isCorrect) {
                optionClass = 'border-green-500 bg-green-50'
              } else if (isSelected && !option.isCorrect) {
                optionClass = 'border-red-500 bg-red-50'
              }
              
              return (
                <div
                  key={option._id}
                  className={`p-4 border-2 rounded-xl ${optionClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className="flex-1">{option.text}</span>
                    {option.isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {isSelected && !option.isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                  
                  {/* Rationale */}
                  {option.rationale && (
                    <div className="mt-3 ml-8 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                      {option.rationale}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
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
          <Link
            to={`/quiz/${id}`}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Home className="w-5 h-5" />
            Quiz Details
          </Link>
          
          <Link
            to={`/quiz/${id}/take`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </Link>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === questions.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
