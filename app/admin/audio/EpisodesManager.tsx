'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Plus, Save, Trash2, X, Upload } from 'lucide-react'

type Series = { id: string; subtheme_key: string; subtheme_label: string }

export type AudioEpisode = {
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
  script: string | null
  prompt: string | null
  published: boolean
  position: number
}

const EMPTY: Omit<AudioEpisode, 'id'> = {
  series_id: null,
  episode_slug: '',
  episode_number: 1,
  episode_title: '',
  duration_target_seconds: 90,
  premium: true,
  is_free: false,
  audio_male_url: '',
  audio_female_url: '',
  script: '',
  prompt: '',
  published: true,
  position: 0,
}

export default function EpisodesManager() {
  const [series, setSeries] = useState<Series[]>([])
  const [filter, setFilter] = useState<string>('')
  const [items, setItems] = useState<AudioEpisode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AudioEpisode | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadSeries() {
    const res = await fetch('/api/admin/audio/series', { cache: 'no-store' })
    const json = await res.json()
    if (res.ok) setSeries(json.series ?? [])
  }

  async function loadEpisodes() {
    setLoading(true)
    setError(null)
    try {
      const url = filter ? `/api/admin/audio/episodes?series_id=${filter}` : '/api/admin/audio/episodes'
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setItems(json.episodes ?? [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSeries() }, [])
  useEffect(() => { loadEpisodes() }, [filter])

  const seriesMap = useMemo(() => new Map(series.map((s) => [s.id, s])), [series])

  async function save(payload: Omit<AudioEpisode, 'id'> & { id?: string }) {
    setSaving(true)
    try {
      const { id, ...rest } = payload
      const res = await fetch(
        id ? `/api/admin/audio/episodes/${id}` : '/api/admin/audio/episodes',
        {
          method: id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rest),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      await loadEpisodes()
      setEditing(null)
      setCreating(false)
    } catch (e) {
      alert(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cet épisode ?')) return
    const res = await fetch(`/api/admin/audio/episodes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Erreur')
      return
    }
    await loadEpisodes()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Toutes les séries</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>{s.subtheme_label}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setCreating(true)
            setEditing({ id: '', ...EMPTY, series_id: filter || null })
          }}
          className="cc-btn cc-btn-primary cc-btn-sm"
        >
          <Plus size={14} /> Nouvel épisode
        </button>
      </div>

      {editing && (
        <EpisodeForm
          value={editing}
          series={series}
          creating={creating}
          saving={saving}
          onCancel={() => { setEditing(null); setCreating(false) }}
          onSave={save}
        />
      )}

      {loading && <p className="text-sm" style={{ color: 'var(--cc-text-muted)' }}>Chargement…</p>}
      {error && <p className="text-sm text-red-400">Erreur : {error}</p>}

      <div className="space-y-2">
        {items.map((ep) => (
          <div key={ep.id} className="adm-panel p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs flex-shrink-0" style={{ background: 'var(--cc-surface-alt)', color: 'var(--cc-text-muted)' }}>
              #{ep.episode_number}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--cc-text)' }}>{ep.episode_title}</p>
              <p className="text-xs truncate" style={{ color: 'var(--cc-text-disabled)' }}>
                {ep.series_id ? seriesMap.get(ep.series_id)?.subtheme_label ?? '—' : '—'}
                {' · '}
                <code style={{ color: 'var(--cc-text-muted)' }}>{ep.episode_slug}</code>
                {ep.is_free && <span className="ml-2 text-emerald-400">gratuit</span>}
                {!ep.published && <span className="ml-2 text-rose-400">masqué</span>}
                {!ep.audio_male_url && !ep.audio_female_url && <span className="ml-2 text-amber-400">pas de fichier</span>}
              </p>
            </div>
            <button
              onClick={() => { setEditing(ep); setCreating(false) }}
              className="adm-action"
            >
              Éditer
            </button>
            <button
              onClick={() => remove(ep.id)}
              className="adm-action adm-action-danger"
              aria-label="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: 'var(--cc-text-disabled)' }}>Aucun épisode.</p>
        )}
      </div>
    </div>
  )
}

function EpisodeForm({
  value, series, creating, saving, onCancel, onSave,
}: {
  value: AudioEpisode
  series: Series[]
  creating: boolean
  saving: boolean
  onCancel: () => void
  onSave: (v: Omit<AudioEpisode, 'id'> & { id?: string }) => void
}) {
  const [form, setForm] = useState<AudioEpisode>(value)
  const [uploadingKey, setUploadingKey] = useState<'male' | 'female' | null>(null)

  function patch<K extends keyof AudioEpisode>(k: K, v: AudioEpisode[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function uploadAudio(kind: 'male' | 'female', file: File) {
    setUploadingKey(kind)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'audio')
      fd.append('folder', 'episodes')
      fd.append('name', `${form.episode_slug || 'episode'}-${kind}`)
      const res = await fetch('/api/admin/audio/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload échoué')
      // On stocke le chemin de bucket, lu ensuite par la route /api/audio/[slug]
      const pathValue = json.path
      if (kind === 'male') patch('audio_male_url', pathValue)
      else patch('audio_female_url', pathValue)
    } catch (e) {
      alert(String(e))
    } finally {
      setUploadingKey(null)
    }
  }

  return (
    <div className="adm-panel p-5" style={{ borderColor: 'var(--cc-primary)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--cc-text)' }}>
          {creating ? 'Nouvel épisode' : `Édition : ${value.episode_title}`}
        </h3>
        <button onClick={onCancel} style={{ color: 'var(--cc-text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Série" required>
          <select
            value={form.series_id ?? ''}
            onChange={(e) => patch('series_id', e.target.value || null)}
            className={inputCls}
          >
            <option value="">— Choisir —</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>{s.subtheme_label}</option>
            ))}
          </select>
        </Field>
        <Field label="N° épisode" required>
          <input type="number" value={form.episode_number} onChange={(e) => patch('episode_number', Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Titre" required full>
          <input value={form.episode_title} onChange={(e) => patch('episode_title', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Slug (episode_slug)" required full>
          <input value={form.episode_slug} onChange={(e) => patch('episode_slug', e.target.value)} className={inputCls} placeholder="la-devise-liberte-egalite-fraternite" />
        </Field>
        <Field label="Durée cible (s)">
          <input type="number" value={form.duration_target_seconds} onChange={(e) => patch('duration_target_seconds', Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Position">
          <input type="number" value={form.position} onChange={(e) => patch('position', Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Audio — voix homme" full>
          <div className="flex gap-2">
            <input value={form.audio_male_url ?? ''} onChange={(e) => patch('audio_male_url', e.target.value)} className={inputCls + ' flex-1'} placeholder="episodes/slug-male.mp3" />
            <label className="adm-action cursor-pointer">
              {uploadingKey === 'male' ? '…' : <Upload size={12} />} Upload
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAudio('male', f) }} />
            </label>
          </div>
          {!creating && form.episode_slug && (
            <EpisodePreview slug={form.episode_slug} voice="male" />
          )}
        </Field>
        <Field label="Audio — voix femme" full>
          <div className="flex gap-2">
            <input value={form.audio_female_url ?? ''} onChange={(e) => patch('audio_female_url', e.target.value)} className={inputCls + ' flex-1'} placeholder="episodes/slug-female.mp3" />
            <label className="adm-action cursor-pointer">
              {uploadingKey === 'female' ? '…' : <Upload size={12} />} Upload
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAudio('female', f) }} />
            </label>
          </div>
          {!creating && form.episode_slug && (
            <EpisodePreview slug={form.episode_slug} voice="female" />
          )}
        </Field>
        <Field label="Script" full>
          <textarea value={form.script ?? ''} onChange={(e) => patch('script', e.target.value)} rows={5} className={inputCls + ' resize-y font-mono text-xs'} />
        </Field>
        <Field label="Prompt de génération" full>
          <textarea value={form.prompt ?? ''} onChange={(e) => patch('prompt', e.target.value)} rows={3} className={inputCls + ' resize-y text-xs'} />
        </Field>

        <div className="flex items-center gap-4 sm:col-span-2 mt-1">
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--cc-text)' }}>
            <input type="checkbox" checked={form.premium} onChange={(e) => patch('premium', e.target.checked)} />
            Premium
          </label>
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--cc-text)' }}>
            <input type="checkbox" checked={form.is_free} onChange={(e) => patch('is_free', e.target.checked)} />
            Gratuit (freemium)
          </label>
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--cc-text)' }}>
            <input type="checkbox" checked={form.published} onChange={(e) => patch('published', e.target.checked)} />
            Publié
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onCancel} className="cc-btn cc-btn-secondary cc-btn-sm">Annuler</button>
        <button
          disabled={saving}
          onClick={() => onSave(creating ? { ...form, id: undefined } : form)}
          className="cc-btn cc-btn-primary cc-btn-sm"
        >
          <Save size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl px-3 py-2 text-sm focus:outline-none'

function Field({ label, children, required, full }: { label: string; children: ReactNode; required?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cc-text-muted)' }}>
        {label}{required && <span className="text-rose-400"> *</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Aperçu audio d'un épisode ──────────────────────────────────────────────
// Utilise /api/audio/[slug] qui autorise les rôles admin/moderator et renvoie
// une URL Supabase Storage signée (valable 60 s, suffisant pour lancer la
// lecture — ensuite la donnée est en cache navigateur).
function EpisodePreview({ slug, voice }: { slug: string; voice: 'male' | 'female' }) {
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/audio/${encodeURIComponent(slug)}?voice=${voice}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setSrc(json.url)
    } catch (e) {
      setSrc(null)
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setSrc(null); setError(null) }, [slug, voice])

  return (
    <div className="mt-2 flex items-center gap-2">
      {src ? (
        <audio controls src={src} className="h-8 flex-1" preload="none">
          Votre navigateur ne supporte pas la lecture audio.
        </audio>
      ) : (
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="adm-action"
        >
          {loading ? 'Chargement…' : '▶ Écouter'}
        </button>
      )}
      {src && (
        <button
          type="button"
          onClick={load}
          className="adm-action"
          title="Rafraîchir l'URL signée"
        >
          ↻
        </button>
      )}
      {error && <span className="text-[10px] text-rose-400 truncate max-w-[50%]" title={error}>⚠ {error}</span>}
    </div>
  )
}
