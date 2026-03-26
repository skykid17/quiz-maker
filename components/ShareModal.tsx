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
    <div className="modal-overlay">
      <div className="modal-content max-w-md p-0">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Share2 className="w-4 h-4 text-stone-500" />
            Share Quiz
          </h2>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-stone-500 mb-4">
            Share this quiz by copying the code below. Others can import it using the
            &quot;Share Code&quot; option.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-stone-50 rounded-xl p-4 mb-4 border border-stone-200">
            {loading ? (
              <p className="text-sm text-stone-400">Generating share code...</p>
            ) : (
              <code className="text-sm break-all text-stone-700 font-mono">{shareCode}</code>
            )}
          </div>

          <button
            onClick={handleCopy}
            disabled={loading || !!error || !shareCode}
            className="btn-primary w-full"
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
