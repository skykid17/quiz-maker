import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface AuthError {
    message: string
    code?: string
}

/**
 * Hook for signup functionality
 * Creates new user, handles validation and errors
 */
export function useSignUp() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<AuthError | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const signUp = useCallback(
        async (email: string, password: string, confirmPassword: string) => {
            setLoading(true)
            setError(null)

            try {
                // Validate input
                if (!email || !password || !confirmPassword) {
                    throw new Error('All fields are required')
                }

                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match')
                }

                if (password.length < 8) {
                    throw new Error('Password must be at least 8 characters')
                }

                if (!email.includes('@')) {
                    throw new Error('Please enter a valid email')
                }

                // Sign up
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/login`,
                    },
                })

                if (signUpError) {
                    throw signUpError
                }

                // When email confirmation is enabled, Supabase returns no session.
                if (!data.session) {
                    router.push('/auth/login?signed_up=true&verify_email=true')
                    return
                }

                // If email confirmation is disabled, user is already authenticated.
                router.push('/')
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Sign up failed'
                setError({
                    message,
                    code: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
                })
            } finally {
                setLoading(false)
            }
        },
        [router, supabase]
    )

    return { signUp, loading, error }
}

/**
 * Hook for login functionality
 * Authenticates user with email and password
 */
export function useLogin() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<AuthError | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const login = useCallback(
        async (email: string, password: string) => {
            setLoading(true)
            setError(null)

            try {
                // Validate input
                if (!email || !password) {
                    throw new Error('Email and password are required')
                }

                // Sign in
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

                if (signInError) {
                    if (/email not confirmed/i.test(signInError.message)) {
                        throw new Error(
                            'Email not confirmed. Please check your inbox and click the confirmation link before logging in.'
                        )
                    }

                    if (/invalid login credentials/i.test(signInError.message)) {
                        throw new Error(
                            'Invalid login credentials. If you just signed up, confirm your email first.'
                        )
                    }

                    throw signInError
                }

                // Redirect to home page
                router.replace('/')
                router.refresh()
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Login failed'
                setError({
                    message,
                    code: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
                })
            } finally {
                setLoading(false)
            }
        },
        [router, supabase]
    )

    return { login, loading, error }
}

/**
 * Hook for logout functionality
 * Clears session and redirects to login page
 */
export function useLogout() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<AuthError | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const logout = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            // Sign out from Supabase (clears session on client)
            const { error: signOutError } = await supabase.auth.signOut()

            if (signOutError) {
                throw signOutError
            }

            // Call logout API to clear server-side session
            await fetch('/api/auth/logout', { method: 'POST' })

            // Redirect to login page
            router.push('/auth/login')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Logout failed'
            setError({
                message,
                code: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
            })
        } finally {
            setLoading(false)
        }
    }, [router, supabase])

    return { logout, loading, error }
}
