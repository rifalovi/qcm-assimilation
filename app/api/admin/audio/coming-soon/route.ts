// app/api/admin/audio/coming-soon/route.ts
// GET  → liste des cartes « Bientôt disponible »
// POST → crée une nouvelle carte

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { data, error } = await gate.admin
    .from('audio_coming_soon')
    .select('*')
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json().catch(() => ({}))
  const {
    key, title, description, icon, color, icon_bg,
    count_label, position, published,
  } = body ?? {}

  if (!key || !title) {
    return NextResponse.json(
      { error: 'Champs requis : key, title' },
      { status: 400 }
    )
  }

  const { data, error } = await gate.admin
    .from('audio_coming_soon')
    .insert({
      key,
      title,
      description: description ?? null,
      icon: icon ?? null,
      color: color ?? null,
      icon_bg: icon_bg ?? null,
      count_label: count_label ?? 'Bientôt',
      position: Number.isFinite(position) ? position : 0,
      published: published ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}
