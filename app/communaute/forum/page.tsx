import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, MessageSquare, Pin } from 'lucide-react'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  if (days < 30) return `il y a ${Math.floor(days / 7)} semaine${days >= 14 ? 's' : ''}`
  return `il y a ${Math.floor(days / 30)} mois`
}

function getInitials(fn: string | null, ln: string | null) {
  return ((fn?.charAt(0) ?? '') + (ln?.charAt(0) ?? '')).toUpperCase() || 'M'
}

function formatName(fn: string | null, ln: string | null) {
  if (!fn && !ln) return 'Membre'
  return `${fn ?? ''} ${ln ? ln.charAt(0).toUpperCase() + '.' : ''}`.trim()
}

const AVATAR_COLORS = [
  'bg-teal-900/60 text-teal-300',
  'bg-orange-900/60 text-orange-300',
  'bg-blue-900/60 text-blue-300',
  'bg-pink-900/60 text-pink-300',
  'bg-purple-900/60 text-purple-300',
]
function avatarColor(id: string) {
  const sum = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export default async function ForumPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login?redirect=/communaute/forum')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'premium' && profile?.role !== 'elite') redirect('/communaute/upgrade?feature=le forum&back=/communaute/forum')

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, user_id, title, content, is_pinned, reply_count, created_at, profiles ( first_name, last_name )')
    .eq('is_hidden', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const pinned = (posts ?? []).filter((p) => p.is_pinned)
  const regular = (posts ?? []).filter((p) => !p.is_pinned)

  function PostRow({ post }: { post: typeof posts extends (infer T)[] | null ? T : never }) {
    if (!post) return null
    const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
    return (
      <Link href={`/communaute/forum/${post.id}`}
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/60 transition-colors rounded-xl -mx-1">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${avatarColor(post.user_id)}`}>
          {getInitials(profile?.first_name ?? null, profile?.last_name ?? null)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {post.is_pinned && <Pin size={11} className="text-amber-400 flex-shrink-0" />}
            <p className="text-sm font-medium text-white truncate">{post.title}</p>
          </div>
          <p className="text-xs text-slate-500">
            {formatName(profile?.first_name ?? null, profile?.last_name ?? null)} · {timeAgo(post.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1 text-slate-500 flex-shrink-0">
          <MessageSquare size={13} />
          <span className="text-xs">{post.reply_count ?? 0}</span>
        </div>
      </Link>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/communaute" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={15} />Communauté
        </Link>
        <Link href="/communaute/forum/new"
          className="inline-flex items-center gap-1.5 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors">
          <Plus size={15} />Nouveau fil
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Forum</h1>
        <p className="text-sm text-slate-400">{(posts ?? []).length} discussion{(posts ?? []).length > 1 ? 's' : ''}</p>
      </div>

      {(posts ?? []).length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm mb-4">Aucune discussion pour l&apos;instant.</p>
          <Link href="/communaute/forum/new"
            className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors">
            <Plus size={15} />Lancer la première discussion
          </Link>
        </div>
      ) : (
        <div className="space-y-0.5">
          {pinned.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Épinglés</p>
              {pinned.map((post) => <PostRow key={post.id} post={post} />)}
            </div>
          )}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1 mt-4">Discussions</p>}
              {regular.map((post) => <PostRow key={post.id} post={post} />)}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
