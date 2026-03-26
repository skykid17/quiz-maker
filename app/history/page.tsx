'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Trash2, Eye, AlertCircle, ChevronRight } from 'lucide-react'
import { attemptApi } from '@/lib/api'
import type { Attempt, Quiz } from '@/lib/supabase/types'

interface AttemptWithQuiz extends Attempt {
  quizId: Quiz
}

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<AttemptWithQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadAttempts()
  }, [])

  const loadAttempts = async () => {
    try {
      const data = await attemptApi.getAll()
      setAttempts(data as AttemptWithQuiz[])
    } catch (err) {
      console.error('Failed to load attempts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (attemptId: string) => {
    try {
      await attemptApi.delete(attemptId)
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete attempt:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-200 border-t-blue-600"></div>
      </div>
    )
  }

  if (attempts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-stone-400" />
        </div>
        <h2 className="text-lg font-semibold text-stone-700 mb-2">No attempts yet</h2>
        <p className="text-stone-500 text-sm mb-6">Complete a quiz to see your history here.</p>
        <Link
          href="/"
          className="btn-primary"
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
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Attempt History</h1>
          <p className="text-stone-500 text-sm mt-1">{attempts.length} attempt{attempts.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-3">
        {attempts.map((attempt) => {
          const quizTitle = attempt.quizId?.title || 'Unknown Quiz'
          const quizId = attempt.quizId?.id || attempt.quiz_id

          return (
            <div
              key={attempt.id}
              className="card-hover p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 truncate">{quizTitle}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {attempt.questions_skipped > 0 && (
                      <span className="badge-amber">
                        {attempt.questions_skipped} skipped
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <span
                      className={`text-lg font-semibold ${(attempt.percentage ?? 0) >= 70
                          ? 'text-emerald-600'
                          : (attempt.percentage ?? 0) >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                    >
                      {attempt.percentage ?? 0}%
                    </span>
                    <p className="text-xs text-stone-400">
                      {attempt.score?.toFixed?.(1) ?? attempt.score} / {attempt.total_points} pts
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/quiz/${quizId}/review/${attempt.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                      title="Review"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(attempt.id)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Delete Attempt?</h3>
            <p className="text-stone-500 text-sm mb-6">
              This action cannot be undone. The attempt record will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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
