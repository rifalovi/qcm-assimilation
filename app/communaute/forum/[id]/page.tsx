'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send, Flag, Pin, Mail } from 'lucide-react'

type Post = {
  id: string; user_id: string; title: string; content: string
  is_pinned: boolean; reply_count: number; created_at: string
  profiles: { first_name: string | null; last_name: string | null } | null
}

type Reply = {
  id: string; user_id: string; content: string; created_at: string
  profiles: { first_name: string | null; last_name: string | null } | null
}

const EMOJIS = ['👍','❤️','💪','🙏','😮']
const AVATAR_COLORS = ['bg-teal-900/60 text-teal-300','bg-orange-900/60 text-orange-300','bg-blue-900/60 text-blue-300','bg-pink-900/60 text-pink-300','bg-purple-900/60 text-purple-300']

function avatarColor(id: string) {
  const sum = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}
function getInitials(p: Post['profiles']) {
  return ((p?.first_name?.charAt(0) ?? '') + (p?.last_name?.charAt(0) ?? '')).toUpperCase() || 'M'
}
function formatName(p: Post['profiles']) {
  if (!p?.first_name && !p?.last_name) return 'Membre'
  return `${p?.first_name ?? ''} ${p?.last_name ? p.last_name.charAt(0).toUpperCase() + '.' : ''}`.trim()
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  return `il y a ${Math.floor(days / 30)} mois`
}

function ReplyCard({ reply, currentUserId, supabase }: { reply: Reply; currentUserId: string; supabase: ReturnType<typeof createClient> }) {
  const [reactions, setReactions] = useState<Record<string, number>>({})
  const [myReaction, setMyReaction] = useState<string | null>(null)
  const [reported, setReported] = useState(false)

  async function handleReaction(emoji: string) {
    const prev = { ...reactions }; const prevMy = myReaction
    if (myReaction === emoji) {
      setMyReaction(null)
      setReactions((r) => ({ ...r, [emoji]: Math.max(0, (r[emoji] ?? 1) - 1) }))
      await supabase.from('reactions').delete().eq('testimonial_id', reply.id).eq('user_id', currentUserId)
    } else {
      if (myReaction) setReactions((r) => ({ ...r, [myReaction]: Math.max(0, (r[myReaction] ?? 1) - 1) }))
      setMyReaction(emoji)
      setReactions((r) => ({ ...r, [emoji]: (r[emoji] ?? 0) + 1 }))
      const { error } = await supabase.from('reactions').upsert(
        { testimonial_id: reply.id, user_id: currentUserId, emoji },
        { onConflict: 'testimonial_id,user_id' }
      )
      if (error) { setReactions(prev); setMyReaction(prevMy) }
    }
  }

  return (
    <div className="flex gap-3 py-4 border-b border-slate-700/50 last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${avatarColor(reply.user_id)}`}>
        {getInitials(reply.profiles)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-white">{formatName(reply.profiles)}</span>
          <span className="text-xs text-slate-500">{timeAgo(reply.created_at)}</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-2">{reply.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {EMOJIS.map((emoji) => {
              const count = reactions[emoji] ?? 0
              const isActive = myReaction === emoji
              return (
                <button key={emoji} onClick={() => handleReaction(emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${isActive ? 'bg-teal-900/50 border border-teal-600 text-teal-300' : count > 0 ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}>
                  <span style={{ fontSize: 13 }}>{emoji}</span>
                  {count > 0 && <span>{count}</span>}
                </button>
              )
            })}
          </div>
          <button onClick={async () => { if (reported) return; await supabase.from('reports').insert({ reporter_id: currentUserId, target_type: 'comment', target_id: reply.id }); setReported(true) }}
            disabled={reported || reply.user_id === currentUserId}
            className={`p-1 rounded transition-colors ${reported ? 'text-red-400' : 'text-slate-600 hover:text-slate-400'} disabled:opacity-40`}>
            <Flag size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ForumPostPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = useState('')
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const { data: postData } = await supabase
        .from('forum_posts')
        .select('id, user_id, title, content, is_pinned, reply_count, created_at, profiles ( first_name, last_name )')
        .eq('id', params.id)
        .single()

      const { data: repliesData } = await supabase
        .from('forum_replies')
        .select('id, user_id, content, created_at, profiles ( first_name, last_name )')
        .eq('post_id', params.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true })

      if (postData) {
        const p = postData as unknown as Post & { profiles: { first_name: string | null; last_name: string | null }[] | null }
        setPost({ ...p, profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles })
      }
      setReplies((repliesData as unknown as Reply[]) ?? [])
      setLoading(false)
    }
    load()
  }, [params.id, router, supabase])

  async function handleReply() {
    if (!newReply.trim() || submitting) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('forum_replies')
      .insert({ post_id: params.id, user_id: currentUserId, content: newReply.trim() })
      .select('id, user_id, content, created_at, profiles ( first_name, last_name )')
      .single()
    if (!error && data) {
      setReplies((r) => [...r, data as unknown as Reply])
      setNewReply('')
      await supabase.from('forum_posts').update({ reply_count: replies.length + 1 }).eq('id', params.id)
    }
    setSubmitting(false)
  }

  if (loading) return <main className="max-w-2xl mx-auto px-4 py-16 text-center"><p className="text-slate-400 text-sm">Chargement…</p></main>
  if (!post) return <main className="max-w-2xl mx-auto px-4 py-16 text-center"><p className="text-slate-400 text-sm">Discussion introuvable.</p></main>

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/communaute/forum')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6">
        <ArrowLeft size={15} />Forum
      </button>

      {/* Post principal */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${avatarColor(post.user_id)}`}>
            {getInitials(post.profiles)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {post.is_pinned && <Pin size={12} className="text-amber-400" />}
              <p className="text-sm font-medium text-white">{formatName(post.profiles)}</p>
              <span className="text-xs text-slate-500">{timeAgo(post.created_at)}</span>
            </div>
            <h1 className="text-lg font-medium text-white mt-1">{post.title}</h1>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">{post.content}</p>
        {post.user_id !== currentUserId && (
          <button
            onClick={() => router.push(`/communaute/messages/${post.user_id}`)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors">
            <Mail size={13} />
            Contacter {formatName(post.profiles)}
          </button>
        )}
      </div>

      {/* Réponses */}
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          {replies.length} réponse{replies.length > 1 ? 's' : ''}
        </p>
        {replies.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Aucune réponse — soyez le premier !</p>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5">
            {replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} currentUserId={currentUserId} supabase={supabase} />
            ))}
          </div>
        )}
      </div>

      {/* Formulaire réponse */}
      <div className="flex gap-2">
        <textarea value={newReply} onChange={(e) => setNewReply(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleReply())}
          placeholder="Votre réponse… (Entrée pour envoyer, Maj+Entrée pour sauter une ligne)"
          rows={3} maxLength={2000}
          className="flex-1 border border-slate-600 rounded-2xl px-4 py-3 text-sm bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-none" />
        <button onClick={handleReply} disabled={!newReply.trim() || submitting}
          className="self-end p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors">
          <Send size={16} />
        </button>
      </div>
    </main>
  )
}
