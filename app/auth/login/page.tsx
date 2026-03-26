'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLogin } from '@/lib/auth-hooks'
import { AlertCircle, CheckCircle } from 'lucide-react'

function LoginPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { login, loading, error } = useLogin()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [showVerifyEmail, setShowVerifyEmail] = useState(false)
    const [callbackError, setCallbackError] = useState<string | null>(null)

    useEffect(() => {
        if (searchParams.get('signed_up') === 'true') {
            setShowSuccess(true)
            const timer = setTimeout(() => setShowSuccess(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [searchParams])

    useEffect(() => {
        if (searchParams.get('verify_email') === 'true') {
            setShowVerifyEmail(true)
            const timer = setTimeout(() => setShowVerifyEmail(false), 8000)
            return () => clearTimeout(timer)
        }
    }, [searchParams])

    useEffect(() => {
        const callbackErrorMessage = searchParams.get('auth_error')
        if (callbackErrorMessage) {
            setCallbackError(callbackErrorMessage)
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await login(email, password)
    }

    return (
        <div className="space-y-6">
            {showSuccess && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <p className="text-sm text-emerald-800">
                        Account created successfully.
                    </p>
                </div>
            )}

            {showVerifyEmail && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                        Please confirm your email before logging in. Check your inbox and spam folder.
                    </p>
                </div>
            )}

            {callbackError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{callbackError}</p>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error.message}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="input-field"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1.5">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="input-field"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className="text-center">
                <p className="text-sm text-stone-500">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="space-y-6" />}>
            <LoginPageContent />
        </Suspense>
    )
}
