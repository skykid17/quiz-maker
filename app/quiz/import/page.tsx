'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'

function ImportPageContent() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home with import modal open
    router.replace('/?import=true')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ImportPageContent />
    </Suspense>
  )
}
