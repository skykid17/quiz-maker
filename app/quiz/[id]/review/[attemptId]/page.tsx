'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function ReviewPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>()

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/quiz/${id}`}
        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to quiz
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <AlertCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Attempt</h1>
        <p className="text-gray-600 mb-6">
          Reviewing attempt: {attemptId}
        </p>
        <p className="text-gray-600 mb-6">
          This page will display the detailed review of a quiz attempt, showing:
        </p>
        <ul className="text-left text-gray-600 mb-6 max-w-md mx-auto space-y-2">
          <li>• Score summary and statistics</li>
          <li>• Each question with user&apos;s answer</li>
          <li>• Correct answers highlighted</li>
          <li>• Rationales for each option</li>
          <li>• Time taken per question</li>
        </ul>
        <p className="text-sm text-gray-500">
          The API routes are ready. This UI component needs to be ported from ReviePage.jsx.
        </p>
      </div>
    </div>
  )
}
