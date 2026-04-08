/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Plus, Save, Trash2, X, Upload, Check } from 'lucide-react'

export type AudioSeries = {
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
  published: boolean
}

const EMPTY: Omit<AudioSeries, 'id'> = {
  subtheme_key: '',
  subtheme_label: '',
  theme_key: '',
  theme_label: '',
  description: '',
  image_url: '',
  icon: '',
  accent_gradient: '',
  accent_border: '',
  accent_text: '',
  featured: false,
  position: 0,
  published: true,
}

export default function SeriesManager() {
  const [items, setItems] = useState<AudioSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AudioSeries | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/audio/series', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur inconnue')
      setItems(json.series ?? [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(payload: Omit<AudioSeries, 'id'> & { id?: string }) {
    setSaving(true)
    try {
      const { id, ...rest } = payload
      const res = await fetch(
        id ? `/api/admin/audio/series/${id}` : '/api/admin/audio/series',
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
    if (!confirm('Supprimer cette série ? Tous les épisodes liés seront supprimés.')) return
    const res = await fetch(`/api/admin/audio/series/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Erreur suppression')
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
          <Plus size={14} /> Nouvelle série
        </button>
      </div>

      {editing && (
        <SeriesForm
          value={editing}
          creating={creating}
          saving={saving}
          onCancel={() => { setEditing(null); setCreating(false) }}
          onSave={save}
        />
      )}

      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center text-xl flex-shrink-0">
              {s.image_url
                ? <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                : <span>{s.icon ?? '🎧'}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{s.subtheme_label}</p>
              <p className="text-xs text-slate-500 truncate">
                {s.theme_label} · <code className="text-slate-400">{s.subtheme_key}</code>
                {s.featured && <span className="ml-2 text-amber-400">★ vedette</span>}
                {!s.published && <span className="ml-2 text-rose-400">masqué</span>}
              </p>
            </div>
            <span className="text-xs text-slate-500">#{s.position}</span>
            <button
              onClick={() => { setEditing(s); setCreating(false) }}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white"
            >
              Éditer
            </button>
            <button
              onClick={() => remove(s.id)}
              className="p-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 text-rose-300"
              aria-label="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">Aucune série pour l'instant.</p>
        )}
      </div>
    </div>
  )
}

// ─── Formulaire ─────────────────────────────────────────────────────────────
function SeriesForm({
  value, creating, saving, onCancel, onSave,
}: {
  value: AudioSeries
  creating: boolean
  saving: boolean
  onCancel: () => void
  onSave: (v: Omit<AudioSeries, 'id'> & { id?: string }) => void
}) {
  const [form, setForm] = useState<AudioSeries>(value)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  function patch<K extends keyof AudioSeries>(k: K, v: AudioSeries[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function uploadImage(file: File) {
    setUploading(true)
    setUploaded(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'public-assets')
      fd.append('folder', 'audio-covers')
      fd.append('name', form.subtheme_key || file.name)
      const res = await fetch('/api/admin/audio/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload échoué')
      patch('image_url', json.publicUrl ?? json.path)
      setUploaded(true)
      setTimeout(() => setUploaded(false), 1500)
    } catch (e) {
      alert(String(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-slate-800 border border-teal-500/40 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">
          {creating ? 'Nouvelle série' : `Édition : ${value.subtheme_label}`}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Clé (subtheme_key)" required>
          <input value={form.subtheme_key} onChange={(e) => patch('subtheme_key', e.target.value)} className={inputCls} placeholder="valeurs_republique" />
        </Field>
        <Field label="Titre affiché" required>
          <input value={form.subtheme_label} onChange={(e) => patch('subtheme_label', e.target.value)} className={inputCls} placeholder="Valeurs de la République" />
        </Field>
        <Field label="Thème (theme_key)" required>
          <input value={form.theme_key} onChange={(e) => patch('theme_key', e.target.value)} className={inputCls} placeholder="Valeurs" />
        </Field>
        <Field label="Label du thème" required>
          <input value={form.theme_label} onChange={(e) => patch('theme_label', e.target.value)} className={inputCls} placeholder="Valeurs" />
        </Field>
        <Field label="Icône (emoji)">
          <input value={form.icon ?? ''} onChange={(e) => patch('icon', e.target.value)} className={inputCls} placeholder="🇫🇷" />
        </Field>
        <Field label="Position">
          <input type="number" value={form.position} onChange={(e) => patch('position', Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Description" full>
          <textarea value={form.description ?? ''} onChange={(e) => patch('description', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
        </Field>
        <Field label="Image (URL ou upload)" full>
          <div className="flex gap-2">
            <input value={form.image_url ?? ''} onChange={(e) => patch('image_url', e.target.value)} className={inputCls + ' flex-1'} placeholder="/themes/valeurs_republique.jpg" />
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs text-white cursor-pointer">
              {uploading ? '…' : uploaded ? <Check size={12} /> : <Upload size={12} />}
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }}
              />
            </label>
          </div>
          {form.image_url && (
            <img src={form.image_url} alt="" className="mt-2 h-20 w-20 object-cover rounded-lg border border-slate-700" />
          )}
        </Field>
        <Field label="Gradient (accent_gradient)">
          <input value={form.accent_gradient ?? ''} onChange={(e) => patch('accent_gradient', e.target.value)} className={inputCls} placeholder="from-blue-600/30 to-indigo-600/20" />
        </Field>
        <Field label="Bordure (accent_border)">
          <input value={form.accent_border ?? ''} onChange={(e) => patch('accent_border', e.target.value)} className={inputCls} placeholder="border-blue-400/20" />
        </Field>
        <Field label="Texte accent (accent_text)">
          <input value={form.accent_text ?? ''} onChange={(e) => patch('accent_text', e.target.value)} className={inputCls} placeholder="text-blue-300" />
        </Field>
        <div className="flex items-center gap-4 mt-1">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={form.featured} onChange={(e) => patch('featured', e.target.checked)} />
            En vedette
          </label>
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
