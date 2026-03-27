'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import { createClient } from '@/lib/supabase/client'

function ResetForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Vérification Turnstile
    const verif = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: turnstileToken })
    })
    const { success } = await verif.json()
    if (!success) {
      setMessage({ type: 'error', text: 'Vérification de sécurité échouée. Réessaie.' })
      setTurnstileToken(null)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage({ type: 'error', text: 'Erreur : ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Mot de passe mis à jour ! Redirection...' })
      setTimeout(() => router.push('/'), 2000)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Choisis un nouveau mot de passe pour ton compte.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {message && (
            <div className={`rounded-xl px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
  onSuccess={(token) => setTurnstileToken(token)}
  onExpire={() => setTurnstileToken(null)}
  options={{ theme: "dark", language: "fr" }}
  className="mb-2"
/>
<button
  type="submit"
  disabled={loading || !turnstileToken}
  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors"
>
  {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
</button>
        </form>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</div>}>
      <ResetForm />
    </Suspense>
  )
}
