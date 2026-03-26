'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader } from 'lucide-react'

export function ProtectedPage({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { session, isLoading } = useAuth()

    useEffect(() => {
        if (!isLoading && !session) {
            router.push('/auth/login')
        }
    }, [session, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader className="w-7 h-7 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-stone-500 text-sm">Loading...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader className="w-7 h-7 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-stone-500 text-sm">Redirecting to login...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
