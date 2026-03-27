'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Check } from 'lucide-react'

// Pages de contenu éditables
const CONTENT_PAGES = [
  {
    key: 'hero_title',
    label: 'Titre principal (page d\'accueil)',
    type: 'text',
    defaultValue: 'Préparez votre test de naturalisation'
  },
  {
    key: 'hero_subtitle',
    label: 'Sous-titre (page d\'accueil)',
    type: 'textarea',
    defaultValue: 'Plus de 800 questions officielles pour réussir votre entretien de naturalisation française.'
  },
  {
    key: 'community_welcome',
    label: 'Message d\'accueil communauté',
    type: 'textarea',
    defaultValue: 'Échangez avec d\'autres candidats à la naturalisation'
  },
  {
    key: 'pricing_cta',
    label: 'Texte CTA Premium',
    type: 'text',
    defaultValue: 'Accès complet — tous niveaux, mode examen, statistiques détaillées'
  },
]

export default function ContentPage() {
  const supabase = createClient()
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(CONTENT_PAGES.map((p) => [p.key, p.defaultValue]))
  )
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function handleSave(key: string) {
    setSaving(key)
    // Stocke dans une table `site_content` (à créer si besoin)
    await supabase.from('site_content').upsert({ key, value: values[key] }, { onConflict: 'key' })
    setSaved((s) => ({ ...s, [key]: true }))
    setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000)
    setSaving(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Édition de contenu</h1>
        <p className="text-sm text-slate-400">Modifiez les textes de la plateforme sans toucher au code</p>
      </div>

      <div className="space-y-4">
        {CONTENT_PAGES.map(({ key, label, type }) => (
          <div key={key} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <label className="block text-sm font-medium text-white mb-2">{label}</label>
            {type === 'textarea' ? (
              <textarea value={values[key]} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none" />
            ) : (
              <input type="text" value={values[key]} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500" />
            )}
            <div className="flex justify-end mt-3">
              <button onClick={() => handleSave(key)} disabled={saving === key}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${saved[key] ? 'bg-teal-900/40 text-teal-400' : 'bg-teal-600 text-white hover:bg-teal-700'} disabled:opacity-40`}>
                {saved[key] ? <><Check size={12} />Sauvegardé</> : <><Save size={12} />Sauvegarder</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-amber-900/20 border border-amber-500/30 rounded-2xl p-4">
        <p className="text-xs text-amber-400 font-medium mb-1">Note</p>
        <p className="text-xs text-amber-300/70">
          Cette section nécessite la création d'une table <code className="bg-slate-800 px-1 rounded">site_content</code> dans Supabase.
          Exécutez : <code className="bg-slate-800 px-1 rounded">CREATE TABLE site_content (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ DEFAULT NOW());</code>
        </p>
      </div>
    </div>
  )
}
