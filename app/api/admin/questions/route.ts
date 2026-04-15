import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { escapeSupabasePattern } from '../../../../src/lib/escape'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

async function verifyAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') ?? '0', 10)
  const theme = url.searchParams.get('theme')
  const search = url.searchParams.get('search')
  const sort = url.searchParams.get('sort') ?? 'id_asc'
  const pageSize = 30

  let query = admin.from('questions').select('*', { count: 'exact' })

  if (sort === 'theme') query = query.order('theme', { ascending: true }).order('id', { ascending: true })
  else if (sort === 'id_desc') query = query.order('id', { ascending: false })
  else query = query.order('id', { ascending: true })

  if (theme) query = query.eq('theme', theme)

  if (search) {
    const safe = escapeSupabasePattern(search)
    if (safe) {
      query = query.or(`question.ilike.%${safe}%,best_answer.ilike.%${safe}%`)
    }
  }

  const { data, count, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Thèmes distincts pour le filtre
  const { data: themesData } = await admin.from('questions').select('theme').limit(1000)
  const distinctThemes = Array.from(new Set((themesData ?? []).map(r => r.theme).filter(Boolean))).sort() as string[]

  return NextResponse.json({
    questions: data ?? [],
    total: count ?? 0,
    page, pageSize,
    distinctThemes,
  })
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()
  const body = await req.json()
  const { action } = body as { action: string }

  if (action === 'create') {
    const { theme, question, best_answer, mcq_variants } = body
    const { data, error } = await admin.from('questions').insert({
      theme, question, best_answer, mcq_variants: mcq_variants ?? [],
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  }

  if (action === 'update') {
    const { id, theme, question, best_answer, mcq_variants } = body as {
      id: number; theme?: string; question?: string; best_answer?: string;
      mcq_variants?: unknown[];
    }
    const fields: Record<string, unknown> = {}
    if (theme !== undefined) fields.theme = theme
    if (question !== undefined) fields.question = question
    if (best_answer !== undefined) fields.best_answer = best_answer
    if (mcq_variants !== undefined) fields.mcq_variants = mcq_variants
    const { error } = await admin.from('questions').update(fields).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id } = body as { id: number }
    const { error } = await admin.from('questions').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'export_csv') {
    const { data } = await admin.from('questions').select('*').order('id', { ascending: true })
    return NextResponse.json({ rows: data ?? [] })
  }

  if (action === 'import_csv') {
    const { rows } = body as { rows: Record<string, string>[] }
    if (!Array.isArray(rows)) return NextResponse.json({ error: 'rows requis' }, { status: 400 })
    const toInsert = rows.map(r => ({
      theme: r.theme,
      question: r.question,
      best_answer: r.best_answer,
      mcq_variants: (() => {
        try { return JSON.parse(r.mcq_variants ?? '[]') } catch { return [] }
      })(),
    }))
    const { error, count } = await admin.from('questions').insert(toInsert, { count: 'exact' })
    if (error) return NextResponse.json({ error: error.message, partial: count ?? 0 }, { status: 500 })
    return NextResponse.json({ success: true, inserted: count ?? toInsert.length })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
