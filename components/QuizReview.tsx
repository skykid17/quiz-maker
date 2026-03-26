'use client'

import { Edit2, Check, X, Image, Clock, Tag, FileText, AlertTriangle, BookOpen } from 'lucide-react'
import { inferQuestionType } from '@/lib/validation'
import type { Question } from '@/lib/supabase/types'
import type { QuizSummary } from '@/lib/quizHelpers'

interface QuizData {
  title?: string
  description?: string
  timeLimit?: number | null
  tags?: string[]
  questions?: Question[]
}

interface QuizReviewProps {
  data: QuizData
  summary: QuizSummary
  onEditStep: (step: number) => void
}

export default function QuizReview({ data, summary, onEditStep }: QuizReviewProps) {
  const handleEditMetadata = () => onEditStep(1)
  const handleEditQuestions = () => onEditStep(2)

  const hasErrors =
    !data.title ||
    data.title.trim().length < 3 ||
    !data.questions ||
    data.questions.length === 0 ||
    data.questions.some((q) => !q.question || q.question.trim().length < 10)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 mb-1">Review Your Quiz</h2>
        <p className="text-stone-500 text-sm">Review your quiz details before publishing</p>
      </div>

      {hasErrors && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 text-sm">Incomplete Quiz</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Please complete all required fields before publishing.
            </p>
          </div>
        </div>
      )}

      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-stone-900 mb-1">
              {data.title || 'Untitled Quiz'}
            </h3>
            {data.description && (
              <p className="text-stone-500 text-sm">{data.description}</p>
            )}
          </div>
          <button
            onClick={handleEditMetadata}
            className="p-2 text-stone-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200"
            aria-label="Edit quiz details"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="badge-stone">
            <BookOpen className="w-3 h-3 mr-1" />
            {summary.totalQuestions} questions
          </span>

          {data.timeLimit && (
            <span className="badge-stone">
              <Clock className="w-3 h-3 mr-1" />
              {data.timeLimit} min
            </span>
          )}

          {data.tags && data.tags.length > 0 && (
            <span className="badge-stone">
              <Tag className="w-3 h-3 mr-1" />
              {data.tags.slice(0, 3).join(', ')}
              {data.tags.length > 3 && ` +${data.tags.length - 3}`}
            </span>
          )}

          <span className="badge-stone">
            <FileText className="w-3 h-3 mr-1" />
            {summary.singleSelectCount} single, {summary.multiSelectCount} multi
          </span>

          {summary.withImages > 0 && (
            <span className="badge-stone">
              <Image className="w-3 h-3 mr-1" />
              {summary.withImages} with images
            </span>
          )}
        </div>

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.tags.map((tag, index) => (
              <span key={index} className="badge-blue">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-stone-900">
            Questions ({data.questions?.length || 0})
          </h3>
          <button
            onClick={handleEditQuestions}
            className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 text-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Questions
          </button>
        </div>

        {!data.questions || data.questions.length === 0 ? (
          <div className="text-center py-8 bg-stone-50 rounded-xl border border-stone-200">
            <p className="text-stone-400 text-sm">No questions added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.questions.map((question, index) => {
              const questionType = inferQuestionType(question.answerOptions)
              const correctCount =
                question.answerOptions?.filter((o) => o.isCorrect).length || 0

              return (
                <div
                  key={question.id || index}
                  className="bg-white border border-stone-200 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-semibold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-stone-900 font-medium text-sm flex-1">
                          {question.question || 'Untitled Question'}
                        </p>
                        {questionType === 'multiple' && (
                          <span className="badge-blue text-[10px]">Multi</span>
                        )}
                      </div>

                      {question.imageUrl && (
                        <img
                          src={question.imageUrl}
                          alt="Question"
                          className="max-w-xs max-h-24 rounded-lg mb-2"
                        />
                      )}

                      {question.hint && (
                        <p className="text-xs text-stone-400 italic mb-2">
                          Hint: {question.hint}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-10 space-y-1.5">
                    {question.answerOptions?.map((option, optIndex) => (
                      <div
                        key={option.id || optIndex}
                        className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${
                          option.isCorrect
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-stone-50'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {option.isCorrect ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-stone-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${option.isCorrect ? 'text-emerald-800 font-medium' : 'text-stone-600'}`}>
                            {option.text || 'Empty option'}
                          </p>
                          {option.rationale && (
                            <p className="text-xs text-stone-400 mt-0.5">{option.rationale}</p>
                          )}
                        </div>

                        {option.imageUrl && (
                          <img
                            src={option.imageUrl}
                            alt="Option"
                            className="w-14 h-14 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 ml-10 flex items-center gap-2 text-[11px] text-stone-400">
                    <span>{question.answerOptions?.length || 0} options</span>
                    <span>·</span>
                    <span>{correctCount} correct</span>
                    {question.imageUrl && (
                      <>
                        <span>·</span>
                        <Image className="w-3 h-3" />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
