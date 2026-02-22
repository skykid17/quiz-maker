import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Play, Edit2, Trash2, Share2, Download, Copy, 
  Clock, Trophy, AlertCircle, ChevronRight, ArrowLeft
} from 'lucide-react'
import { quizApi, attemptApi } from '../utils/api'
import ShareModal from '../components/ShareModal'

export default function QuizDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShare, setShowShare] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    loadQuiz()
  }, [id])

  const loadQuiz = async () => {
    try {
      const response = await quizApi.get(id)
      // Backend returns { quiz, attempts }
      const quizData = response.quiz || response
      const attemptsData = response.attempts || []
      setQuiz(quizData)
      setAttempts(attemptsData)
    } catch (err) {
      console.error('Failed to load quiz:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRename() {
    try {
      await quizApi.update(id, { title: newTitle })
      setQuiz({ ...quiz, title: newTitle })
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    try {
      await quizApi.delete(id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleExport() {
    try {
      const response = await fetch(`/api/quizzes/${id}/export`)
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quiz.title.replace(/[^a-z0-9]/gi, '_')}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDuplicate() {
    try {
      const newQuiz = await quizApi.duplicate(id)
      navigate(`/quiz/${newQuiz._id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  function getScoreColor(percentage) {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Quiz not found</p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">
          Go back to quizzes
        </Link>
      </div>
    )
  }

  const bestScore = attempts.length > 0 
    ? Math.max(...attempts.map(a => a.percentage))
    : null
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : null

  return (
    <div>
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to quizzes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none flex-1"
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setNewTitle(quiz.title)
                  }}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            )}
            <p className="text-gray-500 mt-1">{quiz.questions.length} questions</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/quiz/${id}/take`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Quiz
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Rename"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDuplicate}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {attempts.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Attempts</p>
              <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Best Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(bestScore)}`}>
                {bestScore}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Average</p>
              <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                {avgScore}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Questions Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Questions</h2>
        <div className="space-y-3">
          {quiz.questions.map((q, index) => (
            <div
              key={q._id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm flex items-center justify-center font-medium">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 line-clamp-2">{q.question}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {q.type === 'single' ? 'Single choice' : 'Multi-select'} • {q.answerOptions.length} options
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attempt History */}
      {attempts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attempt History</h2>
          <div className="space-y-3">
            {attempts.map((attempt, index) => (
              <Link
                key={attempt._id}
                to={`/quiz/${id}/review/${attempt._id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">#{attempts.length - index}</span>
                  <div>
                    <p className="text-sm text-gray-900">
                      {new Date(attempt.completedAt).toLocaleDateString()} at{' '}
                      {new Date(attempt.completedAt).toLocaleTimeString()}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(attempt.duration)}
                      </span>
                      <span className="capitalize">{attempt.mode} feedback</span>
                      {attempt.questionsSkipped > 0 && (
                        <span className="text-yellow-600">
                          {attempt.questionsSkipped} skipped
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${getScoreColor(attempt.percentage)}`}>
                    {attempt.percentage}%
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          quizId={id}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Quiz?</h3>
            <p className="text-gray-600 mb-6">
              This will delete "{quiz.title}" and all {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
