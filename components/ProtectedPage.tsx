'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader } from 'lucide-react'

/**
 * ProtectedPage HOC (Higher Order Component)
 * Wraps pages that require authentication
 * Redirects unauthenticated users to login page
 * Shows loading state while checking auth
 */
export function ProtectedPage({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { session, isLoading } = useAuth()

    useEffect(() => {
        // Only redirect if we've finished loading and user is not authenticated
        if (!isLoading && !session) {
            router.push('/auth/login')
        }
    }, [session, isLoading, router])

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Redirect happening in useEffect, but show loading state briefly
    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Redirecting to login...</p>
                </div>
            </div>
        )
    }

    // User is authenticated, render children
    return <>{children}</>
}

/**
 * Alternative version using a wrapper component for pages
 * Usage: export default function HomePage() {
 *   return (
 *     <ProtectedPage>
 *       <YourContent />
 *     </ProtectedPage>
 *   )
 * }
 */
