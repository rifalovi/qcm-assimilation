import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

// GET — Liste paginée avec filtres
export async function GET(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') ?? '0', 10)
  const level = url.searchParams.get('level')
  const theme = url.searchParams.get('theme')
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  const pageSize = 30

  let query = admin.from('questions').select('*', { count: 'exact' }).order('created_at', { ascending: false })
  if (level) query = query.eq('level', parseInt(level, 10))
  if (theme) query = query.eq('theme', theme)
  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('question', `%${search}%`)

  const { data, count, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: data ?? [], total: count ?? 0, page, pageSize })
}

// POST — Create, update, delete, import CSV, export CSV
export async function POST(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()
  const body = await req.json()
  const { action } = body as { action: string }

  if (action === 'create') {
    const { question, choice_a, choice_b, choice_c, choice_d, answer, explanation, level, theme, status, external_id } = body
    const { data, error } = await admin.from('questions').insert({
      question, choice_a, choice_b, choice_c, choice_d, answer, explanation,
      level, theme, status: status ?? 'active', external_id: external_id ?? null,
      created_by: user.id,
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  }

  if (action === 'update') {
    const { id, ...fields } = body as { id: string; [k: string]: unknown }
    delete (fields as { action?: string }).action
    const { error } = await admin.from('questions').update(fields).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id } = body as { id: string }
    const { error } = await admin.from('questions').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'import_csv') {
    const { rows } = body as { rows: Record<string, string>[] }
    if (!Array.isArray(rows)) return NextResponse.json({ error: 'rows requis' }, { status: 400 })
    const toInsert = rows.map(r => ({
      external_id: r.external_id || null,
      level: parseInt(r.level, 10),
      theme: r.theme,
      question: r.question,
      choice_a: r.choice_a,
      choice_b: r.choice_b,
      choice_c: r.choice_c,
      choice_d: r.choice_d,
      answer: r.answer?.toUpperCase(),
      explanation: r.explanation,
      status: r.status || 'active',
      created_by: user.id,
    }))
    const { error, count } = await admin.from('questions').insert(toInsert, { count: 'exact' })
    if (error) return NextResponse.json({ error: error.message, partial: count ?? 0 }, { status: 500 })
    return NextResponse.json({ success: true, inserted: count ?? toInsert.length })
  }

  if (action === 'export_csv') {
    const { data } = await admin.from('questions').select('*').order('level').order('theme')
    return NextResponse.json({ rows: data ?? [] })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
