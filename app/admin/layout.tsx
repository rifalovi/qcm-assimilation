import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Users, Flag, Ban, 
  Shield, BarChart2, FileEdit, LogOut,
  ChevronRight
} from 'lucide-react'

const NAV = [
  { href: '/admin',             label: 'Vue globale',      icon: LayoutDashboard },
  { href: '/admin/users',       label: 'Utilisateurs',     icon: Users },
  { href: '/admin/reports',     label: 'Signalements',     icon: Flag },
  { href: '/admin/bans',        label: 'Bannis',           icon: Ban },
  { href: '/admin/moderators',  label: 'Modérateurs',      icon: Shield },
  { href: '/admin/stats',       label: 'Statistiques',     icon: BarChart2 },
  { href: '/admin/content',     label: 'Contenu',          icon: FileEdit },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin')

  const { data: profile } = await supabase
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

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Cap Citoyen</p>
          <p className="text-sm font-medium text-white">Administration</p>
        </div>

        {/* Profil connecté */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-900/60 text-teal-300 flex items-center justify-center text-xs font-medium">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-medium text-white">{username}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                role === 'super_admin' ? 'bg-amber-900/40 text-amber-400' :
                role === 'admin' ? 'bg-blue-900/40 text-blue-400' :
                'bg-teal-900/40 text-teal-400'
              }`}>
                {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Modérateur'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            // Les modérateurs n'ont pas accès à tout
            if (role === 'moderator' && ['/admin/moderators', '/admin/content'].includes(href)) return null
            if (role === 'moderator' && href === '/admin/users') return null

            return (
              <Link key={href} href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors group">
                <Icon size={15} />
                {label}
                <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )
          })}
        </nav>

        {/* Retour au site */}
        <div className="px-3 py-4 border-t border-slate-800">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <LogOut size={15} />
            Retour au site
          </Link>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>

    </div>
  )
}
