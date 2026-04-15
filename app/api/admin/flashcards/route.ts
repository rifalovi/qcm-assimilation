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
  const pageSize = 30

  const sort = url.searchParams.get('sort') ?? 'newest'

  // Détecter les colonnes disponibles + le nom réel de la colonne niveau
  const { data: sample } = await admin.from('flashcards').select('*').limit(1)
  const availableCols = new Set(sample && sample[0] ? Object.keys(sample[0]) : [])
  const levelCol = ['level', 'niveau', 'difficulty'].find(c => availableCols.has(c)) ?? null

  let query = admin.from('flashcards').select('*', { count: 'exact' })

  // Tri
  if (sort === 'level_asc' && levelCol) {
    query = query.order(levelCol, { ascending: true })
  } else if (sort === 'level_desc' && levelCol) {
    query = query.order(levelCol, { ascending: false })
  } else if (sort === 'theme' && availableCols.has('theme')) {
    query = query.order('theme', { ascending: true })
    if (levelCol) query = query.order(levelCol, { ascending: true })
  } else if (availableCols.has('created_at')) {
    query = query.order('created_at', { ascending: false })
  }

  if (level && levelCol) query = query.eq(levelCol, parseInt(level, 10))
  if (theme && availableCols.has('theme')) query = query.eq('theme', theme)
  if (status && availableCols.has('status')) query = query.eq('status', status)

  // Recherche élargie
  if (search) {
    const safe = escapeSupabasePattern(search)
    if (safe) {
      const searchCols = ['recto', 'verso'].filter(c => availableCols.has(c))
      if (searchCols.length > 0) {
        query = query.or(searchCols.map(c => `${c}.ilike.%${safe}%`).join(','))
      }
    }
  }

  const { data, count, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) return NextResponse.json({ error: error.message, availableCols: [...availableCols], levelCol }, { status: 500 })
  return NextResponse.json({
    flashcards: data ?? [],
    total: count ?? 0,
    page, pageSize,
    availableCols: [...availableCols],
    levelCol,
  })
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()
  const body = await req.json()
  const { action } = body as { action: string }

  if (action === 'create') {
    const { recto, verso, theme, level, status } = body
    const { data, error } = await admin.from('flashcards').insert({
      recto, verso, theme, level, status: status ?? 'active', created_by: user.id,
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  }

  if (action === 'update') {
    const { id, ...fields } = body as { id: string; [k: string]: unknown }
    delete (fields as { action?: string }).action
    const { error } = await admin.from('flashcards').update(fields).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id } = body as { id: string }
    const { error } = await admin.from('flashcards').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'import_csv') {
    const { rows } = body as { rows: Record<string, string>[] }
    if (!Array.isArray(rows)) return NextResponse.json({ error: 'rows requis' }, { status: 400 })
    const toInsert = rows.map(r => ({
      recto: r.recto,
      verso: r.verso,
      theme: r.theme,
      level: parseInt(r.level, 10),
      status: r.status || 'active',
      created_by: user.id,
    }))
    const { error, count } = await admin.from('flashcards').insert(toInsert, { count: 'exact' })
    if (error) return NextResponse.json({ error: error.message, partial: count ?? 0 }, { status: 500 })
    return NextResponse.json({ success: true, inserted: count ?? toInsert.length })
  }

  if (action === 'export_csv') {
    const { data } = await admin.from('flashcards').select('*').order('theme').order('level')
    return NextResponse.json({ rows: data ?? [] })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
