import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import UserActions from './UserActions'

export default async function UsersPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: currentProfile } = await supabase
    .from('profiles').select('role').eq('id', (await supabase.auth.getSession()).data.session?.user.id ?? '').single()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, role, city, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: bans } = await supabase.from('bans').select('user_id')
  const bannedIds = new Set((bans ?? []).map((b) => b.user_id))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Utilisateurs</h1>
        <p className="text-sm text-slate-400">{users?.length ?? 0} membres enregistrés</p>
      </div>
      <UserActions users={users ?? []} bannedIds={[...bannedIds]} currentRole={currentProfile?.role ?? ''} />
    </div>
  )
}
