'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Plus, Save, Trash2, X, Upload } from 'lucide-react'

export type AudioMedia = {
  id: string
  media_key: string
  section: 'hymnes' | 'podcasts' | 'autres'
  title: string
  description: string | null
  media_type: 'youtube' | 'audio' | 'video' | 'pdf'
  media_url: string
  thumbnail_url: string | null
  pdf_url: string | null
  author: string | null
  icon: string | null
  accent: string | null
  published: boolean
  position: number
}

const EMPTY: Omit<AudioMedia, 'id'> = {
  media_key: '',
  section: 'hymnes',
  title: '',
  description: '',
  media_type: 'youtube',
  media_url: '',
  thumbnail_url: '',
  pdf_url: '',
  author: '',
  icon: '',
  accent: '',
  published: true,
  position: 0,
}

export default function MediaManager() {
  const [items, setItems] = useState<AudioMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AudioMedia | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/audio/media', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setItems(json.media ?? [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(payload: Omit<AudioMedia, 'id'> & { id?: string }) {
    setSaving(true)
    try {
      const { id, ...rest } = payload
      const res = await fetch(
        id ? `/api/admin/audio/media/${id}` : '/api/admin/audio/media',
        {
          method: id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rest),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      await load()
      setEditing(null)
      setCreating(false)
    } catch (e) {
      alert(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce média ?')) return
    const res = await fetch(`/api/admin/audio/media/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Erreur')
      return
    }
    await load()
  }

  if (loading) return <p className="text-sm text-slate-400">Chargement…</p>
  if (error)   return <p className="text-sm text-red-400">Erreur : {error}</p>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setCreating(true); setEditing({ id: '', ...EMPTY }) }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={14} /> Nouveau média
        </button>
      </div>

      {editing && (
        <MediaForm
          value={editing}
          creating={creating}
          saving={saving}
          onCancel={() => { setEditing(null); setCreating(false) }}
          onSave={save}
        />
      )}

      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-lg flex-shrink-0">
              {m.icon ?? (m.media_type === 'youtube' ? '▶' : m.media_type === 'pdf' ? '📄' : '🎵')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{m.title}</p>
              <p className="text-xs text-slate-500 truncate">
                <span className="uppercase text-slate-400">{m.media_type}</span> · {m.section}
                {' · '}<code className="text-slate-400">{m.media_key}</code>
                {!m.published && <span className="ml-2 text-rose-400">masqué</span>}
              </p>
            </div>
            <span className="text-xs text-slate-500">#{m.position}</span>
            <button
              onClick={() => { setEditing(m); setCreating(false) }}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white"
            >
              Éditer
            </button>
            <button
              onClick={() => remove(m.id)}
              className="p-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 text-rose-300"
              aria-label="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">Aucun média.</p>
        )}
      </div>
    </div>
  )
}

function MediaForm({
  value, creating, saving, onCancel, onSave,
}: {
  value: AudioMedia
  creating: boolean
  saving: boolean
  onCancel: () => void
  onSave: (v: Omit<AudioMedia, 'id'> & { id?: string }) => void
}) {
  const [form, setForm] = useState<AudioMedia>(value)
  const [uploading, setUploading] = useState<'media' | 'thumb' | 'pdf' | null>(null)

  function patch<K extends keyof AudioMedia>(k: K, v: AudioMedia[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function uploadFile(kind: 'media' | 'thumb' | 'pdf', file: File) {
    setUploading(kind)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'public-assets')
      fd.append('folder', kind === 'pdf' ? 'audio-pdf' : kind === 'thumb' ? 'audio-thumbs' : 'audio-media')
      fd.append('name', form.media_key || file.name)
      const res = await fetch('/api/admin/audio/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload échoué')
      const url = json.publicUrl ?? json.path
      if (kind === 'media') patch('media_url', url)
      if (kind === 'thumb') patch('thumbnail_url', url)
      if (kind === 'pdf')   patch('pdf_url', url)
    } catch (e) {
      alert(String(e))
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="bg-slate-800 border border-teal-500/40 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">
          {creating ? 'Nouveau média' : `Édition : ${value.title}`}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Clé (media_key)" required>
          <input value={form.media_key} onChange={(e) => patch('media_key', e.target.value)} className={inputCls} placeholder="la-marseillaise" />
        </Field>
        <Field label="Titre" required>
          <input value={form.title} onChange={(e) => patch('title', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Section">
          <select value={form.section} onChange={(e) => patch('section', e.target.value as AudioMedia['section'])} className={inputCls}>
            <option value="hymnes">Hymnes</option>
            <option value="podcasts">Podcasts</option>
            <option value="autres">Autres</option>
          </select>
        </Field>
        <Field label="Type" required>
          <select value={form.media_type} onChange={(e) => patch('media_type', e.target.value as AudioMedia['media_type'])} className={inputCls}>
            <option value="youtube">YouTube</option>
            <option value="audio">Audio (MP3)</option>
            <option value="video">Vidéo (MP4)</option>
            <option value="pdf">PDF</option>
          </select>
        </Field>
        <Field label="Description" full>
          <textarea value={form.description ?? ''} onChange={(e) => patch('description', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
        </Field>
        <Field label="URL du média" required full>
          <div className="flex gap-2">
            <input value={form.media_url} onChange={(e) => patch('media_url', e.target.value)} className={inputCls + ' flex-1'} placeholder="https://www.youtube.com/embed/…" />
            {form.media_type !== 'youtube' && (
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs text-white cursor-pointer">
                {uploading === 'media' ? '…' : <Upload size={12} />} Upload
                <input
                  type="file"
                  className="hidden"
                  accept={form.media_type === 'audio' ? 'audio/*' : form.media_type === 'video' ? 'video/*' : 'application/pdf'}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile('media', f) }}
                />
              </label>
            )}
          </div>
        </Field>
        <Field label="Miniature (thumbnail_url)" full>
          <div className="flex gap-2">
            <input value={form.thumbnail_url ?? ''} onChange={(e) => patch('thumbnail_url', e.target.value)} className={inputCls + ' flex-1'} />
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs text-white cursor-pointer">
              {uploading === 'thumb' ? '…' : <Upload size={12} />} Upload
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile('thumb', f) }} />
            </label>
          </div>
        </Field>
        <Field label="PDF (optionnel)" full>
          <div className="flex gap-2">
            <input value={form.pdf_url ?? ''} onChange={(e) => patch('pdf_url', e.target.value)} className={inputCls + ' flex-1'} />
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs text-white cursor-pointer">
              {uploading === 'pdf' ? '…' : <Upload size={12} />} Upload
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile('pdf', f) }} />
            </label>
          </div>
        </Field>
        <Field label="Auteur">
          <input value={form.author ?? ''} onChange={(e) => patch('author', e.target.value)} className={inputCls} placeholder="@Hitoshi54140" />
        </Field>
        <Field label="Icône (emoji)">
          <input value={form.icon ?? ''} onChange={(e) => patch('icon', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Accent (Tailwind)">
          <input value={form.accent ?? ''} onChange={(e) => patch('accent', e.target.value)} className={inputCls} placeholder="text-blue-300" />
        </Field>
        <Field label="Position">
          <input type="number" value={form.position} onChange={(e) => patch('position', Number(e.target.value))} className={inputCls} />
        </Field>
        <div className="flex items-center gap-4 sm:col-span-2 mt-1">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={form.published} onChange={(e) => patch('published', e.target.checked)} />
            Publié
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600">Annuler</button>
        <button
          disabled={saving}
          onClick={() => onSave(creating ? { ...form, id: undefined } : form)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-40"
        >
          <Save size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

const inputCls =
  'w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500'

function Field({ label, children, required, full }: { label: string; children: ReactNode; required?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-[11px] font-medium text-slate-400 mb-1">
        {label}{required && <span className="text-rose-400"> *</span>}
      </label>
      {children}
    </div>
  )
}
