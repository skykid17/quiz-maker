'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check, Share2, AlertCircle } from 'lucide-react'
import { quizApi } from '@/lib/api'
import type { Quiz } from '@/lib/supabase/types'

interface ShareModalProps {
  quiz: Quiz
  onClose: () => void
}

export default function ShareModal({ quiz, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [shareCode, setShareCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadShareCode() {
      try {
        setLoading(true)
        setError(null)
        const { shareCode: generatedCode } = await quizApi.share(quiz.id)
        setShareCode(generatedCode)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate share code')
      } finally {
        setLoading(false)
      }
    }

    loadShareCode()
  }, [quiz.id])

  const handleCopy = async () => {
    if (!shareCode) return
    await navigator.clipboard.writeText(shareCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Quiz
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close share modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4">
          <p className="text-sm text-gray-600 mb-4">
            Share this quiz by copying the code below. Others can import it using the
            &quot;Share Code&quot; option.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            {loading ? (
              <p className="text-sm text-gray-500">Generating share code...</p>
            ) : (
              <code className="text-sm break-all text-gray-700">{shareCode}</code>
            )}
          </div>

          <button
            onClick={handleCopy}
            disabled={loading || !!error || !shareCode}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
