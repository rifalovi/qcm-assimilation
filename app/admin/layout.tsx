import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import LogoutButton from './LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single()

  if (!['super_admin', 'admin', 'moderator'].includes(profile?.role ?? '')) {
    redirect('/')
  }

  const role = profile?.role ?? ''
  const username = profile?.username ?? ''

  return (
    <div className="min-h-screen flex bg-slate-950">
      <AdminSidebar
        role={role}
        username={username}
        logoutButton={<LogoutButton />}
      />
      <main className="flex-1 overflow-auto min-w-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
