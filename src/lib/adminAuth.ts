// src/lib/adminAuth.ts
// Helper serveur pour garder les routes /api/admin/* :
//   - vérifie la session (cookie Supabase)
//   - lit le rôle depuis `profiles`
//   - renvoie un client admin (service_role) prêt à l'emploi
//
// Usage :
//   const gate = await requireAdmin()
//   if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
//   const { admin, role } = gate

import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type Gate =
  | { ok: true; role: string; userId: string; admin: SupabaseClient }
  | { ok: false; status: 401 | 403 | 500; error: string }

const ADMIN_ROLES: readonly string[] = ['super_admin', 'admin', 'moderator']

export async function requireAdmin(): Promise<Gate> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) {
    return { ok: false, status: 500, error: 'Supabase env manquant' }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() { /* lecture seule côté route handler */ },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, error: 'Non authentifié' }

  const admin = createAdminClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: profile, error } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return { ok: false, status: 403, error: 'Profil introuvable' }
  }
  if (!ADMIN_ROLES.includes(profile.role)) {
    return { ok: false, status: 403, error: 'Accès refusé' }
  }

  return { ok: true, userId: user.id, role: profile.role, admin }
}
