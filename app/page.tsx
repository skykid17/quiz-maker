'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  PlusCircle,
  Download,
  FileText,
  Trash2,
  Clock,
  Trophy,
  AlertCircle,
  Search,
} from 'lucide-react'
import { quizApi } from '@/lib/api'
import ImportModal from '@/components/ImportModal'
import { ProtectedPage } from '@/components/ProtectedPage'
import type { Quiz, QuizWithStats } from '@/lib/supabase/types'

function QuizListContent() {
  const [quizzes, setQuizzes] = useState<QuizWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    loadQuizzes()
    if (searchParams.get('import') === 'true') {
      setShowImport(true)
    }
  }, [searchParams])

  async function loadQuizzes() {
    try {
      setLoading(true)
      const data = await quizApi.list()
      setQuizzes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await quizApi.delete(id)
      setQuizzes(quizzes.filter((q) => q.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quiz')
    }
  }

  function handleImportSuccess(quiz: Quiz) {
    setQuizzes([quiz as QuizWithStats, ...quizzes])
    setShowImport(false)
  }

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-200 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">My Quizzes</h1>
          <p className="text-stone-500 text-sm mt-1">
            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
          </p>
        </div>

        <button
          onClick={() => setShowImport(true)}
          className="btn-primary text-sm"
        >
          <Download className="w-4 h-4" />
          Import Quiz
        </button>
      </div>

      {quizzes.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {quizzes.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-lg font-semibold text-stone-700 mb-2">No quizzes yet</h2>
          <p className="text-stone-500 text-sm mb-6">Import your first quiz to get started</p>
          <button
            onClick={() => setShowImport(true)}
            className="btn-primary"
          >
            <PlusCircle className="w-4 h-4" />
            Import Your First Quiz
          </button>
        </div>
      )}

      {filteredQuizzes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} onDelete={() => setDeleteConfirm(quiz.id)} />
          ))}
        </div>
      )}

      {quizzes.length > 0 && filteredQuizzes.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">No quizzes match &quot;{searchTerm}&quot;</p>
        </div>
      )}

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onSuccess={handleImportSuccess} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Delete Quiz?</h3>
            <p className="text-stone-500 text-sm mb-6">
              This will delete the quiz and all its attempt history. This action cannot be
              undone.
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

export default function QuizListPage() {
  return (
    <ProtectedPage>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-200 border-t-blue-600"></div>
          </div>
        }
      >
        <QuizListContent />
      </Suspense>
    </ProtectedPage>
  )
}

interface QuizCardProps {
  quiz: QuizWithStats
  onDelete: () => void
}

function QuizCard({ quiz, onDelete }: QuizCardProps) {
  return (
    <div className="card-hover p-5 group">
      <Link href={`/quiz/${quiz.id}`}>
        <h3 className="font-semibold text-stone-900 mb-3 line-clamp-2 text-[15px] leading-snug">
          {quiz.title}
        </h3>
      </Link>

      <div className="flex items-center gap-3 text-xs text-stone-500 mb-3">
        <span className="badge-stone">
          {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}
        </span>
        {quiz.attemptCount > 0 && (
          <span className="badge-stone">
            {quiz.attemptCount} attempt{quiz.attemptCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {quiz.bestScore !== null && (
        <div className="flex items-center gap-1.5 mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-sm font-medium text-stone-700">Best: {quiz.bestScore}%</span>
        </div>
      )}

      {quiz.lastAttempt && (
        <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Last: {new Date(quiz.lastAttempt).toLocaleDateString()}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
        <Link
          href={`/quiz/${quiz.id}/take`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Start Quiz →
        </Link>
        <button
          onClick={onDelete}
          className="p-1.5 text-stone-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
