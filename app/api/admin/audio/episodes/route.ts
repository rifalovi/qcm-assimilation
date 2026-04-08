// app/api/admin/audio/episodes/route.ts
// GET  → liste des épisodes (filtrable par ?series_id=…)
// POST → crée un nouvel épisode

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const seriesId = new URL(req.url).searchParams.get('series_id')

  let query = gate.admin
    .from('audio_episodes')
    .select('*')
    .order('position', { ascending: true })
    .order('episode_number', { ascending: true })

  if (seriesId) query = query.eq('series_id', seriesId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ episodes: data ?? [] })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json().catch(() => ({}))
  const {
    series_id, episode_slug, episode_number, episode_title,
    duration_target_seconds, premium, is_free,
    audio_male_url, audio_female_url,
    script, prompt, published, position,
  } = body ?? {}

  if (!series_id || !episode_slug || !episode_title || episode_number == null) {
    return NextResponse.json(
      { error: 'Champs requis : series_id, episode_slug, episode_number, episode_title' },
      { status: 400 }
    )
  }

  const { data, error } = await gate.admin
    .from('audio_episodes')
    .insert({
      series_id,
      episode_slug,
      episode_number,
      episode_title,
      duration_target_seconds: duration_target_seconds ?? 90,
      premium: premium ?? true,
      is_free: !!is_free,
      audio_male_url: audio_male_url ?? null,
      audio_female_url: audio_female_url ?? null,
      script: script ?? null,
      prompt: prompt ?? null,
      published: published ?? true,
      position: Number.isFinite(position) ? position : 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ episode: data }, { status: 201 })
}
