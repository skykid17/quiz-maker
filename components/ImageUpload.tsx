'use client'

import { useState, useRef } from 'react'
import { Image, X, AlertCircle } from 'lucide-react'
import { uploadImage } from '@/lib/api'
import { validateImageFile } from '@/lib/quizHelpers'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  quizId?: string
  questionId?: string
  optionId?: string
  type?: 'question' | 'option'
}

export default function ImageUpload({
  value,
  onChange,
  label = 'Image',
  quizId = 'temp',
  questionId = 'unknown',
  optionId,
  type = 'question',
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = await uploadImage(file, type, quizId, questionId, optionId)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleRemove = () => {
    onChange('')
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-stone-700">{label}</label>
      )}

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="max-w-xs max-h-40 rounded-xl border border-stone-200"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-warm-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
          } ${error ? 'border-red-300 bg-red-50' : ''}`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-200 border-t-blue-600 mx-auto"></div>
          ) : (
            <>
              <Image className="w-7 h-7 text-stone-300 mx-auto mb-2" />
              <p className="text-sm text-stone-500">Click or drag image here</p>
              <p className="text-xs text-stone-400 mt-1">JPG, PNG, GIF, WebP (max 5MB)</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
