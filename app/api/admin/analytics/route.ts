// app/api/admin/analytics/route.ts
//
// Endpoint unique qui agrège tous les chiffres du dashboard /admin/analytics.
// 5 sections :
//   1. KPIs globaux (utilisateurs, conversion, totaux)
//   2. Évolution des inscriptions (auth.users.created_at) — bucketing day/week/month
//   3. Top pages visitées (user_events $pageview)
//   4. Top épisodes écoutés (user_events audio_played)
//   5. Quiz complétés (table results) + courbe quotidienne
//
// Toutes les agrégations sont faites en JS depuis les requêtes Supabase :
// pas de nouvelle table ni de fonction SQL pour cette version.

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

type Granularity = 'day' | 'week' | 'month'

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function bucketKey(date: Date, granularity: Granularity): string {
  const d = startOfDayUtc(date)
  if (granularity === 'day') return d.toISOString().slice(0, 10)
  if (granularity === 'month') return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  // week → ISO week number, format YYYY-Www
  const target = new Date(d)
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${target.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function fillBuckets(
  rows: { created_at: string }[],
  granularity: Granularity,
  daysBack: number,
): { date: string; count: number }[] {
  // Initialise toutes les buckets de la période à 0 pour éviter les trous
  const map = new Map<string, number>()
  const now = new Date()
  const start = new Date(now.getTime() - daysBack * 86400000)

  if (granularity === 'day') {
    for (let t = startOfDayUtc(start).getTime(); t <= now.getTime(); t += 86400000) {
      map.set(bucketKey(new Date(t), granularity), 0)
    }
  } else if (granularity === 'week') {
    for (let t = startOfDayUtc(start).getTime(); t <= now.getTime(); t += 7 * 86400000) {
      map.set(bucketKey(new Date(t), granularity), 0)
    }
  } else {
    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
    while (cursor <= now) {
      map.set(bucketKey(cursor, granularity), 0)
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
    }
  }

  for (const row of rows) {
    const d = new Date(row.created_at)
    if (Number.isNaN(d.getTime())) continue
    const key = bucketKey(d, granularity)
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
    else map.set(key, 1) // out of range, ignore? non, on garde
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))
}

// ─── Pagination des utilisateurs auth ─────────────────────────────────────
async function listAllAuthUsers(admin: ReturnType<typeof Object>) {
  // adminClient.auth.admin.listUsers : 1000 max par page
  // On boucle au max 20 pages (= 20 000 utilisateurs) pour éviter de
  // bloquer la requête si la base grossit.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any
  const all: { id: string; created_at: string }[] = []
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await a.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) break
    const users = data?.users ?? []
    for (const u of users) all.push({ id: u.id, created_at: u.created_at })
    if (users.length < 1000) break
  }
  return all
}

