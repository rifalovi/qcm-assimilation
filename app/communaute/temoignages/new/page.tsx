'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NameGuard from '@/components/NameGuard'
import { ArrowLeft, ArrowRight, Star, X, Check } from 'lucide-react'

type TestimonyType = 'test_civique' | 'entretien_naturalisation'

interface FormData {
  type: TestimonyType | ''
  passed: boolean | null
  city: string
  date_passed: string
  welcome_rating: number
  difficulty_rating: number
  questions_asked: string[]
  free_text: string
}

function StarPicker({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div>
      <p className="text-sm text-slate-300 mb-2">{label}</p>
      <div className="flex gap-1">
        {[1,2,3,4,5].map((i) => (
          <button key={i} type="button" onClick={() => onChange(i)}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110">
            <Star size={28} className={i <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-slate-600 fill-slate-600'} />
          </button>
        ))}
      </div>
      {value > 0 && <p className="text-xs text-slate-500 mt-1">{['','Très mauvais','Mauvais','Correct','Bien','Excellent'][value]}</p>}
    </div>
  )
}

const SUGGESTIONS = ['Les valeurs de la République','La Marseillaise','La devise nationale','Le droit de vote','La laïcité','La Déclaration des droits de l\'homme','Les institutions françaises','Le Parlement','Le Président de la République','La Révolution française','Napoléon Bonaparte','La Seconde Guerre mondiale','Charles de Gaulle','L\'Union européenne','Le système scolaire','La Sécurité sociale']

function QuestionPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState('')
  function toggle(q: string) {
    if (value.includes(q)) onChange(value.filter((v) => v !== q))
    else if (value.length < 10) onChange([...value, q])
  }
  function addCustom() {
    const t = custom.trim()
    if (!t || value.includes(t) || value.length >= 10) return
    onChange([...value, t]); setCustom('')
  }
  return (
    <div>
      <p className="text-sm text-slate-300 mb-1">Questions posées lors de votre passage</p>
      <p className="text-xs text-slate-500 mb-3">Sélectionnez ou ajoutez (max 10)</p>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {value.map((q) => (
            <span key={q} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full border border-teal-100">
              {q}<button type="button" onClick={() => toggle(q)} className="hover:text-teal-900"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUGGESTIONS.filter((q) => !value.includes(q)).map((q) => (
          <button key={q} type="button" onClick={() => toggle(q)} disabled={value.length >= 10}
            className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600 hover:bg-slate-700 disabled:opacity-40 transition-colors">
            + {q}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Autre question posée…"
          className="flex-1 text-xs border border-slate-600 rounded-xl px-3 py-2 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400" />
        <button type="button" onClick={addCustom} disabled={!custom.trim() || value.length >= 10}
          className="px-3 py-2 bg-teal-600 text-white text-xs rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors">
          Ajouter
        </button>
      </div>
    </div>
  )
}

export default function NewTestimonyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState('')
  const [firstName, setFirstName] = useState<string | null>(null)
  const [lastName, setLastName] = useState<string | null>(null)
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<FormData>({ type: '', passed: null, city: '', date_passed: '', welcome_rating: 0, difficulty_rating: 0, questions_asked: [], free_text: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?redirect=/communaute/temoignages/new'); return }
      const { data: profile } = await supabase.from('profiles').select('role, first_name, last_name').eq('id', user.id).single()
      if (profile?.role !== 'premium' && profile?.role !== 'elite') { router.push('/communaute/upgrade?feature=le formulaire de témoignage&back=/communaute/temoignages'); return }
      setUserId(user.id)
      setFirstName(profile.first_name ?? null)
      setLastName(profile.last_name ?? null)
      setNameConfirmed(!!(profile.first_name && profile.last_name))
      setLoading(false)
    }
    load()
  }, [router, supabase])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function canProceed() {
    if (step === 1) return form.type !== ''
    if (step === 2) return true
    return form.free_text.trim().length >= 20
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    const { error } = await supabase.from('testimonials').insert({
      user_id: userId, type: form.type, passed: form.passed,
      city: form.city.trim() || null, date_passed: form.date_passed || null,
      welcome_rating: form.welcome_rating || null, difficulty_rating: form.difficulty_rating || null,
      questions_asked: form.questions_asked.length ? form.questions_asked : null,
      free_text: form.free_text.trim() || null, is_hidden: false, is_flagged: false, flag_count: 0,
    })
    setSubmitting(false)
    if (!error) setSubmitted(true)
  }

  if (loading) return <main className="max-w-2xl mx-auto px-4 py-16 text-center"><p className="text-slate-400 text-sm">Chargement…</p></main>

  if (submitted) return (
    <main className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-teal-900/40 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={28} className="text-teal-600" /></div>
      <h1 className="text-xl font-medium text-white mb-2">Merci pour votre témoignage !</h1>
      <p className="text-sm text-slate-400 mb-6">Votre retour d&apos;expérience aidera d&apos;autres candidats à se préparer.</p>
      <button onClick={() => router.push('/communaute/temoignages')}
        className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors">
        Voir les témoignages
      </button>
    </main>
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 text-white">
      <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/communaute/temoignages')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-gray-600 transition-colors mb-6">
        <ArrowLeft size={15} />{step > 1 ? 'Étape précédente' : 'Retour'}
      </button>

      {!nameConfirmed && (
        <NameGuard userId={userId} firstName={firstName} lastName={lastName}
          onComplete={(f, l) => { setFirstName(f); setLastName(l); setNameConfirmed(true) }} />
      )}

      {nameConfirmed && (
        <>
          <div className="flex items-center gap-2 mb-8">
            {[1,2,3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${s < step ? 'bg-teal-600 text-white' : s === step ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                  {s < step ? <Check size={13} /> : s}
                </div>
                {s < 3 && <div className={`h-0.5 w-8 ${s < step ? 'bg-teal-600' : 'bg-gray-100'}`} />}
              </div>
            ))}
            <span className="text-xs text-slate-500 ml-2">Étape {step}/3</span>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div><h1 className="text-xl font-medium text-white mb-1">Votre passage</h1><p className="text-sm text-slate-400">Informations générales sur votre expérience</p></div>
              <div>
                <p className="text-sm text-slate-300 mb-2">Type de passage <span className="text-red-400">*</span></p>
                <div className="grid grid-cols-2 gap-3">
                  {[{value:'test_civique',label:'Test civique',desc:'Test de connaissance'},{value:'entretien_naturalisation',label:'Entretien',desc:'Entretien de naturalisation'}].map(({value,label,desc}) => (
                    <button key={value} type="button" onClick={() => update('type', value as TestimonyType)}
                      className={`p-4 rounded-2xl border text-left transition-colors ${form.type === value ? 'border-teal-300 bg-teal-50' : 'border-slate-600 bg-slate-800 hover:border-slate-500'}`}>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-300 mb-2">Résultat</p>
                <div className="flex gap-2">
                  {[{value:true,label:'✓ Réussi',color:'border-emerald-200 bg-emerald-50 text-emerald-700'},{value:false,label:'✗ Non réussi',color:'border-red-200 bg-red-50 text-red-600'}].map(({value,label,color}) => (
                    <button key={String(value)} type="button" onClick={() => update('passed', form.passed === value ? null : value)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.passed === value ? color : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Ville du passage</label>
                <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Ex: Paris, Lyon, Marseille…"
                  className="w-full border border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-slate-800 text-white placeholder:text-slate-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Date du passage</label>
                <input type="date" value={form.date_passed} onChange={(e) => update('date_passed', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-slate-800 text-white placeholder:text-slate-500" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div><h1 className="text-xl font-medium text-white mb-1">Notes & questions</h1><p className="text-sm text-slate-400">Ces informations sont optionnelles mais très utiles</p></div>
              <StarPicker value={form.welcome_rating} onChange={(v) => update('welcome_rating', v)} label="Qualité de l'accueil" />
              <StarPicker value={form.difficulty_rating} onChange={(v) => update('difficulty_rating', v)} label="Niveau de difficulté des questions" />
              <QuestionPicker value={form.questions_asked} onChange={(v) => update('questions_asked', v)} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div><h1 className="text-xl font-medium text-white mb-1">Votre témoignage</h1><p className="text-sm text-slate-400">Racontez votre expérience — déroulement, ambiance, conseils…</p></div>
              <div>
                <textarea value={form.free_text} onChange={(e) => update('free_text', e.target.value)}
                  placeholder="Ex: L'accueil était professionnel, on m'a demandé de réciter la devise de la République…"
                  rows={7} maxLength={2000}
                  className="w-full border border-slate-600 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-slate-800 text-white placeholder:text-slate-500 resize-none leading-relaxed" />
                <div className="flex justify-between mt-1">
                  <p className={`text-xs ${form.free_text.length < 20 ? 'text-red-400' : 'text-gray-400'}`}>
                    {form.free_text.length < 20 ? `Minimum 20 caractères (${20 - form.free_text.length} restants)` : ''}
                  </p>
                  <p className="text-xs text-slate-600">{form.free_text.length}/2000</p>
                </div>
              </div>
              <div className="bg-slate-800 rounded-2xl p-4 space-y-1.5 border border-slate-700">
                <p className="text-xs font-medium text-slate-400 mb-2">Récapitulatif</p>
                <p className="text-xs text-slate-300"><span className="text-gray-400">Type : </span>{form.type === 'test_civique' ? 'Test civique' : 'Entretien de naturalisation'}</p>
                {form.city && <p className="text-xs text-slate-300"><span className="text-gray-400">Ville : </span>{form.city}</p>}
                {form.passed !== null && <p className="text-xs text-slate-300"><span className="text-gray-400">Résultat : </span>{form.passed ? '✓ Réussi' : '✗ Non réussi'}</p>}
                {form.questions_asked.length > 0 && <p className="text-xs text-slate-300"><span className="text-gray-400">Questions : </span>{form.questions_asked.length} sélectionnée{form.questions_asked.length > 1 ? 's' : ''}</p>}
              </div>
            </div>
          )}

          <div className="mt-8">
            {step < 3 ? (
              <button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}
                className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 text-sm font-medium py-3 rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors">
                Continuer <ArrowRight size={15} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={!canProceed() || submitting}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors">
                {submitting ? 'Publication…' : 'Publier mon témoignage'}{!submitting && <Check size={15} />}
              </button>
            )}
          </div>
        </>
      )}
    </main>
  )
}
