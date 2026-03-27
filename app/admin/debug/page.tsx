import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function DebugPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const { data: profile, error: profileError } = user
    ? await supabase.from('profiles').select('role, username').eq('id', user.id).single()
    : { data: null, error: null }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', color: 'white', background: '#0f172a', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 20 }}>Admin Debug</h1>
      <p><strong>Auth error:</strong> {authError?.message ?? 'none'}</p>
      <p><strong>User ID:</strong> {user?.id ?? 'NOT LOGGED IN'}</p>
      <p><strong>Email:</strong> {user?.email ?? 'none'}</p>
      <hr style={{ margin: '20px 0', borderColor: '#334155' }} />
      <p><strong>Profile error:</strong> {profileError?.message ?? 'none'}</p>
      <p><strong>Username:</strong> {profile?.username ?? 'none'}</p>
      <p><strong>Role:</strong> {profile?.role ?? 'none'}</p>
      <hr style={{ margin: '20px 0', borderColor: '#334155' }} />
      <p><strong>Allowed?</strong> {['super_admin','admin','moderator'].includes(profile?.role ?? '') ? 'OUI' : 'NON'}</p>
    </div>
  )
}
