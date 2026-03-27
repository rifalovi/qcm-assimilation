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

  const { data: rawUsers } = await adminClient
    .from('profiles')
    .select('id, username, role, city, postal_code, first_name, last_name, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(200)

  // Emails via auth admin API
  const emailMap: Record<string, string> = {}
  try {
    const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 200 })
    for (const u of authData?.users ?? []) {
      emailMap[u.id] = u.email ?? ''
    }
  } catch (e) {
    console.error('listUsers error:', e)
  }

  const { data: bans } = await supabase.from('bans').select('user_id')
  const bannedIds = new Set((bans ?? []).map((b) => b.user_id))

  // Enrichit avec email
  console.log('rawUsers count:', rawUsers?.length, 'error check')
  const users = (rawUsers ?? []).map((u) => ({
    id: u.id as string,
    username: u.username as string,
    role: u.role as string,
    city: u.city as string | null,
    postal_code: u.postal_code as string | null,
    first_name: u.first_name as string | null,
    last_name: u.last_name as string | null,
    email: emailMap[u.id as string] ?? '',
    created_at: u.created_at as string,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Utilisateurs</h1>
        <p className="text-sm text-slate-400">{users.length} membres enregistrés (raw: {rawUsers?.length ?? 0})</p>
      </div>
      <UserActions users={users} bannedIds={[...bannedIds]} currentRole={currentProfile?.role ?? ''} />
    </div>
  )
}
