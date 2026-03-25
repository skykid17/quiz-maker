import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // Handle explicit auth callback errors (for example: otp_expired).
    if (error) {
        const message = errorDescription || 'Authentication link is invalid or has expired.'
        const redirectUrl = new URL('/auth/login', requestUrl.origin)
        redirectUrl.searchParams.set('auth_error', message)
        return NextResponse.redirect(redirectUrl)
    }

    // Exchange OAuth/email verification code for a session cookie.
    if (code) {
        const supabase = await createClient()
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
            const redirectUrl = new URL('/auth/login', requestUrl.origin)
            redirectUrl.searchParams.set('auth_error', exchangeError.message)
            return NextResponse.redirect(redirectUrl)
        }

        return NextResponse.redirect(new URL('/', requestUrl.origin))
    }

    // Fallback when no code is present.
    return NextResponse.redirect(new URL('/auth/login?signed_up=true&verify_email=true', requestUrl.origin))
}
