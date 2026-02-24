import { useState } from 'react'
import { AlertCircle, X, Clock, Tag } from 'lucide-react'
import { 
  validateQuizTitle, 
  validateDescription, 
  validateTimeLimit, 
  validateTags 
} from '../utils/quizHelpers'

export default function QuizMetadataForm({ data, onChange }) {
  const [errors, setErrors] = useState({})
  const [tagInput, setTagInput] = useState('')
  
  const handleBlur = (field) => {
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
  
  const handleRemoveTag = (tagToRemove) => {
    onChange({ tags: data.tags.filter(t => t !== tagToRemove) })
  }
  
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Details</h2>
        <p className="text-gray-600">Enter the basic information for your quiz</p>
      </div>
      
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Quiz Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={data.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          onBlur={() => handleBlur('title')}
          placeholder="Enter quiz title..."
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          maxLength={200}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.title}
            </div>
          )}
          <span className="text-sm text-gray-500 ml-auto">
            {(data.title || '').length}/200
          </span>
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          onBlur={() => handleBlur('description')}
          placeholder="Enter a description for your quiz..."
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          maxLength={1000}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.description}
            </div>
          )}
          <span className="text-sm text-gray-500 ml-auto">
            {(data.description || '').length}/1000
          </span>
        </div>
      </div>
      
      {/* Time Limit */}
      <div>
        <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="w-4 h-4 inline mr-2" />
          Time Limit (minutes)
        </label>
        <input
          type="number"
          id="timeLimit"
          value={data.timeLimit || ''}
          onChange={(e) => onChange({ timeLimit: e.target.value ? parseInt(e.target.value) : null })}
          onBlur={() => handleBlur('timeLimit')}
          placeholder="Leave empty for no time limit"
          min={5}
          max={180}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.timeLimit ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.timeLimit && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
            <AlertCircle className="w-4 h-4" />
            {errors.timeLimit}
          </div>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Optional: Set a time limit between 5-180 minutes
        </p>
      </div>
      
      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
          <Tag className="w-4 h-4 inline mr-2" />
          Tags/Categories
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={30}
          />
          <button
            onClick={handleAddTag}
            disabled={!tagInput.trim() || (data.tags?.length >= 10)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        {errors.tags && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
            <AlertCircle className="w-4 h-4" />
            {errors.tags}
          </div>
        )}
        
        {/* Display Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        
        <p className="text-sm text-gray-500 mt-1">
          Max 10 tags, 30 characters each. Press Enter or click Add to add a tag.
        </p>
      </div>
      
      {/* Auto-generate Share Code */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoGenerateShareCode"
          checked={data.autoGenerateShareCode !== false}
          onChange={(e) => onChange({ autoGenerateShareCode: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="autoGenerateShareCode" className="text-sm text-gray-700">
          Automatically generate a share code for this quiz
        </label>
      </div>
    </div>
  )
}
