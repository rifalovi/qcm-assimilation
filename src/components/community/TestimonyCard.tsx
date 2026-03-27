'use client'

// components/community/TestimonyCard.tsx
// Client Component — gère réactions + commentaires de façon interactive

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star, MessageCircle, Flag, ChevronDown, ChevronUp, Send, Mail } from 'lucide-react'
import ShareButton from '@/components/ShareButton'
export type Testimony = {
  id: string
  user_id: string
  type: 'test_civique' | 'entretien_naturalisation'
  passed: boolean | null
  city: string | null
  date_passed: string | null
  welcome_rating: number | null
  difficulty_rating: number | null
  questions_asked: string[] | null
  free_text: string | null
  created_at: string
  profiles: { first_name: string | null; last_name: string | null } | null
  reaction_counts?: Record<string, number>
  comment_count?: number
}

// ── Types ──────────────────────────────────────────────────────
type Comment = {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { first_name: string | null; last_name: string | null } | null
}

// ── Constantes ─────────────────────────────────────────────────
const EMOJIS: { emoji: string; label: string }[] = [
  { emoji: '👍', label: 'Utile' },
  { emoji: '❤️', label: 'Merci' },
  { emoji: '💪', label: 'Courage' },
  { emoji: '🙏', label: 'Solidarité' },
  { emoji: '😮', label: 'Surpris' },
]

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
  'bg-purple-100 text-purple-700',
]

// ── Helpers ────────────────────────────────────────────────────
function avatarColor(userId: string): string {
  const sum = userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function formatName(profile: Testimony['profiles']): string {
  if (!profile) return 'Membre'
  const first = profile.first_name ?? ''
  const lastInitial = profile.last_name ? profile.last_name.charAt(0).toUpperCase() + '.' : ''
  return `${first} ${lastInitial}`.trim() || 'Membre'
}

function getInitials(profile: Testimony['profiles']): string {
  const f = profile?.first_name?.charAt(0) ?? ''
  const l = profile?.last_name?.charAt(0) ?? ''
  return (f + l).toUpperCase() || 'M'
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `${days}j`
  return `${Math.floor(days / 30)}mois`
}

function StarRow({ rating, size = 12 }: { rating: number | null; size?: number }) {
  if (!rating) return null
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600 fill-slate-600'}
        />
      ))}
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────
interface Props {
  testimony: Testimony
  currentUserId: string
  timeAgo: string
}

