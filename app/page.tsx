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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
          <p className="text-gray-600 mt-1">
            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
          </p>
        </div>

        <button
          onClick={() => setShowImport(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-10 w-full sm:w-auto bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Import Quiz
        </button>
      </div>

      {/* Search */}
      {quizzes.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {quizzes.length === 0 && !loading && (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No quizzes yet</h2>
          <p className="text-gray-500 mb-6">Import your first quiz to get started</p>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Import Your First Quiz
          </button>
        </div>
      )}

      {/* Quiz Grid */}
      {filteredQuizzes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} onDelete={() => setDeleteConfirm(quiz.id)} />
          ))}
        </div>
      )}

      {/* No Results */}
      {quizzes.length > 0 && filteredQuizzes.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No quizzes match &quot;{searchTerm}&quot;</p>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onSuccess={handleImportSuccess} />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Quiz?</h3>
            <p className="text-gray-600 mb-6">
              This will delete the quiz and all its attempt history. This action cannot be
              undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 min-h-10 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 min-h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <Link href={`/quiz/${quiz.id}`}>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{quiz.title}</h3>
      </Link>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span>{quiz.questionCount} questions</span>
        {quiz.attemptCount > 0 && (
          <span>
            {quiz.attemptCount} attempt{quiz.attemptCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {quiz.bestScore !== null && (
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">Best: {quiz.bestScore}%</span>
        </div>
      )}

      {quiz.lastAttempt && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Clock className="w-4 h-4" />
          <span>Last: {new Date(quiz.lastAttempt).toLocaleDateString()}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <Link
          href={`/quiz/${quiz.id}/take`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium min-h-10 inline-flex items-center"
        >
          Start Quiz →
        </Link>
        <button
          onClick={onDelete}
          className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Delete quiz"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