// ─── GET ──────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const url = new URL(req.url)
  const granularity = (url.searchParams.get('granularity') ?? 'day') as Granularity
  const daysBack = Math.max(7, Math.min(365, Number(url.searchParams.get('days') ?? 30)))
  const limit = Math.max(5, Math.min(20, Number(url.searchParams.get('limit') ?? 10)))

  const since = new Date(Date.now() - daysBack * 86400000).toISOString()

  // ─── Requêtes parallèles ────────────────────────────────────────────────
  const [
    profilesRes,
    pageviewsRes,
    audioPlaysRes,
    resultsRes,
    authUsers,
    passesRes,
  ] = await Promise.all([
    gate.admin
      .from('profiles')
      .select('role'),
    gate.admin
      .from('user_events')
      .select('properties, created_at')
      .eq('event_type', '$pageview')
      .gte('created_at', since)
      .limit(5000),
    gate.admin
      .from('user_events')
      .select('properties, created_at')
      .eq('event_type', 'audio_played')
      .gte('created_at', since)
      .limit(5000),
    gate.admin
      .from('results')
      .select('id, score_percent, passed, mode, created_at')
      .gte('created_at', since)
      .limit(5000),
    listAllAuthUsers(gate.admin),
    gate.admin
      .from('passes')
      .select('type, amount_eur, created_at, status, expires_at'),
  ])

  if (profilesRes.error) {
    return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })
  }

  // ─── 1. KPIs globaux ────────────────────────────────────────────────────
  const profiles = profilesRes.data ?? []
  const totalUsers = profiles.length
  const counts = { anonymous: 0, freemium: 0, premium: 0, elite: 0, moderator: 0, admin: 0, super_admin: 0 } as Record<string, number>
  for (const p of profiles) counts[p.role as string] = (counts[p.role as string] ?? 0) + 1

  const nonAnonymous = totalUsers - counts.anonymous
  const paidUsers = counts.premium + counts.elite
  const conversionRate = nonAnonymous > 0 ? (paidUsers / nonAnonymous) * 100 : 0

  // ─── 1b. KPIs Passes ──────────────────────────────────────────────────
  type PassRow = { type: string; amount_eur: number | null; created_at: string; status: string; expires_at: string }
  const passes = (passesRes.data ?? []) as PassRow[]
  const now = new Date()
  const passesActives = passes.filter(p => p.status === 'active' && new Date(p.expires_at) > now)
  const passesExpress  = passesActives.filter(p => p.type === 'express').length
  const passesSerenite = passesActives.filter(p => p.type === 'serenite').length

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const revenusMonth = passes
    .filter(p => p.created_at >= startOfMonth)
    .reduce((sum, p) => sum + (p.amount_eur ?? 0), 0)

  const totalPassActifs = passesExpress + passesSerenite
  const conversionPassRate = nonAnonymous > 0
    ? Math.round((totalPassActifs / nonAnonymous) * 1000) / 10
    : 0

  // ─── 2. Évolution des inscriptions ─────────────────────────────────────
  // Toutes les inscriptions filtrées par fenêtre puis bucketing
  const recentSignups = authUsers
    .filter((u) => new Date(u.created_at).getTime() >= Date.now() - daysBack * 86400000)
  const signupsTimeline = fillBuckets(recentSignups, granularity, daysBack)
  const signupsTotal = recentSignups.length
  const allTimeSignups = authUsers.length

  // ─── 3. Top pages visitées ─────────────────────────────────────────────
  type EventRow = { properties: Record<string, unknown> | null; created_at: string }
  const pageviews = (pageviewsRes.data ?? []) as EventRow[]
  const pagesMap = new Map<string, number>()
  for (const row of pageviews) {
    const path = (row.properties?.path as string) ?? '(?)'
    // Normalise : retire query string et trailing slash
    const cleanPath = path.split('?')[0].replace(/\/+$/, '') || '/'
    pagesMap.set(cleanPath, (pagesMap.get(cleanPath) ?? 0) + 1)
  }
  const topPages = Array.from(pagesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, count]) => ({ path, count }))
  const totalPageviews = pageviews.length

  // ─── 4. Top épisodes écoutés ───────────────────────────────────────────
  const audioPlays = (audioPlaysRes.data ?? []) as EventRow[]
  const episodesMap = new Map<string, { title: string; slug: string; count: number }>()
  for (const row of audioPlays) {
    const props = row.properties ?? {}
    const slug = (props.episode_slug as string) ?? (props.episodeId as string) ?? '?'
    const title = (props.episode_title as string) ?? (props.episodeTitle as string) ?? slug
    const cur = episodesMap.get(slug) ?? { title, slug, count: 0 }
    cur.count += 1
    episodesMap.set(slug, cur)
  }
  const topEpisodes = Array.from(episodesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
  const totalAudioPlays = audioPlays.length

  // ─── 5. Quiz complétés ─────────────────────────────────────────────────
  type QuizRow = { id: string; score_percent: number; passed: boolean; mode: string; created_at: string }
  const results = (resultsRes.data ?? []) as QuizRow[]
  const quizTotal = results.length
  const quizPassed = results.filter((r) => r.passed).length
  const quizFailed = quizTotal - quizPassed
  const quizExam = results.filter((r) => r.mode === 'exam').length
  const quizTrain = results.filter((r) => r.mode === 'train').length
  const avgScore = quizTotal > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.score_percent ?? 0), 0) / quizTotal)
    : 0
  const quizTimeline = fillBuckets(results, granularity, daysBack)

  // ─── Réponse ────────────────────────────────────────────────────────────
  return NextResponse.json({
    range: { days: daysBack, granularity, since },
    kpis: {
      totalUsers,
      counts,
      paidUsers,
      conversionRate: Math.round(conversionRate * 10) / 10,
      allTimeSignups,
      totalAudioPlays,
      totalPageviews,
      quizTotal,
      avgScore,
      passesExpress,
      passesSerenite,
      revenusMonth: Math.round(revenusMonth * 100) / 100,
      conversionPassRate,
    },
    signups: {
      timeline: signupsTimeline,
      total: signupsTotal,
      allTime: allTimeSignups,
    },
    pages: {
      total: totalPageviews,
      top: topPages,
    },
    episodes: {
      total: totalAudioPlays,
      top: topEpisodes,
    },
    quiz: {
      total: quizTotal,
      passed: quizPassed,
      failed: quizFailed,
      exam: quizExam,
      train: quizTrain,
      avgScore,
      timeline: quizTimeline,
    },
  })
}
