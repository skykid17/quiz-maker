import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies
 * Called when user clicks logout button
 */
export async function POST() {
    try {
        const supabase = await createClient()

        // Sign out from Supabase (clears session on server)
        const { error } = await supabase.auth.signOut()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Logged out successfully',
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                },
            }
        )
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Logout failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
