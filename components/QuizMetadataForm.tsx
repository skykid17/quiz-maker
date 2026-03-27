'use client'

import { useState } from 'react'
import { AlertCircle, X, Clock, Tag } from 'lucide-react'
import {
  validateQuizTitle,
  validateDescription,
  validateTimeLimit,
  validateTags,
} from '@/lib/validation'

interface QuizMetadata {
  title?: string
  description?: string
  timeLimit?: number | null
  tags?: string[]
  autoGenerateShareCode?: boolean
}

interface QuizMetadataFormProps {
  data: QuizMetadata
  onChange: (updates: Partial<QuizMetadata>) => void
}

export default function QuizMetadataForm({ data, onChange }: QuizMetadataFormProps) {
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [tagInput, setTagInput] = useState('')

  const handleBlur = (field: string) => {
    const newErrors = { ...errors }

    if (field === 'title') {
      const error = validateQuizTitle(data.title)
      if (error) newErrors.title = error
      else delete newErrors.title
    }

    if (field === 'description') {
      const error = validateDescription(data.description)
      if (error) newErrors.description = error
      else delete newErrors.description
    }

    if (field === 'timeLimit') {
      const error = validateTimeLimit(data.timeLimit)
      if (error) newErrors.timeLimit = error
      else delete newErrors.timeLimit
    }

    setErrors(newErrors)
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !data.tags?.includes(tag)) {
      const newTags = [...(data.tags || []), tag]
      const error = validateTags(newTags)
      if (error) {
        setErrors({ ...errors, tags: error })
      } else {
        onChange({ tags: newTags })
        setTagInput('')
        setErrors({ ...errors, tags: null })
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ tags: data.tags?.filter((t) => t !== tagToRemove) })
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 mb-1">Quiz Details</h2>
        <p className="text-stone-500 text-sm">Enter the basic information for your quiz</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1.5">
          Quiz Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={data.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          onBlur={() => handleBlur('title')}
          placeholder="Enter quiz title..."
          className={`input-field ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
          maxLength={200}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.title}
            </div>
          )}
          <span className="text-xs text-stone-400 ml-auto">
            {(data.title || '').length}/200
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          onBlur={() => handleBlur('description')}
          placeholder="Enter a description for your quiz..."
          rows={3}
          className={`input-field resize-none ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
          maxLength={1000}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.description}
            </div>
          )}
          <span className="text-xs text-stone-400 ml-auto">
            {(data.description || '').length}/1000
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="timeLimit" className="block text-sm font-medium text-stone-700 mb-1.5">
          <Clock className="w-4 h-4 inline mr-1.5 text-stone-400" />
          Time Limit (minutes)
        </label>
        <input
          type="number"
          id="timeLimit"
          name="timeLimit"
          value={data.timeLimit || ''}
          onChange={(e) =>
            onChange({ timeLimit: e.target.value ? parseInt(e.target.value) : null })
          }
          onBlur={() => handleBlur('timeLimit')}
          placeholder="Leave empty for no time limit"
          min={5}
          max={180}
          className={`input-field ${errors.timeLimit ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
        />
        {errors.timeLimit && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.timeLimit}
          </div>
        )}
        <p className="text-xs text-stone-400 mt-1">
          Optional: Set a time limit between 5-180 minutes
        </p>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-stone-700 mb-1.5">
          <Tag className="w-4 h-4 inline mr-1.5 text-stone-400" />
          Tags / Categories
        </label>
        <div className="flex gap-2">
            <input
              type="text"
              id="tags"
              name="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add a tag..."
              className="input-field"
              maxLength={30}
            />
          <button
            onClick={handleAddTag}
            disabled={!tagInput.trim() || (data.tags?.length ?? 0) >= 10}
            className="btn-primary flex-shrink-0 text-sm"
          >
            Add
          </button>
        </div>
        {errors.tags && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.tags}
          </div>
        )}

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.tags.map((tag, index) => (
              <span
                key={index}
                className="badge-blue gap-1"
              >
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-stone-400 mt-1">
          Max 10 tags, 30 characters each. Press Enter or click Add.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoGenerateShareCode"
          checked={data.autoGenerateShareCode !== false}
          onChange={(e) => onChange({ autoGenerateShareCode: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="autoGenerateShareCode" className="text-sm text-stone-600">
          Automatically generate a share code for this quiz
        </label>
      </div>
    </div>
  )
}
