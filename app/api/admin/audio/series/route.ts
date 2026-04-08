// app/api/admin/audio/series/route.ts
// GET  → liste complète des albums (publiés + brouillons)
// POST → crée un nouvel album

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { data, error } = await gate.admin
    .from('audio_series')
    .select('*')
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ series: data ?? [] })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json().catch(() => ({}))
  const {
    subtheme_key, subtheme_label, theme_key, theme_label,
    description, image_url, icon,
    accent_gradient, accent_border, accent_text,
    featured, position, published,
  } = body ?? {}

  if (!subtheme_key || !subtheme_label || !theme_key || !theme_label) {
    return NextResponse.json(
      { error: 'Champs requis : subtheme_key, subtheme_label, theme_key, theme_label' },
      { status: 400 }
    )
  }

  const { data, error } = await gate.admin
    .from('audio_series')
    .insert({
      subtheme_key, subtheme_label, theme_key, theme_label,
      description: description ?? null,
      image_url: image_url ?? null,
      icon: icon ?? null,
      accent_gradient: accent_gradient ?? null,
      accent_border: accent_border ?? null,
      accent_text: accent_text ?? null,
      featured: !!featured,
      position: Number.isFinite(position) ? position : 0,
      published: published ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ series: data }, { status: 201 })
}
