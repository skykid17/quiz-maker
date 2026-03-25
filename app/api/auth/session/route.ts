import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/session
 * Returns current authenticated user session
 * Used by auth context to initialize and monitor auth state
 */
export async function GET() {
    try {
        const supabase = await createClient()

        const {
            data: { session },
            error,
        } = await supabase.auth.getSession()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(
            {
                session,
                user: session?.user || null,
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                },
            }
        )
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get session'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

/**
 * POST /api/auth/session
 * Force refresh of session (called after signup/login)
 * Used to update server-side session cookies
 */
export async function POST() {
    try {
        const supabase = await createClient()

        const {
            data: { session },
            error,
        } = await supabase.auth.getSession()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(
            {
                session,
                success: true,
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                },
            }
        )
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to refresh session'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
