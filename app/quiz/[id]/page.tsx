'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Save,
  X as XIcon,
  RotateCcw,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { quizApi } from '@/lib/api'
import { generateQuizSummary } from '@/lib/quizHelpers'
import QuizMetadataForm from '@/components/QuizMetadataForm'
import QuestionListManager from '@/components/QuestionListManager'
import ShareModal from '@/components/ShareModal'
import type { Quiz, Attempt, Question, FeedbackMode } from '@/lib/supabase/types'

type EditView = 'details' | 'questions'

interface QuizMetadata {
  title: string
  description: string
  timeLimit: number | null
  tags: string[]
  feedbackMode: FeedbackMode
  backtracking: boolean
}

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editView, setEditView] = useState<EditView>('details')
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState<QuizMetadata>({
    title: '',
    description: '',
    timeLimit: null,
    tags: [],
    feedbackMode: null,
    backtracking: true,
  })
  const [editQuestions, setEditQuestions] = useState<Question[]>([])

  useEffect(() => {
    loadQuiz()
  }, [id])

  const loadQuiz = async () => {
    try {
      const response = await quizApi.get(id)
      setQuiz(response.quiz)
      setAttempts(response.attempts || [])
      setEditData({
        title: response.quiz.title,
        description: response.quiz.description || '',
        timeLimit: response.quiz.time_limit || null,
        tags: response.quiz.tags || [],
        feedbackMode: response.quiz.feedback_mode ?? null,
        backtracking: response.quiz.backtracking ?? true,
      })
      setEditQuestions(response.quiz.questions || [])
    } catch (err) {
      console.error('Failed to load quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = () => {
    if (!quiz) return
    setEditData({
      title: quiz.title,
      description: quiz.description || '',
      timeLimit: quiz.time_limit || null,
      tags: quiz.tags || [],
      feedbackMode: quiz.feedback_mode ?? null,
      backtracking: quiz.backtracking ?? true,
    })
    setEditQuestions(quiz.questions || [])
    setIsEditing(true)
    setEditView('details')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditView('details')
    setEditData({
      title: quiz?.title || '',
      description: quiz?.description || '',
      timeLimit: quiz?.time_limit || null,
      tags: quiz?.tags || [],
      feedbackMode: quiz?.feedback_mode ?? null,
      backtracking: quiz?.backtracking ?? true,
    })
    setEditQuestions(quiz?.questions || [])
  }

  const handleMetadataChange = (updates: Partial<QuizMetadata>) => {
    setEditData(prev => ({ ...prev, ...updates }))
  }

  const handleQuestionsChange = useCallback((questions: Question[]) => {
    setEditQuestions(questions)
  }, [])

  const handleSave = async () => {
    if (!quiz || !isEditing) return
    
    setIsSaving(true)
    try {
      const updatedQuiz = await quizApi.update(id, {
        title: editData.title,
        description: editData.description,
        time_limit: editData.timeLimit,
        tags: editData.tags,
        feedback_mode: editData.feedbackMode,
        backtracking: editData.backtracking,
        questions: editQuestions,
      })
      setQuiz(updatedQuiz)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
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

  function getFeedbackModeLabel(mode: FeedbackMode) {
    if (mode === 'immediate') return 'Immediate'
    if (mode === 'end') return 'End'
    return 'User Choice'
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

  // Edit mode UI
  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleCancelEdit}
            className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelEdit}
              className="btn-ghost text-sm"
            >
              <XIcon className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary text-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-lg leading-none">
              ×
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setEditView('details')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              editView === 'details'
                ? 'bg-blue-600 text-white shadow-warm-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setEditView('questions')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              editView === 'questions'
                ? 'bg-blue-600 text-white shadow-warm-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Questions
          </button>
        </div>

        <div className="card p-6 sm:p-8">
          {editView === 'details' && (
            <QuizMetadataForm data={editData} onChange={handleMetadataChange} />
          )}
          {editView === 'questions' && (
            <QuestionListManager
              questions={editQuestions}
              onChange={handleQuestionsChange}
              quizId={quiz.id}
            />
          )}
        </div>
      </div>
    )
  }

  // View mode UI
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-stone-900 truncate">{quiz.title}</h1>
              <button
                onClick={handleStartEdit}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-all duration-200 flex-shrink-0"
                title="Edit quiz"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

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
              <span className="badge-stone">
                <MessageSquare className="w-3 h-3 mr-1" />
                {getFeedbackModeLabel(quiz.feedback_mode)}
              </span>
              <span className={`badge-stone ${quiz.backtracking ? 'badge-emerald' : 'badge-red'}`}>
                <RotateCcw className="w-3 h-3 mr-1" />
                {quiz.backtracking ? 'Backtrack On' : 'Backtrack Off'}
              </span>
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

            {quiz.tags && quiz.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {quiz.tags.map((tag, index) => (
                  <span key={index} className="badge-blue">
                    {tag}
                  </span>
                ))}
              </div>
            )}
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
          onClick={handleStartEdit}
          className="btn-secondary text-sm"
        >
          <Edit2 className="w-4 h-4" />
          Edit Quiz
        </button>
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
