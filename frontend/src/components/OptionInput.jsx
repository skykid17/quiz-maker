import { AlertCircle } from 'lucide-react'
import ImageUpload from './ImageUpload'

export default function OptionInput({ 
  option, 
  index, 
  allOptions, 
  onChange, 
  onRemove,
  canRemove 
}) {
  const handleChange = (field, value) => {
    onChange(index, { ...option, [field]: value })
  }
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        {/* Correct Answer Checkbox */}
        <div className="flex flex-col items-center pt-1">
          <input
            type="checkbox"
            checked={option.isCorrect || false}
            onChange={(e) => handleChange('isCorrect', e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            aria-label={`Mark option ${index + 1} as correct`}
          />
          <span className="text-xs text-gray-500 mt-1">Correct</span>
        </div>
        
        <div className="flex-1 space-y-3">
          {/* Option Text */}
          <div>
            <input
              type="text"
              value={option.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              maxLength={200}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              maxLength={300}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {(option.rationale || '').length}/300
            </div>
          </div>
          
          {/* Image */}
          <ImageUpload
            value={option.imageUrl || ''}
            onChange={(url) => handleChange('imageUrl', url)}
            label="Option Image (optional)"
          />
        </div>
        
        {/* Remove Button */}
        <button
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={`Remove option ${index + 1}`}
        >
          ×
        </button>
      </div>
    </div>
  )
}
