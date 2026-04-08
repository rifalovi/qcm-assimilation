// app/api/admin/audio/media/route.ts
// GET  → liste des médias autonomes (hymnes, vidéos, PDF…)
// POST → crée un nouveau média

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

const MEDIA_TYPES = new Set(['youtube', 'audio', 'video', 'pdf'])
const SECTIONS    = new Set(['hymnes', 'podcasts', 'autres'])

export async function GET(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const section = new URL(req.url).searchParams.get('section')
  let query = gate.admin
    .from('audio_media')
    .select('*')
    .order('section', { ascending: true })
    .order('position', { ascending: true })

  if (section) query = query.eq('section', section)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ media: data ?? [] })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json().catch(() => ({}))
  const {
    media_key, section, title, description,
    media_type, media_url, thumbnail_url, pdf_url,
    author, icon, accent, published, position,
  } = body ?? {}

  if (!media_key || !title || !media_type || !media_url) {
    return NextResponse.json(
      { error: 'Champs requis : media_key, title, media_type, media_url' },
      { status: 400 }
    )
  }
  if (!MEDIA_TYPES.has(media_type)) {
    return NextResponse.json({ error: 'media_type invalide' }, { status: 400 })
  }
  const sectionValue = section ?? 'hymnes'
  if (!SECTIONS.has(sectionValue)) {
    return NextResponse.json({ error: 'section invalide' }, { status: 400 })
  }

  const { data, error } = await gate.admin
    .from('audio_media')
    .insert({
      media_key,
      section: sectionValue,
      title,
      description: description ?? null,
      media_type,
      media_url,
      thumbnail_url: thumbnail_url ?? null,
      pdf_url: pdf_url ?? null,
      author: author ?? null,
      icon: icon ?? null,
      accent: accent ?? null,
      published: published ?? true,
      position: Number.isFinite(position) ? position : 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ media: data }, { status: 201 })
}
