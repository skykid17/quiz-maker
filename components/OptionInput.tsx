'use client'

import ImageUpload from './ImageUpload'
import type { AnswerOption } from '@/lib/supabase/types'

interface OptionInputProps {
  option: AnswerOption
  index: number
  allOptions: AnswerOption[]
  onChange: (index: number, option: AnswerOption) => void
  onRemove: (index: number) => void
  canRemove: boolean
  quizId?: string
  questionId?: string
}

export default function OptionInput({
  option,
  index,
  onChange,
  onRemove,
  canRemove,
  quizId,
  questionId,
}: OptionInputProps) {
  const handleChange = (field: keyof AnswerOption, value: string | boolean) => {
    onChange(index, { ...option, [field]: value })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Correct Answer Checkbox */}
        <div className="flex flex-col items-center pt-1 min-w-12">
          <input
            type="checkbox"
            checked={option.isCorrect || false}
            onChange={(e) => handleChange('isCorrect', e.target.checked)}
            className="w-5 h-5 sm:w-4 sm:h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
            aria-label={`Mark option ${index + 1} as correct`}
          />
          <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">Correct</span>
        </div>

        <div className="flex-1 space-y-3">
          {/* Option Text */}
          <div>
            <input
              type="text"
              value={option.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="w-full px-3 py-2 min-h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              maxLength={200}
            />
            <div className="text-xs text-gray-400 mt-1 text-right whitespace-nowrap">
              {(option.text || '').length}/200
            </div>
          </div>

          {/* Rationale */}
          <div>
            <input
              type="text"
              value={option.rationale || ''}
              onChange={(e) => handleChange('rationale', e.target.value)}
              placeholder="Rationale (optional) - Why is this option correct/incorrect?"
              className="w-full px-3 py-2 min-h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              maxLength={300}
            />
            <div className="text-xs text-gray-400 mt-1 text-right whitespace-nowrap">
              {(option.rationale || '').length}/300
            </div>
          </div>

          {/* Image */}
          <ImageUpload
            value={option.imageUrl || ''}
            onChange={(url) => handleChange('imageUrl', url)}
            label="Option Image (optional)"
            type="option"
            quizId={quizId}
            questionId={questionId}
            optionId={option.id}
          />
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="h-10 w-10 sm:h-auto sm:w-auto p-2 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={`Remove option ${index + 1}`}
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  )
}
