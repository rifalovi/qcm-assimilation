'use client'

// components/ProfileNameForm.tsx
// Formulaire prénom/nom à intégrer dans /account
// C'est un Client Component car il gère un état local (useState) et des interactions

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  initialFirstName: string | null
  initialLastName: string | null
  initialPreference?: string | null
}

export default function ProfileNameForm({ userId, initialFirstName, initialLastName }: Props) {
  const supabase = createClient()

  const [firstName, setFirstName] = useState(initialFirstName ?? '')
  const [lastName, setLastName]   = useState(initialLastName ?? '')
  const [status, setStatus]       = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function handleSave() {
    // Validation minimale
    if (!firstName.trim() || !lastName.trim()) {
      setStatus('error')
      return
    }

    setStatus('saving')

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setStatus(error ? 'error' : 'saved')

    // Remet à "idle" après 2s
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-sm font-medium text-white mb-1">Informations personnelles</h2>
      <p className="text-xs text-slate-400 mb-4">
        Utilisées dans la communauté sous la forme <span className="font-medium text-slate-200">Prénom N.</span>
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Prénom</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Kofi"
            className="w-full border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/40"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Nom</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Mensah"
            className="w-full border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/40"
          />
        </div>
      </div>

      {/* Aperçu temps réel */}
      {(firstName || lastName) && (
        <p className="text-xs text-slate-400 mb-4">
          Apparaîtra comme :{' '}
          <span className="font-medium text-white">
            {firstName} {lastName.charAt(0).toUpperCase()}{lastName ? '.' : ''}
          </span>
        </p>
      )}

      {/* Toggle préférence d'affichage */}
      <div className="mb-4">
        <p className="text-xs text-slate-400 mb-2">Afficher dans la communauté :</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPreference('firstname')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${preference === 'firstname' ? 'border-teal-400/40 bg-teal-500/10 text-teal-300' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            Prénom N.
          </button>
          <button type="button" onClick={() => setPreference('username')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${preference === 'username' ? 'border-blue-400/40 bg-blue-500/10 text-blue-300' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            Pseudo
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Apparaîtra comme : <span className="text-slate-300 font-medium">
            {preference === 'username' ? '(votre pseudo)' : `${firstName || 'Prénom'} ${lastName ? lastName.charAt(0).toUpperCase() + '.' : ''}`}
          </span>
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={status === 'saving'}
        className="w-full py-2 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        {status === 'saving' && 'Enregistrement…'}
        {status === 'saved'  && '✓ Enregistré'}
        {status === 'error'  && 'Erreur — réessayez'}
        {status === 'idle'   && 'Enregistrer'}
      </button>
    </div>
  )
}
