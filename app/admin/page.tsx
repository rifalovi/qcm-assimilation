import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, Flag, MessageSquare, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: totalTestimonies },
    { count: totalPosts },
    { count: pendingReports },
    { count: activeBans },
    { data: recentReports },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['premium', 'elite']),
    supabase.from('testimonials').select('*', { count: 'exact', head: true }),
    supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase.from('bans').select('*', { count: 'exact', head: true }),
    supabase.from('reports')
      .select('id, target_type, target_id, reason, created_at, profiles!reporter_id ( username )')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('profiles')
      .select('id, username, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Utilisateurs', value: totalUsers ?? 0, sub: `${premiumUsers ?? 0} premium`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    { label: 'Témoignages', value: totalTestimonies ?? 0, sub: 'publiés', icon: BookOpen, color: 'text-teal-400', bg: 'bg-teal-900/20' },
    { label: 'Discussions', value: totalPosts ?? 0, sub: 'forum', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-900/20' },
    { label: 'Signalements', value: pendingReports ?? 0, sub: `${activeBans ?? 0} bannis`, icon: Flag, color: 'text-red-400', bg: 'bg-red-900/20', alert: (pendingReports ?? 0) > 0 },
  ]

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return "aujourd'hui"
    if (days === 1) return 'hier'
    return `il y a ${days}j`
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-white mb-1">Vue globale</h1>
        <p className="text-sm text-slate-400">Tableau de bord Cap Citoyen</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, color, bg, alert }) => (
          <div key={label} className={`relative bg-slate-800 border ${alert ? 'border-red-500/50' : 'border-slate-700'} rounded-2xl p-4`}>
            {alert && <span className="absolute top-3 right-3"><AlertTriangle size={14} className="text-red-400" /></span>}
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-medium text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Signalements récents */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Signalements récents</h2>
            <Link href="/admin/reports" className="text-xs text-teal-400 hover:text-teal-300">Voir tout →</Link>
          </div>
          {(recentReports ?? []).length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Aucun signalement</p>
          ) : (
            <div className="space-y-3">
              {(recentReports ?? []).map((r) => {
                const reporter = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
                return (
                  <div key={r.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-300">
                        <span className="font-medium">{(reporter as { username?: string })?.username ?? 'Membre'}</span>
                        {' → '}{r.target_type}
                      </p>
                      {r.reason && <p className="text-xs text-slate-500 mt-0.5">{r.reason}</p>}
                      <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(r.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Nouveaux membres */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Nouveaux membres</h2>
            <Link href="/admin/users" className="text-xs text-teal-400 hover:text-teal-300">Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {(recentUsers ?? []).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                  {u.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{u.username}</p>
                  <p className="text-[10px] text-slate-500">{timeAgo(u.created_at)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  u.role === 'premium' ? 'bg-amber-900/40 text-amber-400' :
                  u.role === 'elite' ? 'bg-yellow-900/40 text-yellow-400' :
                  'bg-slate-700 text-slate-400'
                }`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Accès rapides */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/reports', label: 'Traiter signalements', icon: Flag, urgent: (pendingReports ?? 0) > 0 },
          { href: '/admin/users', label: 'Gérer utilisateurs', icon: Users, urgent: false },
          { href: '/admin/moderators', label: 'Gérer modérateurs', icon: TrendingUp, urgent: false },
          { href: '/admin/content', label: 'Éditer contenu', icon: MessageSquare, urgent: false },
        ].map(({ href, label, icon: Icon, urgent }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors text-center ${urgent ? 'border-red-500/50 bg-red-900/10 hover:bg-red-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
            <Icon size={18} className={urgent ? 'text-red-400' : 'text-slate-400'} />
            <p className="text-xs text-slate-300 leading-tight">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
