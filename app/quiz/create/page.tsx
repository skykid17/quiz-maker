'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { draftApi } from '@/lib/api'
import { generateQuizSummary } from '@/lib/quizHelpers'
import QuizMetadataForm from '@/components/QuizMetadataForm'
import QuestionListManager from '@/components/QuestionListManager'
import QuizReview from '@/components/QuizReview'
import type { Question } from '@/lib/supabase/types'

interface DraftData {
  _id?: string
  title: string
  description: string
  timeLimit: number | null
  tags: string[]
  autoGenerateShareCode: boolean
  questions: Question[]
  currentStep: number
}

const STEPS = [
  { id: 1, title: 'Details' },
  { id: 2, title: 'Questions' },
  { id: 3, title: 'Review' },
]

export default function CreateQuizPage() {
  const params = useParams<{ draftId?: string }>()
  const router = useRouter()
  const draftId = params?.draftId

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(!!draftId)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [draftData, setDraftData] = useState<DraftData>({
    title: 'Untitled Quiz',
    description: '',
    timeLimit: null,
    tags: [],
    autoGenerateShareCode: true,
    questions: [],
    currentStep: 1,
  })

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasUnsavedChanges = useRef(false)

  // Load draft if editing
  useEffect(() => {
    if (draftId) {
      loadDraft()
    }
  }, [draftId])

  const loadDraft = async () => {
    try {
      setLoading(true)
      const draft = await draftApi.get(draftId!)
      setDraftData({
        _id: draft._id || draft.id,
        title: draft.title || 'Untitled Quiz',
        description: draft.description || '',
        timeLimit: draft.time_limit || null,
        tags: draft.tags || [],
        autoGenerateShareCode: draft.auto_generate_share_code ?? true,
        questions: (draft.questions as Question[]) || [],
        currentStep: draft.current_step || 1,
      })
      setCurrentStep(draft.current_step || 1)
    } catch (err) {
      setError('Failed to load draft')
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = useCallback(async (silent = false) => {
    if (!silent) setSaving(true)
    try {
      const response = await draftApi.save({
        _id: draftData._id,
        title: draftData.title,
        description: draftData.description,
        timeLimit: draftData.timeLimit,
        tags: draftData.tags,
        autoGenerateShareCode: draftData.autoGenerateShareCode,
        questions: draftData.questions,
        currentStep: currentStep,
      })

      if (!draftData._id && response._id) {
        setDraftData(prev => ({ ...prev, _id: response._id }))
        router.replace(`/quiz/create/${response._id}`)
      }

      hasUnsavedChanges.current = false
    } catch (err) {
      if (!silent) setError('Failed to save draft')
    } finally {
      if (!silent) setSaving(false)
    }
  }, [draftData, currentStep, router])

  // Auto-save on changes
  useEffect(() => {
    hasUnsavedChanges.current = true

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(true)
    }, 30000) // Auto-save every 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [draftData, saveDraft])

  const handleMetadataChange = (updates: Partial<DraftData>) => {
    setDraftData(prev => ({ ...prev, ...updates }))
  }

  const handleQuestionsChange = (questions: Question[]) => {
    setDraftData(prev => ({ ...prev, questions }))
  }

  const handleNextStep = async () => {
    await saveDraft()
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleEditStep = (step: number) => {
    setCurrentStep(step)
  }

  const handlePublish = async () => {
    if (!draftData._id) {
      await saveDraft()
    }

    if (!draftData._id) {
      setError('Please save the draft first')
      return
    }

    setPublishing(true)
    try {
      const result = await draftApi.publish(draftData._id)
      router.push(`/quiz/${result.quizId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish quiz')
    } finally {
      setPublishing(false)
    }
  }

  const summary = generateQuizSummary({ questions: draftData.questions })

  const canPublish =
    draftData.title.trim().length >= 3 &&
    draftData.questions.length > 0 &&
    draftData.questions.every(q => q.question.trim().length >= 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => saveDraft()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-10 w-full sm:w-auto text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            ×
          </button>
        </div>
      )}

      {/* Steps Indicator */}
      <div className="mb-8 overflow-x-auto">
        <div className="min-w-max flex items-center justify-start sm:justify-center">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 min-h-10 rounded-lg transition-colors ${currentStep === step.id
                  ? 'bg-blue-600 text-white'
                  : currentStep > step.id
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-sm">
                    {step.id}
                  </span>
                )}
                {step.title}
              </button>
              {index < STEPS.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        {currentStep === 1 && (
          <QuizMetadataForm data={draftData} onChange={handleMetadataChange} />
        )}

        {currentStep === 2 && (
          <QuestionListManager
            questions={draftData.questions}
            onChange={handleQuestionsChange}
            quizId={draftData._id}
          />
        )}

        {currentStep === 3 && (
          <QuizReview data={draftData} summary={summary} onEditStep={handleEditStep} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-10 w-full sm:w-auto text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {currentStep < 3 ? (
          <button
            onClick={handleNextStep}
            className="inline-flex items-center justify-center gap-2 px-6 py-2 min-h-10 w-full sm:w-auto bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={!canPublish || publishing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2 min-h-10 w-full sm:w-auto bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {publishing ? 'Publishing...' : 'Publish Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}
