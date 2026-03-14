// lib/supabase/client.ts
// Client Supabase pour les composants côté NAVIGATEUR (Client Components)
// Utilise les cookies pour maintenir la session

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
