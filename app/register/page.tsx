'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'otp' | 'confirmed'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>(
    searchParams.get('confirmed') ? 'confirmed' : 'form'
  )
  const [email, setEmail]       = useState(searchParams.get('email') ?? '')
  const [username, setUsername] = useState(searchParams.get('pseudo') ?? '')
  const [password, setPassword] = useState('')
  const [otp, setOtp]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    })

    if (error) {
      setError('Code incorrect ou expiré.')
      setLoading(false)
      return
    }

    // Passe le rôle en freemium
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ role: 'freemium' }).eq('id', user.id)
    }

    setStep('confirmed')
    setLoading(false)
  }

  // ===== ÉTAPE CONFIRMÉ =====
  if (step === 'confirmed') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-slate-900">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 rounded-xl px-4 py-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-bold text-lg mb-1">Compte confirmé !</p>
            <p className="text-sm mb-4">Bienvenue {username} — tu as accès à 40 questions.</p>
            <a href="/login"
              className="inline-block w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-sm transition-colors">
              Se connecter maintenant →
            </a>
          </div>
        </div>
      </main>
    )
  }

  // ===== ÉTAPE OTP =====
  if (step === 'otp') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-slate-900">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Confirme ton email
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Un code a été envoyé à <strong className="text-slate-700 dark:text-slate-300">{email}</strong>. Entre-le ci-dessous.
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Code de confirmation
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="12345678"
                maxLength={8}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 text-center text-2xl tracking-[0.4em] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors"
            >
              {loading ? 'Vérification...' : 'Confirmer mon compte'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Code non reçu ?{' '}
            <button onClick={() => { setStep('form'); setError(null); setOtp(''); }}
              className="text-blue-600 hover:underline font-medium">
              Recommencer
            </button>
          </p>
        </div>
      </main>
    )
  }

  // ===== ÉTAPE FORMULAIRE =====
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Créer un compte
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Gratuit — confirme ton email pour débloquer 40 questions
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pseudo
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="ex: carlos92"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mot de passe
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

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors"
          >
            {loading ? 'Création...' : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
