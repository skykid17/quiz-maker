import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ChevronRight, ChevronLeft, Save, Send, AlertCircle,
  Check, FileText
} from 'lucide-react'
import { draftApi, quizApi } from '../utils/api'
import { generateQuizSummary } from '../utils/quizHelpers'
import QuizMetadataForm from '../components/QuizMetadataForm'
import QuestionListManager from '../components/QuestionListManager'
import QuizReview from '../components/QuizReview'

export default function CreateQuizPage() {
  const { draftId } = useParams()
  const navigate = useNavigate()
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  
  // Draft state
  const [draftData, setDraftData] = useState({
    _id: null,
    title: '',
    description: '',
    timeLimit: null,
    tags: [],
    autoGenerateShareCode: true,
    questions: [],
    currentStep: 1
  })
  
  const autoSaveTimerRef = useRef(null)
  const hasUnsavedChangesRef = useRef(false)
  
  // Load draft on mount if draftId exists
  useEffect(() => {
    if (draftId) {
      loadDraft(draftId)
    } else {
      // Check localStorage for backup
      const backup = localStorage.getItem('quizDraftBackup')
      if (backup) {
        try {
          const parsed = JSON.parse(backup)
          const backupAge = Date.now() - parsed.timestamp
          // Only restore if backup is less than 24 hours old
          if (backupAge < 24 * 60 * 60 * 1000) {
            setDraftData(parsed.data)
            setCurrentStep(parsed.data.currentStep || 1)
          }
        } catch (e) {
          console.error('Failed to load backup:', e)
        }
      }
    }
  }, [draftId])
  
  // Auto-save every 30 seconds
  useEffect(() => {
    if (hasUnsavedChangesRef.current) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft(true)
      }, 30000)
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [draftData])
  
  // Save backup to localStorage on change
  useEffect(() => {
    hasUnsavedChangesRef.current = true
    localStorage.setItem('quizDraftBackup', JSON.stringify({
      data: draftData,
      timestamp: Date.now()
    }))
  }, [draftData])
  
  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  const loadDraft = async (id) => {
    try {
      setLoading(true)
      const draft = await draftApi.get(id)
      setDraftData(draft)
      setCurrentStep(draft.currentStep || 1)
      hasUnsavedChangesRef.current = false
    } catch (err) {
      setError('Failed to load draft: ' + err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const saveDraft = useCallback(async (silent = false) => {
    try {
      if (!silent) setSaving(true)
      
      const dataToSave = {
        ...draftData,
        currentStep
      }
      
      const saved = await draftApi.save(dataToSave)
      setDraftData(prev => ({ ...prev, _id: saved._id }))
      hasUnsavedChangesRef.current = false
      
      if (!silent) {
        setSuccessMessage('Draft saved successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      if (!silent) {
        setError('Failed to save draft: ' + err.message)
      }
    } finally {
      if (!silent) setSaving(false)
    }
  }, [draftData, currentStep])
  
  const handlePublish = async () => {
    try {
      setPublishing(true)
      setError(null)
      
      // Validate all data
      const validationErrors = validateAll()
      if (validationErrors.length > 0) {
        setError('Please fix all errors before publishing:\n' + validationErrors.join('\n'))
        return
      }
      
      // If we have a draft, publish it
      if (draftData._id) {
        const result = await draftApi.publish(draftData._id)
        hasUnsavedChangesRef.current = false
        localStorage.removeItem('quizDraftBackup')
        setSuccessMessage(`Quiz published! Share code: ${result.quiz.shareCode}`)
        setTimeout(() => {
          navigate(`/quiz/${result.quizId}`)
        }, 2000)
      } else {
        // Create quiz directly
        const quiz = await quizApi.create({
          title: draftData.title,
          description: draftData.description,
          timeLimit: draftData.timeLimit,
          tags: draftData.tags,
          autoGenerateShareCode: draftData.autoGenerateShareCode,
          questions: draftData.questions
        })
        hasUnsavedChangesRef.current = false
        localStorage.removeItem('quizDraftBackup')
        setSuccessMessage(`Quiz published! Share code: ${quiz.shareCode}`)
        setTimeout(() => {
          navigate(`/quiz/${quiz._id}`)
        }, 2000)
      }
    } catch (err) {
      setError('Failed to publish quiz: ' + err.message)
    } finally {
      setPublishing(false)
    }
  }
  
  const validateAll = () => {
    const errors = []
    
    if (!draftData.title || draftData.title.trim().length < 3) {
      errors.push('Quiz title must be at least 3 characters')
    }
    
    if (!draftData.questions || draftData.questions.length === 0) {
      errors.push('At least one question is required')
    } else {
      draftData.questions.forEach((q, index) => {
        if (!q.question || q.question.trim().length < 5) {
          errors.push(`Question ${index + 1}: text must be at least 5 characters`)
        }
        
        const correctCount = q.answerOptions?.filter(a => a.isCorrect).length || 0
        if (correctCount === 0) {
          errors.push(`Question ${index + 1}: at least one correct answer required`)
        }
        
        if (!q.answerOptions || q.answerOptions.length < 2) {
          errors.push(`Question ${index + 1}: at least 2 options required`)
        }
      })
    }
    
    return errors
  }
  
  const updateDraftData = (updates) => {
    setDraftData(prev => ({ ...prev, ...updates }))
  }
  
  const canProceed = () => {
    if (currentStep === 1) {
      return draftData.title && draftData.title.trim().length >= 3
    }
    if (currentStep === 2) {
      return draftData.questions && draftData.questions.length > 0
    }
    return true
  }
  
  const handleNext = () => {
    if (!canProceed()) {
      setError('Please complete all required fields')
      return
    }
    
    setError(null)
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
      updateDraftData({ currentStep: currentStep + 1 })
      saveDraft(true)
    }
  }
  
  const handlePrevious = () => {
    setError(null)
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      updateDraftData({ currentStep: currentStep - 1 })
    }
  }
  
  const handleSaveDraft = () => {
    saveDraft(false)
  }
  
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      hasUnsavedChangesRef.current = false
      localStorage.removeItem('quizDraftBackup')
      navigate('/')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  const summary = generateQuizSummary(draftData)
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : step === currentStep
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                {step < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step <= currentStep ? 'text-gray-900' : 'text-gray-500'
              } hidden sm:inline`}>
                {step === 1 ? 'Details' : step === 2 ? 'Questions' : 'Review'}
              </span>
              {step < 3 && (
                <div className={`w-12 sm:w-24 h-1 mx-2 rounded ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 whitespace-pre-line">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}
      
      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        {currentStep === 1 && (
          <QuizMetadataForm
            data={draftData}
            onChange={updateDraftData}
          />
        )}
        
        {currentStep === 2 && (
          <QuestionListManager
            questions={draftData.questions}
            onChange={(questions) => updateDraftData({ questions })}
          />
        )}
        
        {currentStep === 3 && (
          <QuizReview
            data={draftData}
            summary={summary}
            onEditStep={setCurrentStep}
          />
        )}
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          )}
          
          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {publishing ? 'Publishing...' : 'Publish Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
