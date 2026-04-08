// src/lib/audioContent.ts
// Lecteur public des données audio stockées dans Supabase.
// Utilisable côté navigateur via `@/lib/supabase/client` — RLS filtre
// automatiquement les lignes non publiées.

import type { SupabaseClient } from '@supabase/supabase-js'

export type AudioSeriesRow = {
  id: string
  subtheme_key: string
  subtheme_label: string
  theme_key: string
  theme_label: string
  description: string | null
  image_url: string | null
  icon: string | null
  accent_gradient: string | null
  accent_border: string | null
  accent_text: string | null
  featured: boolean
  position: number
}

export type AudioEpisodeRow = {
  id: string
  series_id: string | null
  episode_slug: string
  episode_number: number
  episode_title: string
  duration_target_seconds: number
  premium: boolean
  is_free: boolean
  audio_male_url: string | null
  audio_female_url: string | null
  position: number
}

export type AudioMediaRow = {
  id: string
  media_key: string
  section: string
  title: string
  description: string | null
  media_type: 'youtube' | 'audio' | 'video' | 'pdf'
  media_url: string
  thumbnail_url: string | null
  pdf_url: string | null
  author: string | null
  icon: string | null
  accent: string | null
  position: number
}

export type AudioComingSoonRow = {
  id: string
  key: string
  title: string
  description: string | null
  icon: string | null
  color: string | null
  icon_bg: string | null
  count_label: string
  position: number
}

// ─── Fetch helpers ──────────────────────────────────────────────────────────

export async function fetchAudioSeries(sb: SupabaseClient): Promise<AudioSeriesRow[]> {
  const { data, error } = await sb
    .from('audio_series')
    .select('id, subtheme_key, subtheme_label, theme_key, theme_label, description, image_url, icon, accent_gradient, accent_border, accent_text, featured, position')
    .order('position', { ascending: true })
  if (error) {
    console.warn('[audioContent] fetchAudioSeries', error.message)
    return []
  }
  return (data ?? []) as AudioSeriesRow[]
}

export async function fetchAudioEpisodes(sb: SupabaseClient, seriesId?: string): Promise<AudioEpisodeRow[]> {
  let q = sb
    .from('audio_episodes')
    .select('id, series_id, episode_slug, episode_number, episode_title, duration_target_seconds, premium, is_free, audio_male_url, audio_female_url, position')
    .order('position', { ascending: true })
    .order('episode_number', { ascending: true })
  if (seriesId) q = q.eq('series_id', seriesId)
  const { data, error } = await q
  if (error) {
    console.warn('[audioContent] fetchAudioEpisodes', error.message)
    return []
  }
  return (data ?? []) as AudioEpisodeRow[]
}

export async function fetchAudioMedia(sb: SupabaseClient, section?: string): Promise<AudioMediaRow[]> {
  let q = sb
    .from('audio_media')
    .select('id, media_key, section, title, description, media_type, media_url, thumbnail_url, pdf_url, author, icon, accent, position')
    .order('section', { ascending: true })
    .order('position', { ascending: true })
  if (section) q = q.eq('section', section)
  const { data, error } = await q
  if (error) {
    console.warn('[audioContent] fetchAudioMedia', error.message)
    return []
  }
  return (data ?? []) as AudioMediaRow[]
}

export async function fetchAudioComingSoon(sb: SupabaseClient): Promise<AudioComingSoonRow[]> {
  const { data, error } = await sb
    .from('audio_coming_soon')
    .select('id, key, title, description, icon, color, icon_bg, count_label, position')
    .order('position', { ascending: true })
  if (error) {
    console.warn('[audioContent] fetchAudioComingSoon', error.message)
    return []
  }
  return (data ?? []) as AudioComingSoonRow[]
}
