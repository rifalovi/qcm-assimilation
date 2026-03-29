'use client'

type Stats = {
  totalUsers: number
  premiumUsers: number
  freemiumUsers: number
  eliteUsers: number
  recentSignups: { username: string; role: string; created_at: string; city: string | null }[]
  topCities: { city: string; count: number }[]
  topEvents: { event_type: string; count: number }[]
  recentEvents: { event_type: string; properties: Record<string, unknown>; created_at: string }[]
}

// Labels lisibles pour chaque type d'événement
const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  '$pageview':        { label: 'Page visitée',         icon: '👁️',  color: 'text-slate-300' },
  'quiz_started':     { label: 'Quiz démarré',          icon: '📝',  color: 'text-blue-300' },
  'quiz_completed':   { label: 'Quiz terminé',          icon: '✅',  color: 'text-emerald-300' },
  'audio_played':     { label: 'Audio écouté',          icon: '🎧',  color: 'text-purple-300' },
  'scroll_card_viewed': { label: 'Flash-card vue',      icon: '🃏',  color: 'text-cyan-300' },
  'upgrade_clicked':  { label: 'Upgrade cliqué',        icon: '👑',  color: 'text-amber-300' },
  'register_completed': { label: 'Inscription',         icon: '🎉',  color: 'text-green-300' },
  'location_collected': { label: 'Localisation',        icon: '📍',  color: 'text-rose-300' },
  'location_skipped': { label: 'Localisation ignorée',  icon: '⏭️', color: 'text-slate-400' },
}

function formatEventProps(type: string, props: Record<string, unknown>): string {
  if (type === '$pageview') return `→ ${props.path ?? ''}`
  if (type === 'quiz_started') return `Thème: ${props.theme ?? '—'}`
  if (type === 'quiz_completed') return `Score: ${props.score ?? '—'} • ${props.theme ?? ''}`
  if (type === 'audio_played') return `${props.episodeTitle ?? props.episodeId ?? '—'}`
  if (type === 'scroll_card_viewed') return `Question #${props.questionId ?? '—'}`
  if (type === 'upgrade_clicked') return `Source: ${props.source ?? '—'}`
  if (type === 'location_collected') return `${props.city ?? '—'} ${props.postal_code ?? ''}`
  return Object.entries(props).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' • ')
}

function KPICard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue:    'border-blue-400/20 bg-blue-500/10 text-blue-300',
    amber:   'border-amber-400/20 bg-amber-500/10 text-amber-300',
    emerald: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
    yellow:  'border-yellow-400/20 bg-yellow-500/10 text-yellow-300',
  }
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="text-2xl">{icon}</div>
      <div className="mt-3 text-3xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-xs font-semibold">{label}</div>
    </div>
  )
}

export default function AnalyticsClient({ stats }: { stats: Stats }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-white mb-1">Analytics</h1>
        <p className="text-sm text-slate-400">Activité et métriques de Cap Citoyen</p>
      </div>

      <div className="space-y-8">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-4">
          <KPICard label="Utilisateurs total" value={stats.totalUsers} icon="👥" color="blue" />
          <KPICard label="Comptes Premium" value={stats.premiumUsers} icon="🎯" color="amber" />
          <KPICard label="Comptes Élite" value={stats.eliteUsers} icon="👑" color="yellow" />
          <KPICard label="Comptes Freemium" value={stats.freemiumUsers} icon="✨" color="emerald" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Dernières inscriptions */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Dernières inscriptions</h2>
            <div className="space-y-2">
              {stats.recentSignups.map((u, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                  <div>
                    <span className="text-sm font-semibold text-white">{u.username}</span>
                    {u.city && <span className="ml-2 text-xs text-slate-400">📍 {u.city}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      u.role === 'premium' ? 'bg-amber-500/20 text-amber-300' :
                      u.role === 'elite' ? 'bg-yellow-500/20 text-yellow-300' :
                      u.role === 'freemium' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-white/10 text-slate-400'
                    }`}>{u.role}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition géographique */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Répartition géographique</h2>
            {stats.topCities.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune donnée encore collectée</p>
            ) : (
              <div className="space-y-2">
                {stats.topCities.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-4 text-xs text-slate-500">{i + 1}</span>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between">
                        <span className="text-sm text-white">{c.city}</span>
                        <span className="text-xs text-slate-400">{c.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${(c.count / stats.topCities[0].count) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Fonctionnalités les plus utilisées */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Fonctionnalités les plus utilisées</h2>
            {stats.topEvents.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun événement encore enregistré</p>
            ) : (
              <div className="space-y-2">
                {stats.topEvents.map((e, i) => {
                  const meta = EVENT_LABELS[e.event_type]
                  return (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span>{meta?.icon ?? '📊'}</span>
                        <span className={`text-sm ${meta?.color ?? 'text-slate-300'}`}>
                          {meta?.label ?? e.event_type}
                        </span>
                      </div>
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300">{e.count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Événements récents */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Événements récents</h2>
            {stats.recentEvents.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun événement encore enregistré</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {stats.recentEvents.map((e, i) => {
                  const meta = EVENT_LABELS[e.event_type]
                  const detail = formatEventProps(e.event_type, e.properties)
                  return (
                    <div key={i} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{meta?.icon ?? '📊'}</span>
                          <span className={`text-xs font-semibold ${meta?.color ?? 'text-white'}`}>
                            {meta?.label ?? e.event_type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(e.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {detail && (
                        <p className="mt-1 truncate text-[10px] text-slate-400">{detail}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
