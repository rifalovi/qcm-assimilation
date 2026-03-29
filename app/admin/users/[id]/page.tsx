import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days}j`
  return `il y a ${Math.floor(days / 30)} mois`
}

export default async function UserProfilePage({ params }: { params: { id: string } }) {
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

  const userId = (await params).id.replace(/\/+$/, '')

  // Récupérer l'email auth
  let userEmail = ''
  try {
    const { data: { user: authUser }, error: authError } = await adminClient.auth.admin.getUserById(userId)
    if (authError) console.error('[admin/users] auth error:', authError)
    userEmail = authUser?.email ?? ''
    console.log('[admin/users] userId:', userId, 'email:', userEmail)
  } catch (e) { console.error('[admin/users] catch:', e) }

  // Charge tout en parallèle
  const [
    { data: profile },
    { data: subscription },
    { data: results },
    { data: testimonials },
    { data: forumPosts },
    { data: messages },
    { data: ban },
    { data: reports },
    { data: userEvents },
  ] = await Promise.all([
    adminClient.from('profiles').select('*').eq('id', userId).single(),
    adminClient.from('subscriptions').select('*').eq('user_id', userId).single(),
    Promise.resolve({ data: [] }),
    adminClient.from('testimonials').select('id, type, city, passed, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    adminClient.from('forum_posts').select('id, title, reply_count, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    adminClient.from('direct_messages').select('id, created_at').eq('sender_id', userId),
    adminClient.from('bans').select('*').eq('user_id', userId).single(),
    adminClient.from('reports').select('*').eq('reporter_id', userId),
    adminClient.from('user_events').select('event_type, properties, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
  ])

  // Charge les résultats via email
  const { data: resultsData } = await adminClient
    .from('results')
    .select('id, score_percent, passed, mode, created_at, level')
    .eq('email', userEmail)
    .order('created_at', { ascending: false })
    .limit(20)

  const ROLE_COLORS: Record<string, string> = {
    anonymous: 'bg-slate-700 text-slate-300',
    freemium: 'bg-blue-900/40 text-blue-300',
    premium: 'bg-amber-900/40 text-amber-300',
    elite: 'bg-yellow-900/40 text-yellow-300',
    moderator: 'bg-teal-900/40 text-teal-300',
    admin: 'bg-purple-900/40 text-purple-300',
    super_admin: 'bg-red-900/40 text-red-300',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users" className="text-slate-400 hover:text-white transition">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-medium text-white">
            {profile?.username?.charAt(0).toUpperCase() ?? 'M'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium text-white">{profile?.username}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[profile?.role] ?? 'bg-slate-700 text-slate-300'}`}>
                {profile?.role}
              </span>
              {ban && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">Banni</span>}
            </div>
            <p className="text-sm text-slate-400">{profile?.city ?? 'Ville non renseignée'}</p>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Tests effectués', value: resultsData?.length ?? 0 },
          { label: 'Témoignages', value: testimonials?.length ?? 0 },
          { label: 'Posts forum', value: forumPosts?.length ?? 0 },
          { label: 'Messages envoyés', value: messages?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <p className="text-2xl font-medium text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Infos profil */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Informations</h2>
          <table className="w-full text-sm">
            {[
              { label: 'Email', value: userEmail || '—' },
              { label: 'Pseudo', value: profile?.username ?? '—' },
              { label: 'Prénom', value: profile?.first_name ?? '—' },
              { label: 'Nom', value: profile?.last_name ?? '—' },
              { label: 'Ville', value: profile?.city ?? '—' },
              { label: 'Code postal', value: profile?.postal_code ?? '—' },
              { label: 'Rôle', value: profile?.role ?? '—' },
              { label: 'Abonnement', value: subscription?.status ?? 'Aucun' },
              { label: 'Expire le', value: subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('fr-FR') : '—' },
              { label: 'Inscrit', value: profile?.updated_at ? timeAgo(profile.updated_at) : '—' },
            ].map(({ label, value }) => (
              <tr key={label} className="border-b border-slate-700/50 last:border-0">
                <td className="py-2 text-slate-400 pr-4">{label}</td>
                <td className="py-2 text-white">{value}</td>
              </tr>
            ))}
          </table>
        </div>

        {/* Derniers résultats */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Derniers tests</h2>
          {!resultsData?.length ? (
            <p className="text-slate-500 text-sm">Aucun test effectué</p>
          ) : (
            <div className="space-y-2">
              {resultsData.slice(0, 8).map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${r.mode === 'exam' ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>
                      {r.mode === 'exam' ? 'Exam' : 'Train'}
                    </span>
                    <span className="text-sm text-white">{(r.score_percent ?? 0).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.passed ? '✓' : '✗'}
                    </span>
                    <span className="text-xs text-slate-500">{timeAgo(r.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Témoignages */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Témoignages publiés</h2>
          {!testimonials?.length ? (
            <p className="text-slate-500 text-sm">Aucun témoignage</p>
          ) : (
            <div className="space-y-2">
              {testimonials.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <div>
                    <p className="text-sm text-white">{t.type === 'test_civique' ? 'Test civique' : 'Entretien'}</p>
                    <p className="text-xs text-slate-400">{t.city ?? '—'} · {timeAgo(t.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.passed ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                    {t.passed ? 'Réussi' : 'Non réussi'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Posts forum */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Activité forum</h2>
          {!forumPosts?.length ? (
            <p className="text-slate-500 text-sm">Aucun post</p>
          ) : (
            <div className="space-y-2">
              {forumPosts.map((post) => (
                <div key={post.id} className="py-2 border-b border-slate-700/50 last:border-0">
                  <Link href={`/communaute/forum/${post.id}`} target="_blank"
                    className="text-sm text-teal-400 hover:text-teal-300 transition truncate block">
                    {post.title}
                  </Link>
                  <p className="text-xs text-slate-500">{post.reply_count} réponses · {timeAgo(post.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activité Audio & Scroll */}
        {(userEvents?.filter(e => ['audio_played','scroll_card_viewed','quiz_started','quiz_completed'].includes(e.event_type)).length ?? 0) > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-sm font-medium text-white mb-4">🎧 Activité Audio & Scroll</h2>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {userEvents?.filter(e => ['audio_played','scroll_card_viewed','quiz_started','quiz_completed'].includes(e.event_type)).map((e, i) => {
                const icons: Record<string,string> = { audio_played: '🎧', scroll_card_viewed: '🃏', quiz_started: '📝', quiz_completed: '✅' }
                const labels: Record<string,string> = { audio_played: 'Audio écouté', scroll_card_viewed: 'Flash-card vue', quiz_started: 'Quiz démarré', quiz_completed: 'Quiz terminé' }
                const detail = e.event_type === 'audio_played' ? (e.properties?.episode_title ?? e.properties?.episodeTitle ?? '') :
                               e.event_type === 'quiz_completed' ? `Score: ${e.properties?.score ?? '—'}` : ''
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{icons[e.event_type]}</span>
                      <div>
                        <p className="text-xs text-white">{labels[e.event_type]}</p>
                        {detail && <p className="text-[10px] text-slate-400">{String(detail)}</p>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(e.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Signalements émis */}
        {(reports?.length ?? 0) > 0 && (
          <div className="bg-slate-800 border border-red-500/20 rounded-2xl p-5">
            <h2 className="text-sm font-medium text-red-400 mb-4">⚠ Signalements émis ({reports?.length})</h2>
            <div className="space-y-2">
              {reports?.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1">
                  <span className="text-xs text-slate-400">{r.target_type}</span>
                  <span className="text-xs text-slate-500">{timeAgo(r.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
