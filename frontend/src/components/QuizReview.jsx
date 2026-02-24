import { 
  Edit2, Check, X, Image, Clock, Tag, FileText, 
  AlertTriangle, BookOpen
} from 'lucide-react'
import { inferQuestionType } from '../utils/quizHelpers'

export default function QuizReview({ data, summary, onEditStep }) {
  const handleEditMetadata = () => onEditStep(1)
  const handleEditQuestions = () => onEditStep(2)
  
  const hasErrors = !data.title || 
    data.title.trim().length < 3 || 
    !data.questions || 
    data.questions.length === 0 ||
    data.questions.some(q => !q.question || q.question.trim().length < 10)
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Quiz</h2>
        <p className="text-gray-600">Review your quiz details before publishing</p>
      </div>
      
      {/* Warnings */}
      {hasErrors && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Incomplete Quiz</p>
            <p className="text-sm text-amber-700">
              Please complete all required fields before publishing.
            </p>
          </div>
        </div>
      )}
      
      {/* Quiz Summary Card */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {data.title || 'Untitled Quiz'}
            </h3>
            {data.description && (
              <p className="text-gray-600 mb-3">{data.description}</p>
            )}
          </div>
          <button
            onClick={handleEditMetadata}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            aria-label="Edit quiz details"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
        
        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{summary.totalQuestions} questions</span>
          </div>
          
          {data.timeLimit && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{data.timeLimit} min time limit</span>
            </div>
          )}
          
          {data.tags && data.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>{data.tags.slice(0, 3).join(', ')}{data.tags.length > 3 && ` +${data.tags.length - 3} more`}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>
              {summary.singleSelectCount} single, {summary.multiSelectCount} multi
            </span>
          </div>
          
          {summary.withImages > 0 && (
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span>{summary.withImages} with images</span>
            </div>
          )}
        </div>
        
        {/* Tags Display */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {data.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Questions List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Questions ({data.questions?.length || 0})
          </h3>
          <button
            onClick={handleEditQuestions}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
          >
            <Edit2 className="w-4 h-4" />
            Edit Questions
          </button>
        </div>
        
        {!data.questions || data.questions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No questions added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.questions.map((question, index) => {
              const questionType = inferQuestionType(question.answerOptions)
              const correctCount = question.answerOptions?.filter(o => o.isCorrect).length || 0
              
              return (
                <div
                  key={question._id || index}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-gray-900 font-medium flex-1">
                          {question.question || 'Untitled Question'}
                        </p>
                        {questionType === 'multiple' && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            Multi-select
                          </span>
                        )}
                      </div>
                      
                      {/* Question Image */}
                      {question.imageUrl && (
                        <img
                          src={question.imageUrl}
                          alt="Question"
                          className="max-w-xs max-h-32 rounded-lg mb-3"
                        />
                      )}
                      
                      {/* Hint */}
                      {question.hint && (
                        <p className="text-sm text-gray-500 italic mb-3">
                          💡 Hint: {question.hint}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Options */}
                  <div className="ml-11 space-y-2">
                    {question.answerOptions?.map((option, optIndex) => (
                      <div
                        key={option._id || optIndex}
                        className={`flex items-start gap-2 p-2 rounded-lg ${
                          option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {option.isCorrect ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            option.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'
                          }`}>
                            {option.text || 'Empty option'}
                          </p>
                          
                          {option.rationale && (
                            <p className="text-xs text-gray-500 mt-1">
                              {option.rationale}
                            </p>
                          )}
                        </div>
                        
                        {option.imageUrl && (
                          <img
                            src={option.imageUrl}
                            alt="Option"
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Question Stats */}
                  <div className="mt-3 ml-11 flex items-center gap-3 text-xs text-gray-500">
                    <span>{question.answerOptions?.length || 0} options</span>
                    <span>•</span>
                    <span>{correctCount} correct</span>
                    {question.imageUrl && (
                      <>
                        <span>•</span>
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
