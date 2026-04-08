// app/api/admin/audio/coming-soon/[id]/route.ts
// PATCH  → met à jour une carte « Bientôt »
// DELETE → supprime une carte

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

const EDITABLE_FIELDS = [
  'key', 'title', 'description', 'icon',
  'color', 'icon_bg', 'count_label',
  'position', 'published',
] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const patch: Record<string, unknown> = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in body) patch[key] = body[key]
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const { data, error } = await gate.admin
    .from('audio_coming_soon')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { id } = await params
  const { error } = await gate.admin.from('audio_coming_soon').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
