// app/communaute/temoignages/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowLeft } from 'lucide-react'
import TestimonyCard, { type Testimony } from '@/components/community/TestimonyCard'

// Type Testimony défini dans TestimonyCard.tsx

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  if (days < 30) return `il y a ${Math.floor(days / 7)} semaine${days >= 14 ? 's' : ''}`
  return `il y a ${Math.floor(days / 30)} mois`
}
export { timeAgo }

export default async function TemoignagesPage({ searchParams }: { searchParams: { type?: string } }) {
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

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login?redirect=/communaute/temoignages')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'premium' && profile?.role !== 'elite') redirect('/account?upgrade=true')

  const typeFilter = searchParams.type as 'test_civique' | 'entretien_naturalisation' | undefined

  let query = supabase
    .from('testimonials')
    .select('id, user_id, type, passed, city, date_passed, welcome_rating, difficulty_rating, questions_asked, free_text, created_at, profiles ( first_name, last_name )')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(30)

  if (typeFilter) query = query.eq('type', typeFilter)

  const { data: testimonies } = await query
  const testimonyIds = (testimonies ?? []).map((t) => t.id)
  const safeIds = testimonyIds.length ? testimonyIds : ['none']

  const { data: reactions } = await supabase.from('reactions').select('testimonial_id, emoji').in('testimonial_id', safeIds)
  const { data: commentCounts } = await supabase.from('comments').select('testimonial_id').in('testimonial_id', safeIds).eq('is_hidden', false)

  const reactionMap: Record<string, Record<string, number>> = {}
  for (const r of reactions ?? []) {
    if (!reactionMap[r.testimonial_id]) reactionMap[r.testimonial_id] = {}
    reactionMap[r.testimonial_id][r.emoji] = (reactionMap[r.testimonial_id][r.emoji] ?? 0) + 1
  }
  const commentMap: Record<string, number> = {}
  for (const c of commentCounts ?? []) {
    commentMap[c.testimonial_id] = (commentMap[c.testimonial_id] ?? 0) + 1
  }

  const enriched: Testimony[] = (((testimonies ?? []) as unknown) as Testimony[]).map((t) => ({
    ...t,
    reaction_counts: reactionMap[t.id] ?? {},
    comment_count: commentMap[t.id] ?? 0,
  }))

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/communaute" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={15} />Communauté
        </Link>
        <Link href="/communaute/temoignages/new" className="inline-flex items-center gap-1.5 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors">
          <Plus size={15} />Partager mon expérience
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Retours d&apos;expériences</h1>
        <p className="text-sm text-slate-400">{enriched.length} témoignage{enriched.length > 1 ? 's' : ''} partagé{enriched.length > 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { label: 'Tous', href: '/communaute/temoignages', active: !typeFilter, color: 'bg-slate-400 text-slate-900' },
          { label: 'Test civique', href: '/communaute/temoignages?type=test_civique', active: typeFilter === 'test_civique', color: 'bg-teal-600 text-white' },
          { label: 'Entretien', href: '/communaute/temoignages?type=entretien_naturalisation', active: typeFilter === 'entretien_naturalisation', color: 'bg-orange-500 text-white' },
        ].map(({ label, href, active, color }) => (
          <Link key={label} href={href} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? color : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            {label}
          </Link>
        ))}
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm mb-4">Aucun témoignage pour l&apos;instant.</p>
          <Link href="/communaute/temoignages/new" className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors">
            <Plus size={15} />Soyez le premier à partager
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enriched.map((testimony) => (
            <TestimonyCard key={testimony.id} testimony={testimony} currentUserId={session.user.id} timeAgo={timeAgo(testimony.created_at)} />
          ))}
        </div>
      )}
    </main>
  )
}
