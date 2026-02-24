import { useState, useRef } from 'react'
import { X, Upload, FileText, AlertCircle } from 'lucide-react'
import { quizApi } from '../utils/api'

export default function ImportModal({ onClose, onSuccess }) {
  const [inputMethod, setInputMethod] = useState('paste') // 'paste' | 'file' | 'share'
  const [jsonText, setJsonText] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  async function handleImport() {
    try {
      setLoading(true)
      setError(null)
      
      let quiz
      
      if (inputMethod === 'share') {
        // Import from share code
        const shared = await quizApi.getShared(shareCode.trim())
        // Create a copy in user's collection
        quiz = await quizApi.create({
          title: shared.title,
          questions: shared.questions
        })
      } else {
        // Validate and parse JSON
        let data
        try {
          data = JSON.parse(jsonText)
        } catch (e) {
          throw new Error('Invalid JSON format')
        }
        
        quiz = await quizApi.import(data)
      }
      
      onSuccess(quiz)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setJsonText(event.target.result)
      setInputMethod('paste')
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (event) => {
        setJsonText(event.target.result)
        setInputMethod('paste')
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Import Quiz</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setInputMethod('paste')}
            className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium transition-colors ${
              inputMethod === 'paste'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Paste JSON
          </button>
          <button
            onClick={() => setInputMethod('file')}
            className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium transition-colors ${
              inputMethod === 'file'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setInputMethod('share')}
            className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium transition-colors ${
              inputMethod === 'share'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Share Code
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {inputMethod === 'paste' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz JSON
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{"title": "My Quiz", "questions": [...]}'
                className="w-full h-40 sm:h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}
          
          {inputMethod === 'file' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop a JSON file here</p>
              <p className="text-sm text-gray-400">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
          
          {inputMethod === 'share' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Code
              </label>
              <input
                type="text"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value)}
                placeholder="QUIZ-XXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter the share code to import a quiz from another user.
              </p>
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 whitespace-pre-wrap">{error}</div>
            </div>
          )}
          
          {/* Example Format - Collapsible on mobile */}
          {inputMethod !== 'share' && (
            <details className="mt-4">
              <summary className="p-3 bg-gray-50 rounded-lg cursor-pointer text-sm font-medium text-gray-600 hover:bg-gray-100">
                Example Format
              </summary>
              <div className="p-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
{`{
  "title": "My Quiz",
  "questions": [
    {
      "question": "What is 2 + 2?",
      "hint": "Basic math",
      "answerOptions": [
        {"text": "3", "isCorrect": false, "rationale": "Too low"},
        {"text": "4", "isCorrect": true, "rationale": "Correct!"},
        {"text": "5", "isCorrect": false, "rationale": "Too high"}
      ]
    }
  ]
}`}
                </pre>
              </div>
            </details>
          )}
        </div>
        
        {/* Footer - Sticky on mobile */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || (inputMethod !== 'share' && !jsonText.trim()) || (inputMethod === 'share' && !shareCode.trim())}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
