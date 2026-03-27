import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import UserActionsWrapper from './UserActionsWrapper'

export default async function UsersPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: currentProfile } = await supabase
    .from('profiles').select('role').eq('id', (await supabase.auth.getSession()).data.session?.user.id ?? '').single()

  const { data: bans } = await supabase.from('bans').select('user_id')
  const bannedIds = (bans ?? []).map((b) => b.user_id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Utilisateurs</h1>
      </div>
      <UserActionsWrapper bannedIds={bannedIds} currentRole={currentProfile?.role ?? ''} />
    </div>
  )
}
