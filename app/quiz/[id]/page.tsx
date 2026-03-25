'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Play,
  Edit2,
  Trash2,
  Share2,
  Download,
  Copy,
  Clock,
  Trophy,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { quizApi } from '@/lib/api'
import ShareModal from '@/components/ShareModal'
import type { Quiz, Attempt } from '@/lib/supabase/types'

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setQuiz(response.quiz)
      setAttempts(response.attempts || [])
    } catch (err) {
      console.error('Failed to load quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  async function handleRename() {
    try {
      await quizApi.update(id, { title: newTitle })
      setQuiz({ ...quiz!, title: newTitle })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename')
    }
  }

  async function handleDelete() {
    try {
      await quizApi.delete(id)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
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
      a.download = `${quiz!.title.replace(/[^a-z0-9]/gi, '_')}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export')
    }
  }

  async function handleDuplicate() {
    try {
      const newQuiz = await quizApi.duplicate(id)
      router.push(`/quiz/${newQuiz.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate')
    }
  }

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  function getScoreColor(percentage: number) {
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
        <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
          Go back to quizzes
        </Link>
      </div>
    )
  }

  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : null

  return (
    <div>
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to quizzes
      </Link>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

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
                  onClick={() => setEditing(false)}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                <button
                  onClick={() => {
                    setNewTitle(quiz.title)
                    setEditing(true)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {quiz.description && (
              <p className="text-gray-600 mt-2">{quiz.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
              <span>{quiz.questions.length} questions</span>
              {quiz.time_limit && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {quiz.time_limit} min
                </span>
              )}
              {bestScore !== null && (
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Best: {bestScore}%
                </span>
              )}
              {attempts.length > 0 && <span>{attempts.length} attempts</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/quiz/${id}/take`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Quiz
            </Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <button
          onClick={handleDuplicate}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </button>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      {/* Attempt History */}
      {attempts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attempt History</h2>
          <div className="space-y-3">
            {attempts.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className={`font-semibold ${getScoreColor(attempt.percentage)}`}>
                    {attempt.percentage}%
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDuration(attempt.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/quiz/${id}/review/${attempt.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && <ShareModal quiz={quiz} onClose={() => setShowShare(false)} />}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Quiz?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete the quiz and all attempt history.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
