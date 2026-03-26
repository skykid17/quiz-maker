'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Play,
  Edit2,
  Trash2,
  Share2,
  Upload,
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
    if (percentage >= 80) return 'text-emerald-600'
    if (percentage >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-200 border-t-blue-600"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-4" />
        <p className="text-stone-500">Quiz not found</p>
        <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block text-sm">
          Go back to quizzes
        </Link>
      </div>
    )
  }

  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to quizzes
      </Link>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field text-xl font-semibold"
                  autoFocus
                />
                <button onClick={handleRename} className="btn-primary text-sm py-2">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="btn-ghost text-sm py-2">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-stone-900 truncate">{quiz.title}</h1>
                <button
                  onClick={() => {
                    setNewTitle(quiz.title)
                    setEditing(true)
                  }}
                  className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-all duration-200 flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {quiz.description && (
              <p className="text-stone-500 text-sm mt-1.5">{quiz.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="badge-stone">
                {quiz.questions.length} questions
              </span>
              {quiz.time_limit && (
                <span className="badge-stone">
                  <Clock className="w-3 h-3 mr-1" />
                  {quiz.time_limit} min
                </span>
              )}
              {bestScore !== null && (
                <span className="badge-amber">
                  <Trophy className="w-3 h-3 mr-1" />
                  Best: {bestScore}%
                </span>
              )}
              {attempts.length > 0 && (
                <span className="badge-stone">
                  {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/quiz/${id}/take`}
            className="btn-primary flex-shrink-0"
          >
            <Play className="w-4 h-4" />
            Start Quiz
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setShowShare(true)}
          className="btn-secondary text-sm"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <button
          onClick={handleExport}
          className="btn-secondary text-sm"
        >
          <Upload className="w-4 h-4" />
          Export
        </button>
        <button
          onClick={handleDuplicate}
          className="btn-secondary text-sm"
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </button>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="btn-danger-outline text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      {attempts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Attempt History</h2>
          <div className="space-y-2">
            {attempts.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <span className={`font-semibold text-sm ${getScoreColor(attempt.percentage)}`}>
                    {attempt.percentage}%
                  </span>
                  <span className="text-xs text-stone-500">
                    {formatDuration(attempt.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/quiz/${id}/review/${attempt.id}`}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showShare && <ShareModal quiz={quiz} onClose={() => setShowShare(false)} />}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Delete Quiz?</h3>
            <p className="text-stone-500 text-sm mb-6">
              This will permanently delete the quiz and all attempt history.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
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
