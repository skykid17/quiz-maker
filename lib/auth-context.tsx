'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

/**
 * Auth Context holds the authentication state
 * This is consumed by components to check if user is logged in
 */
interface AuthContextType {
    session: Session | null
    user: User | null
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider Component
 * Wraps the application and manages session state
 * Listens to Supabase auth state changes and updates context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        // Load current session and subscribe to future auth changes.
        const initializeAuth = async () => {
            try {
                const {
                    data: { session: currentSession },
                    error,
                } = await supabase.auth.getSession()

                if (error) {
                    console.error('Error initializing auth:', error.message)
                }

                setSession(currentSession ?? null)
                setUser(currentSession?.user ?? null)
            } catch (error) {
                console.error('Error initializing auth:', error)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession)
            setUser(newSession?.user ?? null)
            setIsLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ session, user, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * Hook to consume auth context
 * Use this in components that need access to auth state
 */
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

/**
 * Convenience hook to check if user is authenticated
 */
export function useIsAuthenticated() {
    const { session, isLoading } = useAuth()
    return { isAuthenticated: !!session && !isLoading, isLoading }
}
