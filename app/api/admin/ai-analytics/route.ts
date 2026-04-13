import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )
}

export async function GET() {
  // Vérifier admin
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Récupérer tous les événements ai_usage
  const { data: events } = await admin
    .from('user_events')
    .select('user_id, properties, created_at')
    .eq('event_type', 'ai_usage')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (!events) return NextResponse.json({ error: 'No data' }, { status: 500 })

  // Agréger les données
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)
  const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30)

  let totalTokens = 0, todayTokens = 0, weekTokens = 0, monthTokens = 0
  let totalRequests = 0, todayRequests = 0, weekRequests = 0, monthRequests = 0
  let offTopicCount = 0

  const byMode: Record<string, { requests: number; tokens: number }> = {}
  const byUser: Record<string, { requests: number; tokens: number; username?: string }> = {}
  const dailyUsage: Record<string, { requests: number; tokens: number }> = {}

  const userIds = new Set<string>()

  for (const e of events) {
    const props = e.properties as Record<string, unknown> ?? {}
    const tokens = (props.total_tokens as number) ?? 0
    const mode = (props.mode as string) ?? 'unknown'
    const created = new Date(e.created_at)
    const dayKey = created.toISOString().split('T')[0]

    totalTokens += tokens
    totalRequests++

    if (created >= todayStart) { todayTokens += tokens; todayRequests++ }
    if (created >= weekStart) { weekTokens += tokens; weekRequests++ }
    if (created >= monthStart) { monthTokens += tokens; monthRequests++ }

    if (props.off_topic) offTopicCount++

    // Par mode
    if (!byMode[mode]) byMode[mode] = { requests: 0, tokens: 0 }
    byMode[mode].requests++
    byMode[mode].tokens += tokens

    // Par utilisateur
    const uid = e.user_id ?? 'anonymous'
    if (!byUser[uid]) byUser[uid] = { requests: 0, tokens: 0 }
    byUser[uid].requests++
    byUser[uid].tokens += tokens
    if (e.user_id) userIds.add(e.user_id)

    // Par jour (30 derniers jours)
    if (created >= monthStart) {
      if (!dailyUsage[dayKey]) dailyUsage[dayKey] = { requests: 0, tokens: 0 }
      dailyUsage[dayKey].requests++
      dailyUsage[dayKey].tokens += tokens
    }
  }

  // Charger les usernames
  if (userIds.size > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, username')
      .in('id', Array.from(userIds))

    for (const p of profiles ?? []) {
      if (byUser[p.id]) byUser[p.id].username = p.username
    }
  }

  // Trier top users par tokens
  const topUsers = Object.entries(byUser)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 20)

  // Coût estimé (gpt-4o-mini : $0.15/1M input, $0.60/1M output → ~$0.30/1M tokens moyen)
  const estimatedCostTotal = totalTokens * 0.0000003 // $0.30 par million
  const estimatedCostMonth = monthTokens * 0.0000003

  // Préparer timeline (30 jours)
  const timeline: { date: string; requests: number; tokens: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    timeline.push({
      date: key,
      requests: dailyUsage[key]?.requests ?? 0,
      tokens: dailyUsage[key]?.tokens ?? 0,
    })
  }

  return NextResponse.json({
    overview: {
      totalTokens, todayTokens, weekTokens, monthTokens,
      totalRequests, todayRequests, weekRequests, monthRequests,
      offTopicCount,
      estimatedCostTotal: Math.round(estimatedCostTotal * 10000) / 10000,
      estimatedCostMonth: Math.round(estimatedCostMonth * 10000) / 10000,
    },
    byMode,
    topUsers,
    timeline,
  })
}
