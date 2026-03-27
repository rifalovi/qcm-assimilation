import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function StatsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: eliteUsers },
    { count: testimonies },
    { count: forumPosts },
    { count: forumReplies },
    { count: messages },
    { count: reactions },
    { count: comments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'premium'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'elite'),
    supabase.from('testimonials').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
    supabase.from('forum_posts').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
    supabase.from('forum_replies').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
    supabase.from('direct_messages').select('*', { count: 'exact', head: true }),
    supabase.from('reactions').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
  ])

  const sections = [
    {
      title: 'Utilisateurs',
      color: 'border-blue-500/30',
      stats: [
        { label: 'Total membres', value: totalUsers ?? 0 },
        { label: 'Premium', value: premiumUsers ?? 0 },
        { label: 'Élite', value: eliteUsers ?? 0 },
        { label: 'Taux conversion', value: `${totalUsers ? (((premiumUsers ?? 0) + (eliteUsers ?? 0)) / totalUsers * 100).toFixed(1) : 0}%` },
      ]
    },
    {
      title: 'Communauté',
      color: 'border-teal-500/30',
      stats: [
        { label: 'Témoignages', value: testimonies ?? 0 },
        { label: 'Discussions forum', value: forumPosts ?? 0 },
        { label: 'Réponses forum', value: forumReplies ?? 0 },
        { label: 'Messages privés', value: messages ?? 0 },
      ]
    },
    {
      title: 'Engagement',
      color: 'border-amber-500/30',
      stats: [
        { label: 'Réactions', value: reactions ?? 0 },
        { label: 'Commentaires', value: comments ?? 0 },
        { label: 'Interactions total', value: (reactions ?? 0) + (comments ?? 0) },
        { label: 'Moy. par témoignage', value: testimonies ? (((reactions ?? 0) + (comments ?? 0)) / testimonies).toFixed(1) : '0' },
      ]
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Statistiques</h1>
        <p className="text-sm text-slate-400">Vue d'ensemble de la plateforme</p>
      </div>

      <div className="space-y-6">
        {sections.map(({ title, color, stats }) => (
          <div key={title} className={`bg-slate-800 border ${color} rounded-2xl p-5`}>
            <h2 className="text-sm font-medium text-white mb-4">{title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map(({ label, value }) => (
                <div key={label} className="bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xl font-medium text-white">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
