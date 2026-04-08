'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Plus, Save, Trash2, X } from 'lucide-react'

export type AudioComingSoon = {
  id: string
  key: string
  title: string
  description: string | null
  icon: string | null
  color: string | null
  icon_bg: string | null
  count_label: string
  position: number
  published: boolean
}

const EMPTY: Omit<AudioComingSoon, 'id'> = {
  key: '',
  title: '',
  description: '',
  icon: '',
  color: 'from-slate-700/20 to-slate-800/10 border-slate-400/20',
  icon_bg: 'bg-slate-500/20 border-slate-400/20',
  count_label: 'Bientôt',
  position: 0,
  published: true,
}

export default function ComingSoonManager() {
  const [items, setItems] = useState<AudioComingSoon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AudioComingSoon | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/audio/coming-soon', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setItems(json.items ?? [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(payload: Omit<AudioComingSoon, 'id'> & { id?: string }) {
    setSaving(true)
    try {
      const { id, ...rest } = payload
      const res = await fetch(
        id ? `/api/admin/audio/coming-soon/${id}` : '/api/admin/audio/coming-soon',
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
    if (!confirm('Supprimer cette carte ?')) return
    const res = await fetch(`/api/admin/audio/coming-soon/${id}`, { method: 'DELETE' })
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
          <Plus size={14} /> Nouvelle carte
        </button>
      </div>

      {editing && (
        <ComingSoonForm
          value={editing}
          creating={creating}
          saving={saving}
          onCancel={() => { setEditing(null); setCreating(false) }}
          onSave={save}
        />
      )}

      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg border ${c.icon_bg ?? 'bg-slate-900 border-slate-700'} flex items-center justify-center text-lg flex-shrink-0`}>
              {c.icon ?? '✨'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{c.title}</p>
              <p className="text-xs text-slate-500 truncate">
                <code className="text-slate-400">{c.key}</code>
                <span className="ml-2 text-slate-500">· {c.count_label}</span>
                {!c.published && <span className="ml-2 text-rose-400">masqué</span>}
              </p>
            </div>
            <span className="text-xs text-slate-500">#{c.position}</span>
            <button
              onClick={() => { setEditing(c); setCreating(false) }}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white"
            >
              Éditer
            </button>
            <button
              onClick={() => remove(c.id)}
              className="p-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 text-rose-300"
              aria-label="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">Aucune carte.</p>
        )}
      </div>
    </div>
  )
}

// ─── Formulaire ─────────────────────────────────────────────────────────────
function ComingSoonForm({
  value, creating, saving, onCancel, onSave,
}: {
  value: AudioComingSoon
  creating: boolean
  saving: boolean
  onCancel: () => void
  onSave: (v: Omit<AudioComingSoon, 'id'> & { id?: string }) => void
}) {
  const [form, setForm] = useState<AudioComingSoon>(value)

  function patch<K extends keyof AudioComingSoon>(k: K, v: AudioComingSoon[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  return (
    <div className="bg-slate-800 border border-teal-500/40 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">
          {creating ? 'Nouvelle carte' : `Édition : ${value.title}`}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Aperçu live de la carte */}
      <div className="mb-5">
        <p className="text-[11px] font-medium text-slate-400 mb-2">Aperçu</p>
        <div className={`relative overflow-hidden rounded-[1.5rem] border bg-gradient-to-br ${form.color ?? ''} opacity-70 max-w-[180px]`}>
          <div className="aspect-square w-full flex items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${form.icon_bg ?? ''} text-3xl`}>
              {form.icon ?? '✨'}
            </div>
          </div>
          <div className="bg-slate-900/95 px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">{form.title || '—'}</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                {form.count_label || 'Bientôt'}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-500 line-clamp-2">
              {form.description || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Clé (key)" required>
          <input value={form.key} onChange={(e) => patch('key', e.target.value)} className={inputCls} placeholder="podcasts" />
        </Field>
        <Field label="Titre" required>
          <input value={form.title} onChange={(e) => patch('title', e.target.value)} className={inputCls} placeholder="Podcasts" />
        </Field>
        <Field label="Icône (emoji)">
          <input value={form.icon ?? ''} onChange={(e) => patch('icon', e.target.value)} className={inputCls} placeholder="🎙️" />
        </Field>
        <Field label="Label du badge">
          <input value={form.count_label} onChange={(e) => patch('count_label', e.target.value)} className={inputCls} placeholder="Bientôt" />
        </Field>
        <Field label="Description" full>
          <textarea value={form.description ?? ''} onChange={(e) => patch('description', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
        </Field>
        <Field label="Classes gradient + bordure (color)" full>
          <input value={form.color ?? ''} onChange={(e) => patch('color', e.target.value)} className={inputCls} placeholder="from-rose-600/20 to-pink-600/10 border-rose-400/20" />
        </Field>
        <Field label="Classes icône (icon_bg)" full>
          <input value={form.icon_bg ?? ''} onChange={(e) => patch('icon_bg', e.target.value)} className={inputCls} placeholder="bg-rose-500/20 border-rose-400/20" />
        </Field>
        <Field label="Position">
          <input type="number" value={form.position} onChange={(e) => patch('position', Number(e.target.value))} className={inputCls} />
        </Field>
        <div className="flex items-center gap-4 mt-1">
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
