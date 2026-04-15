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
  const level = url.searchParams.get('level')
  const theme = url.searchParams.get('theme')
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  const sort = url.searchParams.get('sort') ?? 'newest'
  const pageSize = 30

  let query = admin.from('quiz_questions').select('*', { count: 'exact' })

  if (sort === 'level_asc') query = query.order('level', { ascending: true }).order('external_id', { ascending: true })
  else if (sort === 'level_desc') query = query.order('level', { ascending: false })
  else if (sort === 'theme') query = query.order('theme', { ascending: true }).order('level', { ascending: true })
  else if (sort === 'external_id') query = query.order('external_id', { ascending: true })
  else query = query.order('created_at', { ascending: false })

  if (level) query = query.eq('level', parseInt(level, 10))
  if (theme) query = query.eq('theme', theme)
  if (status) query = query.eq('status', status)
  if (search) {
    const safe = escapeSupabasePattern(search)
    if (safe) {
      query = query.or(`question.ilike.%${safe}%,choice_a.ilike.%${safe}%,choice_b.ilike.%${safe}%,choice_c.ilike.%${safe}%,choice_d.ilike.%${safe}%,explanation.ilike.%${safe}%,external_id.ilike.%${safe}%`)
    }
  }

  const { data, count, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compteurs par niveau et par thème
  const [
    { count: totalL1 },
    { count: totalL2 },
    { count: totalL3 },
    { count: totalActive },
    { count: totalDraft },
  ] = await Promise.all([
    admin.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('level', 1),
    admin.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('level', 2),
    admin.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('level', 3),
    admin.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ])

  return NextResponse.json({
    questions: data ?? [],
    total: count ?? 0,
    page, pageSize,
    stats: {
      level1: totalL1 ?? 0, level2: totalL2 ?? 0, level3: totalL3 ?? 0,
      active: totalActive ?? 0, draft: totalDraft ?? 0,
    },
  })
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()
  const body = await req.json()
  const { action } = body as { action: string }

  if (action === 'create') {
    const { external_id, level, theme, question, choice_a, choice_b, choice_c, choice_d, answer, explanation, status } = body
    const { data, error } = await admin.from('quiz_questions').insert({
      external_id: external_id || null, level, theme, question,
      choice_a, choice_b, choice_c, choice_d, answer, explanation: explanation ?? '',
      status: status ?? 'active',
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  }

  if (action === 'update') {
    const { id, ...fields } = body as { id: string; [k: string]: unknown }
    delete (fields as { action?: string }).action
    const { error } = await admin.from('quiz_questions').update(fields).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id } = body as { id: string }
    const { error } = await admin.from('quiz_questions').delete().eq('id', id)
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
      choice_a: r.choice_a, choice_b: r.choice_b, choice_c: r.choice_c, choice_d: r.choice_d,
      answer: r.answer?.toUpperCase(),
      explanation: r.explanation ?? '',
      status: r.status || 'active',
    }))
    const { error, count } = await admin.from('quiz_questions').insert(toInsert, { count: 'exact' })
    if (error) return NextResponse.json({ error: error.message, partial: count ?? 0 }, { status: 500 })
    return NextResponse.json({ success: true, inserted: count ?? toInsert.length })
  }

  if (action === 'export_csv') {
    const { data } = await admin.from('quiz_questions').select('*').order('level').order('theme').order('external_id')
    return NextResponse.json({ rows: data ?? [] })
  }

  // Migration des fichiers statiques vers la base (une seule fois)
  if (action === 'migrate_from_files') {
    // Import dynamique — charge QUESTIONS depuis les fichiers .ts
    const { QUESTIONS } = await import('../../../../src/data/questions')
    const toInsert = (QUESTIONS as Array<{
      id: string; level: 1 | 2 | 3; theme: string; question: string;
      choices: Array<{ key: string; label: string }>; answer: string; explanation: string;
    }>).map(q => {
      const getChoice = (k: string) => q.choices.find(c => c.key === k)?.label ?? ''
      return {
        external_id: q.id,
        level: q.level,
        theme: q.theme,
        question: q.question,
        choice_a: getChoice('A'),
        choice_b: getChoice('B'),
        choice_c: getChoice('C'),
        choice_d: getChoice('D'),
        answer: q.answer,
        explanation: q.explanation ?? '',
        status: 'active',
      }
    })

    // Upsert par external_id pour éviter les doublons
    const { error, count } = await admin
      .from('quiz_questions')
      .upsert(toInsert, { onConflict: 'external_id', count: 'exact' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, migrated: count ?? toInsert.length, total_in_files: toInsert.length })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
