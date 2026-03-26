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
    <div className="border border-stone-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1.5">
          <input
            type="checkbox"
            checked={option.isCorrect || false}
            onChange={(e) => handleChange('isCorrect', e.target.checked)}
            className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
            aria-label={`Mark option ${index + 1} as correct`}
          />
          <span className="text-[10px] text-stone-400 mt-1">Correct</span>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <input
              type="text"
              value={option.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="input-field text-sm"
              maxLength={200}
            />
            <div className="text-xs text-stone-400 mt-1 text-right">
              {(option.text || '').length}/200
            </div>
          </div>

          <div>
            <input
              type="text"
              value={option.rationale || ''}
              onChange={(e) => handleChange('rationale', e.target.value)}
              placeholder="Rationale (optional) - Why is this option correct/incorrect?"
              className="input-field text-sm"
              maxLength={300}
            />
            <div className="text-xs text-stone-400 mt-1 text-right">
              {(option.rationale || '').length}/300
            </div>
          </div>

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

        <button
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="p-1.5 text-stone-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-red-50 transition-all duration-200 text-lg leading-none"
          aria-label={`Remove option ${index + 1}`}
        >
          ×
        </button>
      </div>
    </div>
  )
}
