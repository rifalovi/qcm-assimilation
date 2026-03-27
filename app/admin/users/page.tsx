import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import UserActions from './UserActions'

export default async function UsersPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: currentProfile } = await supabase
    .from('profiles').select('role').eq('id', (await supabase.auth.getSession()).data.session?.user.id ?? '').single()

  const { data: users } = await adminClient
    .from('profiles')
    .select('id, username, role, city, postal_code, first_name, last_name, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(200)

  // Récupère les emails via auth admin
  const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 200 })
  const emailMap = Object.fromEntries((authUsers?.users ?? []).map((u: { id: string; email?: string }) => [u.id, u.email ?? '']))

  const { data: bans } = await supabase.from('bans').select('user_id')
  const bannedIds = new Set((bans ?? []).map((b) => b.user_id))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Utilisateurs</h1>
        <p className="text-sm text-slate-400">{users?.length ?? 0} membres enregistrés</p>
      </div>
      <UserActions users={(users ?? []).map((u) => ({ ...u, email: emailMap[u.id] ?? '' })) as never} bannedIds={[...bannedIds]} currentRole={currentProfile?.role ?? ''} />
    </div>
  )
}
