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

  useEffect(() => {
    hasUnsavedChanges.current = true

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(true)
    }, 30000)

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
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-200 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <button
          onClick={() => saveDraft()}
          disabled={saving}
          className="btn-secondary text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
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

      <div className="flex items-center justify-center mb-8">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                currentStep === step.id
                  ? 'bg-blue-600 text-white shadow-warm-sm'
                  : currentStep > step.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-stone-100 text-stone-500'
              }`}
            >
              {currentStep > step.id ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {step.id}
                </span>
              )}
              {step.title}
            </button>
            {index < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 rounded-full ${currentStep > step.id ? 'bg-emerald-400' : 'bg-stone-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card p-6 sm:p-8">
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

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className="btn-ghost"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {currentStep < 3 ? (
          <button
            onClick={handleNextStep}
            className="btn-primary"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={!canPublish || publishing}
            className="btn-primary bg-emerald-600 hover:bg-emerald-700"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {publishing ? 'Publishing...' : 'Publish Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}
