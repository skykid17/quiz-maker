import { useState } from 'react'
import { Plus, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { validateQuestion, createEmptyOption, inferQuestionType } from '../utils/quizHelpers'
import ImageUpload from './ImageUpload'
import OptionInput from './OptionInput'

export default function QuestionForm({ 
  question, 
  index,
  onChange, 
  onSave,
  onCancel,
  isNew = false 
}) {
  const [errors, setErrors] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const handleChange = (field, value) => {
    onChange({ ...question, [field]: value })
  }
  
  const handleOptionChange = (optionIndex, updatedOption) => {
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
  
  const handleRemoveOption = (optionIndex) => {
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
  const correctCount = question.answerOptions.filter(o => o.isCorrect).length
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {isNew ? 'New Question' : `Edit Question ${index + 1}`}
        </h3>
        <div className="flex items-center gap-2">
          {questionType === 'multiple' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              Multi-select
            </span>
          )}
          {correctCount > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              {correctCount} correct
            </span>
          )}
        </div>
      </div>
      
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
          {errors.map((error, i) => (
            <div key={i} className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}
      
      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Text <span className="text-red-500">*</span>
        </label>
        <textarea
          value={question.question || ''}
          onChange={(e) => handleChange('question', e.target.value)}
          onBlur={handleValidate}
          placeholder="Enter your question..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={500}
        />
        <div className="text-xs text-gray-400 mt-1 text-right">
          {(question.question || '').length}/500
        </div>
      </div>
      
      {/* Question Image */}
      <ImageUpload
        value={question.imageUrl || ''}
        onChange={(url) => handleChange('imageUrl', url)}
        label="Question Image (optional)"
      />
      
      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
      >
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </button>
      
      {/* Hint (Advanced) */}
      {showAdvanced && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hint (optional)
          </label>
          <textarea
            value={question.hint || ''}
            onChange={(e) => handleChange('hint', e.target.value)}
            placeholder="Add a hint to help users..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={300}
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {(question.hint || '').length}/300
          </div>
        </div>
      )}
      
      {/* Answer Options */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Answer Options <span className="text-red-500">*</span>
          </label>
          <span className="text-sm text-gray-500">
            {question.answerOptions.length}/8 options
          </span>
        </div>
        
        <div className="space-y-3">
          {question.answerOptions.map((option, optionIndex) => (
            <OptionInput
              key={option._id || optionIndex}
              option={option}
              index={optionIndex}
              allOptions={question.answerOptions}
              onChange={handleOptionChange}
              onRemove={handleRemoveOption}
              canRemove={question.answerOptions.length > 2}
            />
          ))}
        </div>
        
        {question.answerOptions.length < 8 && (
          <button
            onClick={handleAddOption}
            className="mt-3 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isNew ? 'Add Question' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
