'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSignUp } from '@/lib/auth-hooks'
import { AlertCircle } from 'lucide-react'

export default function SignUpPage() {
    const { signUp, loading, error } = useSignUp()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordMatch, setPasswordMatch] = useState(true)

    const handlePasswordChange = (value: string) => {
        setPassword(value)
        setPasswordMatch(value === confirmPassword)
    }

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value)
        setPasswordMatch(password === value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!passwordMatch) return
        await signUp(email, password, confirmPassword)
    }

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error.message}</p>
                </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        disabled={loading}
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="••••••••"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Must be at least 8 characters
                    </p>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        disabled={loading}
                        className={`mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${confirmPassword && !passwordMatch
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border-gray-300'
                            }`}
                        placeholder="••••••••"
                    />
                    {confirmPassword && !passwordMatch && (
                        <p className="mt-1 text-xs text-red-600">
                            Passwords do not match
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !passwordMatch || !email || !password || !confirmPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>
            </form>

            {/* Login Link */}
            <div className="text-center">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
