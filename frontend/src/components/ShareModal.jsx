import { useState } from 'react'
import { X, Copy, Check, Share2 } from 'lucide-react'
import { quizApi } from '../utils/api'

export default function ShareModal({ quiz, onClose }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    const shareData = {
      title: quiz.title,
      questions: quiz.questions
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)))
    await navigator.clipboard.writeText(encoded)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Quiz
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Share this quiz by copying the code below. Others can import it using the "Import from Code" option.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <code className="text-xs break-all text-gray-700">
              {btoa(encodeURIComponent(JSON.stringify({ title: quiz.title, questions: quiz.questions }))).substring(0, 100)}...
            </code>
          </div>
          
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Share Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