export default function TestimonyCard({ testimony, currentUserId, timeAgo }: Props) {
  const supabase = createClient()
  const router = useRouter()

  // État réactions
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    testimony.reaction_counts ?? {}
  )
  const [myReaction, setMyReaction] = useState<string | null>(null)

  // État commentaires
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentCount, setCommentCount] = useState(testimony.comment_count ?? 0)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // État signalement
  const [reported, setReported] = useState(false)

  // ── Réactions ──────────────────────────────────────────────
  async function handleReaction(emoji: string) {
    // Optimistic update — met à jour l'UI avant la réponse serveur
    const prev = { ...reactionCounts }
    const prevMyReaction = myReaction

    if (myReaction === emoji) {
      // Retire la réaction
      setMyReaction(null)
      setReactionCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 1) - 1) }))
      await supabase.from('reactions').delete()
        .eq('testimonial_id', testimony.id)
        .eq('user_id', currentUserId)
    } else {
      // Change ou ajoute la réaction
      if (myReaction) {
        setReactionCounts((c) => ({ ...c, [myReaction]: Math.max(0, (c[myReaction] ?? 1) - 1) }))
      }
      setMyReaction(emoji)
      setReactionCounts((c) => ({ ...c, [emoji]: (c[emoji] ?? 0) + 1 }))

      const { error } = await supabase.from('reactions').upsert({
        testimonial_id: testimony.id,
        user_id: currentUserId,
        emoji,
      }, { onConflict: 'testimonial_id,user_id' })

      // Rollback si erreur
      if (error) {
        setReactionCounts(prev)
        setMyReaction(prevMyReaction)
      }
    }
  }

  // ── Commentaires ───────────────────────────────────────────
  async function loadComments() {
    if (commentsLoaded) return
    const { data } = await supabase
      .from('comments')
      .select('id, user_id, content, created_at, profiles ( first_name, last_name )')
      .eq('testimonial_id', testimony.id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })

    setComments((data as unknown as Comment[]) ?? [])
    setCommentsLoaded(true)
  }

  async function toggleComments() {
    if (!showComments && !commentsLoaded) await loadComments()
    setShowComments((v) => !v)
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        testimonial_id: testimony.id,
        user_id: currentUserId,
        content: newComment.trim(),
      })
      .select('id, user_id, content, created_at, profiles ( first_name, last_name )')
      .single()

    if (!error && data) {
      setComments((c) => [...c, data as unknown as Comment])
      setCommentCount((n: number) => n + 1)
      setNewComment('')
    }

    setSubmitting(false)
  }

  // ── Signalement ───────────────────────────────────────────
  async function handleReport() {
    if (reported) return
    await supabase.from('reports').insert({
      reporter_id: currentUserId,
      target_type: 'testimonial',
      target_id: testimony.id,
    })
    setReported(true)
  }

  // ── Rendu ─────────────────────────────────────────────────
  return (
    <article
      id={testimony.id}
      className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-colors"
    >
      {/* En-tête auteur */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${avatarColor(testimony.user_id)}`}>
            {getInitials(testimony.profiles)}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{formatName(testimony.profiles)}</p>
            <p className="text-xs text-slate-500">
              {testimony.type === 'test_civique' ? 'Test civique' : 'Entretien naturalisation'}
              {testimony.city ? ` · ${testimony.city}` : ''}
              {` · ${timeAgo}`}
            </p>
          </div>
        </div>

        {/* Badge réussite */}
        {testimony.passed !== null && (
          <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
            testimony.passed
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
          }`}>
            {testimony.passed ? '✓ Réussi' : '✗ Non réussi'}
          </span>
        )}
      </div>

      {/* Notes */}
      {(testimony.welcome_rating || testimony.difficulty_rating) && (
        <div className="flex flex-wrap gap-4 mb-3">
          {testimony.welcome_rating && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Accueil</span>
              <StarRow rating={testimony.welcome_rating} />
            </div>
          )}
          {testimony.difficulty_rating && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Difficulté</span>
              <StarRow rating={testimony.difficulty_rating} />
            </div>
          )}
        </div>
      )}

      {/* Questions posées */}
      {testimony.questions_asked && testimony.questions_asked.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1.5">Questions posées :</p>
          <div className="flex flex-wrap gap-1.5">
            {testimony.questions_asked.map((q: string, i: number) => (
              <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-600">
                {q}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Témoignage libre */}
      {testimony.free_text && (
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          {testimony.free_text}
        </p>
      )}

      {/* Barre de réactions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
        <div className="flex items-center gap-1 flex-wrap">
          {EMOJIS.map(({ emoji, label }) => {
            const count = reactionCounts[emoji] ?? 0
            const isActive = myReaction === emoji
            return (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                title={label}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                  isActive
                    ? 'bg-teal-50 border border-teal-200 text-teal-700 scale-105'
                    : count > 0
                    ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600'
                    : 'text-slate-600 hover:text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span style={{ fontSize: 14 }}>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {testimony.user_id !== currentUserId && (
            <button
              onClick={() => router.push(`/communaute/messages/${testimony.user_id}`)}
              title="Envoyer un message privé"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-teal-400 hover:bg-slate-700 transition-colors">
              <Mail size={13} />
            </button>
          )}
          <ShareButton
            url={`/communaute/temoignages#${testimony.id}`}
            title="Témoignage — Cap Citoyen"
            text="Découvre ce retour d'expérience sur la naturalisation 🇫🇷"
            size={13}
          />
          {/* Bouton commentaires */}
          <button
            onClick={toggleComments}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
          >
            <MessageCircle size={14} />
            {commentCount > 0 ? commentCount : ''}
            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Signalement */}
          <button
            onClick={handleReport}
            disabled={reported || testimony.user_id === currentUserId}
            title={reported ? 'Signalement envoyé' : 'Signaler ce témoignage'}
            className={`p-1.5 rounded-lg transition-colors ${
              reported
                ? 'text-red-300 cursor-default'
                : 'text-gray-200 hover:text-gray-400 hover:bg-gray-50'
            } disabled:opacity-40`}
          >
            <Flag size={13} />
          </button>
        </div>
      </div>

      {/* Section commentaires (dépliable) */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          {/* Liste commentaires */}
          {comments.length === 0 && commentsLoaded ? (
            <p className="text-xs text-slate-500 text-center py-2">
              Aucun commentaire — soyez le premier !
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${avatarColor(c.user_id)}`}>
                    {getInitials(c.profiles)}
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-xl px-3 py-2">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xs font-medium text-white">{formatName(c.profiles)}</span>
                      <span className="text-[10px] text-slate-500">{timeAgoShort(c.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire nouveau commentaire */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder="Ajouter un commentaire…"
              maxLength={1000}
              className="flex-1 text-xs bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
