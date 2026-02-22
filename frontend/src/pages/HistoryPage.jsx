import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Clock, Trophy, Trash2, Eye, AlertCircle,
  ChevronRight
} from 'lucide-react'
import { attemptApi } from '../utils/api'

export default function HistoryPage() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    loadAttempts()
  }, [])

  const loadAttempts = async () => {
    try {
      const data = await attemptApi.getAll()
      setAttempts(data)
    } catch (err) {
      console.error('Failed to load attempts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (attemptId) => {
    try {
      await attemptApi.delete(attemptId)
      setAttempts(prev => prev.filter(a => a._id !== attemptId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete attempt:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (attempts.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No attempts yet</h2>
        <p className="text-gray-500 mb-6">Complete a quiz to see your history here.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Browse Quizzes
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Attempt History</h1>
        <p className="text-gray-500">{attempts.length} attempt(s)</p>
      </div>

      <div className="space-y-4">
        {attempts.map((attempt) => {
          const quizTitle = attempt.quizId?.title || 'Unknown Quiz'
          
          return (
            <div
              key={attempt._id}
              className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{quizTitle}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(attempt.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {attempt.questionsSkipped > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        {attempt.questionsSkipped} skipped
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${
                      (attempt.percentage ?? 0) >= 70 ? 'text-green-600' :
                      (attempt.percentage ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {attempt.percentage ?? 0}%
                    </span>
                    <p className="text-sm text-gray-500">
                      {attempt.score?.toFixed?.(1) ?? attempt.score} / {attempt.totalPoints} pts
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/quiz/${attempt.quizId?._id}/review/${attempt._id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Review"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(attempt._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Attempt?</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. The attempt record will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
