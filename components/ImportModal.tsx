'use client'

import { useState, useRef } from 'react'
import { X, Download, AlertCircle } from 'lucide-react'
import { quizApi } from '@/lib/api'
import type { Quiz } from '@/lib/supabase/types'

interface ImportModalProps {
  onClose: () => void
  onSuccess: (quiz: Quiz) => void
}

export default function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [inputMethod, setInputMethod] = useState<'paste' | 'file' | 'share'>('paste')
  const [jsonText, setJsonText] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImport() {
    try {
      setLoading(true)
      setError(null)

      let quiz: Quiz

      if (inputMethod === 'share') {
        const shared = await quizApi.getShared(shareCode.trim())
        quiz = await quizApi.create({
          title: shared.title,
          questions: shared.questions,
        })
      } else {
        let data
        try {
          data = JSON.parse(jsonText)
        } catch {
          throw new Error('Invalid JSON format')
        }
        quiz = await quizApi.import(data)
      }

      onSuccess(quiz)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setJsonText(event.target?.result as string)
      setInputMethod('paste')
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (event) => {
        setJsonText(event.target?.result as string)
        setInputMethod('paste')
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-stone-900">Import Quiz</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-stone-100 flex-shrink-0">
          {(['paste', 'file', 'share'] as const).map((method) => (
            <button
              key={method}
              onClick={() => setInputMethod(method)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                inputMethod === method
                  ? 'text-blue-600 border-blue-600'
                  : 'text-stone-400 border-transparent hover:text-stone-600'
              }`}
            >
              {method === 'paste' ? 'Paste JSON' : method === 'file' ? 'Upload File' : 'Share Code'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {inputMethod === 'paste' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Quiz JSON
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{"title": "My Quiz", "questions": [...]}'
                className="input-field h-48 font-mono text-sm resize-none"
              />
            </div>
          )}

          {inputMethod === 'file' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-stone-200 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-stone-400" />
              </div>
              <p className="text-stone-600 text-sm mb-1">Drag and drop a JSON file here</p>
              <p className="text-xs text-stone-400">or click to browse</p>
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
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Share Code
              </label>
              <input
                type="text"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value)}
                placeholder="QUIZ-XXXXXXXX"
                className="input-field"
              />
              <p className="text-xs text-stone-400 mt-2">
                Enter the share code to import a quiz from another user.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {inputMethod !== 'share' && (
            <details className="mt-4 group">
              <summary className="p-3 bg-stone-50 rounded-xl cursor-pointer text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors list-none flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">›</span>
                Example Format
              </summary>
              <div className="p-3 bg-stone-50 rounded-b-xl border-t border-stone-200">
                <pre className="text-xs text-stone-500 overflow-x-auto whitespace-pre-wrap">
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

        <div className="flex justify-end gap-3 p-5 border-t border-stone-100 bg-white flex-shrink-0">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={
              loading ||
              (inputMethod !== 'share' && !jsonText.trim()) ||
              (inputMethod === 'share' && !shareCode.trim())
            }
            className="btn-primary"
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
