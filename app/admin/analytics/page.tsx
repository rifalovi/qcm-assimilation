import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("role, username, updated_at, city")
    .order("updated_at", { ascending: false })

  const { data: events } = await adminClient
    .from("user_events")
    .select("event_type, properties, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  const totalUsers = profiles?.length ?? 0
  const premiumUsers = profiles?.filter(p => p.role === "premium").length ?? 0
  const freemiumUsers = profiles?.filter(p => p.role === "freemium").length ?? 0
  const eliteUsers = profiles?.filter(p => p.role === "elite").length ?? 0

  const recentSignups = (profiles ?? []).slice(0, 10).map(p => ({
    username: p.username ?? "—", role: p.role, created_at: p.updated_at, city: p.city
  }))

  const cityCount: Record<string, number> = {}
  profiles?.forEach(p => { if (p.city) cityCount[p.city] = (cityCount[p.city] ?? 0) + 1 })
  const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, count]) => ({ city, count }))

  const eventCount: Record<string, number> = {}
  events?.forEach(e => { eventCount[e.event_type] = (eventCount[e.event_type] ?? 0) + 1 })
  const topEvents = Object.entries(eventCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([event_type, count]) => ({ event_type, count }))
  const recentEvents = (events ?? []).slice(0, 20)

  return (
    <AnalyticsClient
      stats={{ totalUsers, premiumUsers, freemiumUsers, eliteUsers, recentSignups, topCities, topEvents, recentEvents }}
    />
  )
}
