'use client'

import { useState } from 'react'
import { Plus, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { validateQuestion, inferQuestionType } from '@/lib/validation'
import { createEmptyOption } from '@/lib/quizHelpers'
import ImageUpload from './ImageUpload'
import OptionInput from './OptionInput'
import type { Question } from '@/lib/supabase/types'

interface QuestionFormProps {
  question: Question
  index: number | null
  onChange: (question: Question) => void
  onSave: () => void
  onCancel: () => void
  isNew?: boolean
  quizId?: string
}

export default function QuestionForm({
  question,
  index,
  onChange,
  onSave,
  onCancel,
  isNew = false,
  quizId,
}: QuestionFormProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleChange = (field: keyof Question, value: string) => {
    onChange({ ...question, [field]: value })
  }

  const handleOptionChange = (optionIndex: number, updatedOption: Question['answerOptions'][0]) => {
    const newOptions = [...question.answerOptions]
    newOptions[optionIndex] = updatedOption
    onChange({ ...question, answerOptions: newOptions })
  }

  const handleAddOption = () => {
    if (question.answerOptions.length < 8) {
      const newOption = createEmptyOption()
      onChange({ ...question, answerOptions: [...question.answerOptions, newOption] })
    }
  }

  const handleRemoveOption = (optionIndex: number) => {
    if (question.answerOptions.length > 2) {
      const newOptions = question.answerOptions.filter((_, i) => i !== optionIndex)
      onChange({ ...question, answerOptions: newOptions })
    }
  }

  const handleValidate = () => {
    const validationErrors = validateQuestion(question)
    setErrors(validationErrors)
    return validationErrors.length === 0
  }

  const handleSave = () => {
    if (handleValidate()) {
      onSave()
    }
  }

  const questionType = inferQuestionType(question.answerOptions)
  const correctCount = question.answerOptions.filter((o) => o.isCorrect).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900">
          {isNew ? 'New Question' : `Edit Question ${(index ?? 0) + 1}`}
        </h3>
        <div className="flex items-center gap-2">
          {questionType === 'multiple' && (
            <span className="badge-blue">Multi-select</span>
          )}
          {correctCount > 0 && (
            <span className="badge-green">
              <Check className="w-3 h-3 mr-1" />
              {correctCount} correct
            </span>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1.5">
          {errors.map((error, i) => (
            <div key={i} className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Question Text <span className="text-red-500">*</span>
        </label>
        <textarea
          value={question.question || ''}
          onChange={(e) => handleChange('question', e.target.value)}
          onBlur={handleValidate}
          placeholder="Enter your question..."
          rows={3}
          className="input-field resize-none"
          maxLength={500}
        />
        <div className="text-xs text-stone-400 mt-1 text-right">
          {(question.question || '').length}/500
        </div>
      </div>

      <ImageUpload
        value={question.imageUrl || ''}
        onChange={(url) => handleChange('imageUrl', url)}
        label="Question Image (optional)"
        type="question"
        quizId={quizId}
        questionId={question.id}
      />

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
      >
        {showAdvanced ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </button>

      {showAdvanced && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Hint (optional)
          </label>
          <textarea
            value={question.hint || ''}
            onChange={(e) => handleChange('hint', e.target.value)}
            placeholder="Add a hint to help users..."
            rows={2}
            className="input-field resize-none"
            maxLength={300}
          />
          <div className="text-xs text-stone-400 mt-1 text-right">
            {(question.hint || '').length}/300
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-stone-700">
            Answer Options <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-stone-400">
            {question.answerOptions.length}/8 options
          </span>
        </div>

        <div className="space-y-3">
          {question.answerOptions.map((option, optionIndex) => (
            <OptionInput
              key={option.id || optionIndex}
              option={option}
              index={optionIndex}
              allOptions={question.answerOptions}
              onChange={handleOptionChange}
              onRemove={handleRemoveOption}
              canRemove={question.answerOptions.length > 2}
              quizId={quizId}
              questionId={question.id}
            />
          ))}
        </div>

        {question.answerOptions.length < 8 && (
          <button
            onClick={handleAddOption}
            className="mt-3 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
        <button onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button onClick={handleSave} className="btn-primary text-sm">
          {isNew ? 'Add Question' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
