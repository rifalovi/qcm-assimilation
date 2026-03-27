'use client'

// components/NameGuard.tsx
// Rappel affiché si first_name/last_name sont vides au moment du dépôt d'un témoignage
// Intégrer en haut du formulaire /communaute/temoignages/new

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  userId: string
  firstName: string | null
  lastName: string | null
  /** Callback appelé quand le nom est renseigné — débloque le formulaire parent */
  onComplete: (firstName: string, lastName: string) => void
}

export default function NameGuard({ userId, firstName, lastName, onComplete }: Props) {
  const supabase = createClient()

  const [first, setFirst]   = useState(firstName ?? '')
  const [last, setLast]     = useState(lastName ?? '')
  const [saving, setSaving] = useState(false)

  // Si déjà renseigné : on ne bloque pas
  if (firstName?.trim() && lastName?.trim()) return null

  async function handleConfirm() {
    if (!first.trim() || !last.trim()) return
    setSaving(true)

    await supabase
      .from('profiles')
      .update({ first_name: first.trim(), last_name: last.trim() })
      .eq('id', userId)

    setSaving(false)
    onComplete(first.trim(), last.trim())
  }

  return (
    // Bandeau doux — non bloquant visuellement mais nécessaire pour continuer
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
      <p className="text-sm font-medium text-amber-800 mb-1">
        Avant de partager votre témoignage
      </p>
      <p className="text-xs text-amber-600 mb-4">
        Votre témoignage sera signé <strong>Prénom N.</strong> — renseignez votre identité d'abord.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          type="text"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          placeholder="Prénom"
          className="border border-amber-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
        <input
          type="text"
          value={last}
          onChange={(e) => setLast(e.target.value)}
          placeholder="Nom"
          className="border border-amber-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </div>

      {(first || last) && (
        <p className="text-xs text-amber-600 mb-3">
          Apparaîtra comme :{' '}
          <span className="font-medium">{first} {last.charAt(0).toUpperCase()}{last ? '.' : ''}</span>
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleConfirm}
          disabled={!first.trim() || !last.trim() || saving}
          className="flex-1 bg-amber-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : 'Confirmer et continuer'}
        </button>
        <Link
          href="/account"
          className="text-xs text-amber-600 underline underline-offset-2"
        >
          Gérer mon profil
        </Link>
      </div>
    </div>
  )
}
