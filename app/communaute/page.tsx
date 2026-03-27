// app/communaute/page.tsx
// Server Component — données chargées côté serveur (pas de "use client")

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'
import { MessageSquare, Users, BookOpen, Star, ArrowRight, Plus } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface CommunityStats {
  testimonialCount: number
  forumPostCount: number
  activeMembersCount: number
}

interface RecentTestimony {
  id: string
  user_id: string
  type: 'test_civique' | 'entretien_naturalisation'
  city: string | null
  welcome_rating: number | null
  free_text: string | null
  created_at: string
  profiles: {
    first_name: string | null
    last_name: string | null
  } | null
}

// ── Helpers ────────────────────────────────────────────────────

/** Formate "Prénom N." depuis le profil */
function formatDisplayName(profile: RecentTestimony['profiles']): string {
  if (!profile) return 'Membre'
  const first = profile.first_name ?? ''
  const lastInitial = profile.last_name ? profile.last_name.charAt(0).toUpperCase() + '.' : ''
  return `${first} ${lastInitial}`.trim() || 'Membre'
}

/** Initiales pour l'avatar */
function getInitials(profile: RecentTestimony['profiles']): string {
  const f = profile?.first_name?.charAt(0) ?? ''
  const l = profile?.last_name?.charAt(0) ?? ''
  return (f + l).toUpperCase() || 'M'
}

/** Rendu d'étoiles */
function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex gap-0.5 mb-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
        />
      ))}
    </div>
  )
}

/** Calcule "il y a X jours" sans dépendance externe */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  if (days < 30) return `il y a ${Math.floor(days / 7)} semaine${days >= 14 ? 's' : ''}`
  return `il y a ${Math.floor(days / 30)} mois`
}

// ── Couleurs avatar (rotation sur 5 couleurs douces) ──────────
const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
  'bg-purple-100 text-purple-700',
]

function avatarColor(userId: string): string {
  const sum = userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

// ── Page ───────────────────────────────────────────────────────
export default async function CommunautePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Vérification de l'authentification
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login?redirect=/communaute')

  // 2. Vérification du rôle Premium
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(profile?.role ?? '')) redirect('/communaute/upgrade?feature=la communauté Premium&back=/communaute')

  // 3. Chargement des stats en parallèle (Promise.all = plus rapide)
  const [
    { count: testimonialCount },
    { count: forumPostCount },
    { data: recentTestimonies },
    { count: unreadMessages },
  ] = await Promise.all([
    supabase.from('testimonials').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
    supabase.from('forum_posts').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
    supabase
      .from('testimonials')
      .select(`
        id, user_id, type, city, welcome_rating, free_text, created_at,
        profiles ( first_name, last_name )
      `)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', session.user.id)
      .eq('is_read', false),
  ])

  const stats: CommunityStats = {
    testimonialCount: testimonialCount ?? 0,
    forumPostCount: forumPostCount ?? 0,
    activeMembersCount: 89, // à calculer dynamiquement plus tard
  }

  // ── Rendu ────────────────────────────────────────────────────
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">

      {/* En-tête */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 bg-amber-900/40 text-amber-400 text-xs font-medium px-3 py-1 rounded-full mb-3">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          Premium
        </span>
        <h1 className="text-2xl font-medium text-white mb-1">Espace communauté</h1>
        <p className="text-gray-500 text-sm">
          Échangez avec d'autres candidats à la naturalisation
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { num: stats.testimonialCount, label: 'Témoignages' },
          { num: stats.forumPostCount, label: 'Discussions' },
          { num: stats.activeMembersCount, label: 'Membres actifs' },
        ].map(({ num, label }) => (
          <div key={label} className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700">
            <p className="text-2xl font-medium text-white">{num}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 3 sections principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">

        {/* Témoignages */}
        <Link
          href="/communaute/temoignages"
          className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-slate-500 transition-colors group"
        >
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-3">
            <BookOpen size={18} className="text-teal-600" />
          </div>
          <h2 className="text-sm font-medium text-white mb-1">Retours d'expériences</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Témoignages de candidats ayant passé le test ou l'entretien
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium">
              {stats.testimonialCount} témoignages
            </span>
            <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Forum */}
        <Link
          href="/communaute/forum"
          className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-slate-500 transition-colors group"
        >
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
            <MessageSquare size={18} className="text-orange-600" />
          </div>
          <h2 className="text-sm font-medium text-white mb-1">Forum</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Posez vos questions, partagez vos conseils
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full font-medium">
              {stats.forumPostCount} discussions
            </span>
            <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Messages */}
        <Link
          href="/communaute/messages"
          className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-slate-500 transition-colors group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <Users size={18} className="text-blue-600" />
          </div>
          <h2 className="text-sm font-medium text-white mb-1">Messages privés</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Échangez en privé avec d'autres membres
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
              {(unreadMessages ?? 0) > 0 ? `${unreadMessages} non lus` : 'Aucun non lu'}
            </span>
            <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

      </div>

      {/* Feed — derniers témoignages */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
          Derniers témoignages
        </h3>

        <div className="divide-y divide-slate-700/50">
          {(recentTestimonies as unknown as RecentTestimony[] ?? []).map((t) => (
            <Link
              key={t.id}
              href={`/communaute/temoignages#${t.id}`}
              className="flex gap-3 py-4 hover:bg-slate-800 -mx-2 px-2 rounded-xl transition-colors"
            >
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${avatarColor(t.user_id)}`}>
                {getInitials(t.profiles)}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {formatDisplayName(t.profiles)}
                </p>
                <p className="text-xs text-slate-500 mb-1">
                  {t.type === 'test_civique' ? 'Test civique' : 'Entretien naturalisation'}
                  {t.city ? ` · ${t.city}` : ''}
                  {` · ${timeAgo(t.created_at)}`}
                </p>
                <StarRating rating={t.welcome_rating} />
                {t.free_text && (
                  <p className="text-sm text-slate-300 truncate">
                    {t.free_text}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* CTA partager */}
        <Link
          href="/communaute/temoignages/new"
          className="mt-4 flex items-center justify-center gap-2 w-full border border-slate-600 rounded-xl py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Plus size={15} />
          Partager mon expérience
        </Link>
      </div>


      {/* Bouton partage flottant */}
      <div className="fixed bottom-24 right-4 z-30">
        <ShareButton
          url="/communaute"
          title="Cap Citoyen — Espace communauté"
          text="Rejoins la communauté Cap Citoyen pour préparer ta naturalisation 🇫🇷"
          size={18}
          className="bg-slate-800 border border-slate-700 rounded-full p-1 shadow-lg"
        />
      </div>
    </main>
  )
}
