'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>()

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Taking Page</h1>
        <p className="text-gray-600 mb-6">
          This page will be implemented with the full quiz-taking functionality from the
          original TakeQuizPage.jsx. Features include:
        </p>
        <ul className="text-left text-gray-600 mb-6 max-w-md mx-auto space-y-2">
          <li>• Question navigation and progress tracking</li>
          <li>• Immediate or end-of-quiz feedback modes</li>
          <li>• Timer support for timed quizzes</li>
          <li>• Skip and hint functionality</li>
          <li>• Auto-save progress</li>
          <li>• Score calculation and submission</li>
        </ul>
        <p className="text-sm text-gray-500">
          The API routes are ready. This UI component needs to be ported from the original
          React Router version.
        </p>
      </div>
    </div>
  )
}
