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
    { label: 'Utilisateurs', value: totalUsers ?? 0, sub: `${premiumUsers ?? 0} premium`, icon: Users, tone: 'var(--cc-info)' },
    { label: 'Témoignages', value: totalTestimonies ?? 0, sub: 'publiés', icon: BookOpen, tone: 'var(--cc-success)' },
    { label: 'Discussions', value: totalPosts ?? 0, sub: 'forum', icon: MessageSquare, tone: 'var(--cc-primary)' },
    { label: 'Signalements', value: pendingReports ?? 0, sub: `${activeBans ?? 0} bannis`, icon: Flag, tone: 'var(--cc-danger)', alert: (pendingReports ?? 0) > 0 },
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
        <h1 className="adm-title">Vue globale</h1>
        <p className="adm-subtitle">Tableau de bord Cap Citoyen</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, tone, alert }) => (
          <div key={label} className={`adm-stat ${alert ? 'adm-stat-alert' : ''}`}>
            {alert && <span className="absolute top-3 right-3"><AlertTriangle size={14} style={{ color: 'var(--cc-danger)' }} /></span>}
            <div className="adm-stat-icon" style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}>
              <Icon size={16} />
            </div>
            <p className="adm-stat-value">{value}</p>
            <p className="adm-stat-label">{label}</p>
            <p className="adm-stat-sub">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Signalements récents */}
        <div className="adm-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--cc-text)' }}>Signalements récents</h2>
            <Link href="/admin/reports" className="text-xs font-medium no-underline" style={{ color: 'var(--cc-primary)' }}>Voir tout →</Link>
          </div>
          {(recentReports ?? []).length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--cc-text-disabled)' }}>Aucun signalement</p>
          ) : (
            <div className="space-y-3">
              {(recentReports ?? []).map((r) => {
                const reporter = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
                return (
                  <div key={r.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--cc-danger)' }} />
                    <div>
                      <p className="text-xs" style={{ color: 'var(--cc-text)' }}>
                        <span className="font-medium">{(reporter as { username?: string })?.username ?? 'Membre'}</span>
                        {' → '}{r.target_type}
                      </p>
                      {r.reason && <p className="text-xs mt-0.5" style={{ color: 'var(--cc-text-muted)' }}>{r.reason}</p>}
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--cc-text-disabled)' }}>{timeAgo(r.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Nouveaux membres */}
        <div className="adm-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--cc-text)' }}>Nouveaux membres</h2>
            <Link href="/admin/users" className="text-xs font-medium no-underline" style={{ color: 'var(--cc-primary)' }}>Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {(recentUsers ?? []).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--cc-surface-raised)', color: 'var(--cc-text-muted)' }}>
                  {u.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--cc-text)' }}>{u.username}</p>
                  <p className="text-[10px]" style={{ color: 'var(--cc-text-disabled)' }}>{timeAgo(u.created_at)}</p>
                </div>
                <span className={`cc-badge cc-badge-sm ${
                  u.role === 'premium' ? 'cc-badge-warning' :
                  u.role === 'elite' ? 'cc-badge-warning' :
                  'cc-badge-neutral'
                }`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Accès rapides */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { href: '/admin/reports', label: 'Traiter signalements', icon: Flag, urgent: (pendingReports ?? 0) > 0 },
          { href: '/admin/users', label: 'Gérer utilisateurs', icon: Users, urgent: false },
          { href: '/admin/ai-usage', label: 'Usage IA & tokens', icon: TrendingUp, urgent: false },
          { href: '/admin/emails', label: 'Séquences emails', icon: MessageSquare, urgent: false },
          { href: '/admin/content', label: 'Éditer contenu', icon: BookOpen, urgent: false },
        ].map(({ href, label, icon: Icon, urgent }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors text-center no-underline"
            style={{
              borderColor: urgent ? 'color-mix(in srgb, var(--cc-danger) 45%, transparent)' : 'var(--cc-border)',
              background: urgent ? 'var(--cc-danger-soft)' : 'var(--cc-surface)',
            }}>
            <Icon size={18} style={{ color: urgent ? 'var(--cc-danger)' : 'var(--cc-text-muted)' }} />
            <p className="text-xs leading-tight" style={{ color: 'var(--cc-text)' }}>{label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
