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
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-sm font-medium text-gray-900 mb-1">Informations personnelles</h2>
      <p className="text-xs text-gray-400 mb-4">
        Utilisées dans la communauté sous la forme <span className="font-medium text-gray-600">Prénom N.</span>
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Prénom</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Kofi"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Nom</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Mensah"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>
      </div>

      {/* Aperçu temps réel */}
      {(firstName || lastName) && (
        <p className="text-xs text-gray-400 mb-4">
          Apparaîtra comme :{' '}
          <span className="font-medium text-gray-700">
            {firstName} {lastName.charAt(0).toUpperCase()}{lastName ? '.' : ''}
          </span>
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={status === 'saving'}
        className="w-full py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {status === 'saving' && 'Enregistrement…'}
        {status === 'saved'  && '✓ Enregistré'}
        {status === 'error'  && 'Erreur — réessayez'}
        {status === 'idle'   && 'Enregistrer'}
      </button>
    </div>
  )
}
