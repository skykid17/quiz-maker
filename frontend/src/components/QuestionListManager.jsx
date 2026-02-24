import { useState, useRef } from 'react'
import { 
  Plus, Edit2, Trash2, GripVertical, ChevronUp, ChevronDown,
  AlertCircle, FileText, Image
} from 'lucide-react'
import { createEmptyQuestion, inferQuestionType } from '../utils/quizHelpers'
import QuestionForm from './QuestionForm'

export default function QuestionListManager({ questions, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const dragOverIndexRef = useRef(null)
  
  const handleAddQuestion = () => {
    setEditingIndex(null)
    setShowQuestionForm(true)
  }
  
  const handleEditQuestion = (index) => {
    setEditingIndex(index)
    setShowQuestionForm(true)
  }
  
  const handleSaveQuestion = (question) => {
    if (editingIndex !== null) {
      // Update existing question
      const newQuestions = [...questions]
      newQuestions[editingIndex] = question
      onChange(newQuestions)
    } else {
      // Add new question
      onChange([...questions, question])
    }
    setShowQuestionForm(false)
    setEditingIndex(null)
  }
  
  const handleDeleteQuestion = (index) => {
    setDeleteConfirm(index)
  }
  
  const confirmDelete = () => {
    if (deleteConfirm !== null) {
      const newQuestions = questions.filter((_, i) => i !== deleteConfirm)
      onChange(newQuestions)
      setDeleteConfirm(null)
    }
  }
  
  const handleMoveQuestion = (index, direction) => {
    const newIndex = index + direction
    if (newIndex >= 0 && newIndex < questions.length) {
      const newQuestions = [...questions]
      const temp = newQuestions[index]
      newQuestions[index] = newQuestions[newIndex]
      newQuestions[newIndex] = temp
      onChange(newQuestions)
    }
  }
  
  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }
  
  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOverIndexRef.current = index
  }
  
  const handleDrop = (e, dropIndex) => {
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
  
  const newQuestion = createEmptyQuestion()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Questions</h2>
          <p className="text-gray-600">
            Add questions to your quiz. Drag to reorder.
          </p>
        </div>
        <button
          onClick={handleAddQuestion}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>
      
      {/* Question List */}
      {questions.length === 0 && !showQuestionForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No questions added yet</p>
          <p className="text-sm text-gray-500">Click "Add Question" to get started</p>
        </div>
      )}
      
      <div className="space-y-3">
        {questions.map((question, index) => {
          const questionType = inferQuestionType(question.answerOptions)
          const correctCount = question.answerOptions?.filter(o => o.isCorrect).length || 0
          const hasImages = question.imageUrl || question.answerOptions?.some(o => o.imageUrl)
          
          return (
            <div
              key={question._id || index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white border rounded-lg p-4 shadow-sm transition-all ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${dragOverIndexRef.current === index ? 'border-blue-500 border-2' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div className="cursor-move text-gray-400 hover:text-gray-600 pt-1 hidden sm:block">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                {/* Question Number */}
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                
                {/* Question Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium line-clamp-2 mb-2">
                    {question.question || 'Untitled Question'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span>{question.answerOptions?.length || 0} options</span>
                    <span>•</span>
                    <span>{correctCount} correct</span>
                    {questionType === 'multiple' && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600">Multi-select</span>
                      </>
                    )}
                    {hasImages && (
                      <>
                        <span>•</span>
                        <Image className="w-4 h-4 text-blue-600" />
                      </>
                    )}
                    {question.hint && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600">Has hint</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Mobile Reorder Buttons */}
                  <div className="flex sm:hidden">
                    <button
                      onClick={() => handleMoveQuestion(index, -1)}
                      disabled={index === 0}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(index, 1)}
                      disabled={index === questions.length - 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleEditQuestion(index)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label="Edit question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteQuestion(index)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
      
      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <QuestionForm
                question={editingIndex !== null ? questions[editingIndex] : newQuestion}
                index={editingIndex}
                onChange={(q) => {
                  if (editingIndex !== null) {
                    const newQuestions = [...questions]
                    newQuestions[editingIndex] = q
                    onChange(newQuestions)
                  }
                }}
                onSave={handleSaveQuestion}
                onCancel={() => {
                  setShowQuestionForm(false)
                  setEditingIndex(null)
                }}
                isNew={editingIndex === null}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Question?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
