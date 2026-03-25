import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Browser-side Supabase client
 * Uses the public (anon) key for client-side operations
 * Session management is handled automatically by @supabase/ssr
 */
export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return browserClient
}
