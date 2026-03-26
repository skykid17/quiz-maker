'use client'

import { useState, useRef } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  FileText,
  Image,
} from 'lucide-react'
import { createEmptyQuestion } from '@/lib/quizHelpers'
import { inferQuestionType } from '@/lib/validation'
import QuestionForm from './QuestionForm'
import type { Question } from '@/lib/supabase/types'

interface QuestionListManagerProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
  quizId?: string
}

export default function QuestionListManager({
  questions,
  onChange,
  quizId,
}: QuestionListManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const dragOverIndexRef = useRef<number | null>(null)

  const handleAddQuestion = () => {
    setEditingIndex(null)
    setCurrentQuestion(createEmptyQuestion())
    setShowQuestionForm(true)
  }

  const handleEditQuestion = (index: number) => {
    setEditingIndex(index)
    setCurrentQuestion(questions[index])
    setShowQuestionForm(true)
  }

  const handleQuestionChange = (updatedQuestion: Question) => {
    setCurrentQuestion(updatedQuestion)
    if (editingIndex !== null) {
      const newQuestions = [...questions]
      newQuestions[editingIndex] = updatedQuestion
      onChange(newQuestions)
    }
  }

  const handleSaveQuestion = () => {
    if (!currentQuestion) return

    if (editingIndex !== null) {
      setShowQuestionForm(false)
      setEditingIndex(null)
      setCurrentQuestion(null)
    } else {
      onChange([...questions, currentQuestion])
      setShowQuestionForm(false)
      setCurrentQuestion(null)
    }
  }

  const handleCancelQuestion = () => {
    setShowQuestionForm(false)
    setEditingIndex(null)
    setCurrentQuestion(null)
  }

  const handleDeleteQuestion = (index: number) => {
    setDeleteConfirm(index)
  }

  const confirmDelete = () => {
    if (deleteConfirm !== null) {
      const newQuestions = questions.filter((_, i) => i !== deleteConfirm)
      onChange(newQuestions)
      setDeleteConfirm(null)
    }
  }

  const handleMoveQuestion = (index: number, direction: number) => {
    const newIndex = index + direction
    if (newIndex >= 0 && newIndex < questions.length) {
      const newQuestions = [...questions]
      const temp = newQuestions[index]
      newQuestions[index] = newQuestions[newIndex]
      newQuestions[newIndex] = temp
      onChange(newQuestions)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOverIndexRef.current = index
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newQuestions = [...questions]
      const draggedQuestion = newQuestions[draggedIndex]
      newQuestions.splice(draggedIndex, 1)
      newQuestions.splice(dropIndex, 0, draggedQuestion)
      onChange(newQuestions)
    }
    setDraggedIndex(null)
    dragOverIndexRef.current = null
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    dragOverIndexRef.current = null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 mb-1">Questions</h2>
          <p className="text-stone-500 text-sm">Add questions to your quiz. Drag to reorder.</p>
        </div>
        <button
          onClick={handleAddQuestion}
          className="btn-primary text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {questions.length === 0 && !showQuestionForm && (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-stone-400" />
          </div>
          <p className="text-stone-600 text-sm mb-1">No questions added yet</p>
          <p className="text-xs text-stone-400">Click &quot;Add Question&quot; to get started</p>
        </div>
      )}

      <div className="space-y-2">
        {questions.map((question, index) => {
          const questionType = inferQuestionType(question.answerOptions)
          const correctCount =
            question.answerOptions?.filter((o) => o.isCorrect).length || 0
          const hasImages =
            question.imageUrl || question.answerOptions?.some((o) => o.imageUrl)

          return (
            <div
              key={question.id || index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white border rounded-xl p-4 transition-all duration-200 ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${
                dragOverIndexRef.current === index
                  ? 'border-blue-400 shadow-warm'
                  : 'border-stone-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="cursor-move text-stone-300 hover:text-stone-500 pt-0.5 hidden sm:block">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex-shrink-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-stone-900 font-medium text-sm line-clamp-2 mb-2">
                    {question.question || 'Untitled Question'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="badge-stone">{question.answerOptions?.length || 0} options</span>
                    <span className="badge-stone">{correctCount} correct</span>
                    {questionType === 'multiple' && (
                      <span className="badge-blue">Multi-select</span>
                    )}
                    {hasImages && (
                      <Image className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    {question.hint && (
                      <span className="badge-amber">Has hint</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <div className="flex sm:hidden">
                    <button
                      onClick={() => handleMoveQuestion(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 text-stone-400 hover:text-stone-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(index, 1)}
                      disabled={index === questions.length - 1}
                      className="p-1.5 text-stone-400 hover:text-stone-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleEditQuestion(index)}
                    className="p-1.5 text-stone-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200"
                    aria-label="Edit question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(index)}
                    className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200"
                    aria-label="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showQuestionForm && currentQuestion && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <QuestionForm
              question={currentQuestion}
              index={editingIndex}
              onChange={handleQuestionChange}
              onSave={handleSaveQuestion}
              onCancel={handleCancelQuestion}
              isNew={editingIndex === null}
              quizId={quizId}
            />
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-stone-900">Delete Question?</h3>
            </div>
            <p className="text-stone-500 text-sm mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
