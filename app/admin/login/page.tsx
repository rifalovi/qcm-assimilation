'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError('Identifiants incorrects.'); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Erreur d'authentification."); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()

    if (!['super_admin', 'admin', 'moderator'].includes(profile?.role ?? '')) {
      await supabase.auth.signOut()
      setError('Accès non autorisé.')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">🇫🇷</span>
            <span className="text-lg font-semibold text-white">Cap Citoyen</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-red-900/20 border border-red-500/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs font-medium text-red-400 uppercase tracking-widest">Zone réservée</span>
          </div>
          <h1 className="text-xl font-medium text-white mb-1">Administration</h1>
          <p className="text-sm text-slate-500">Accès réservé aux équipes autorisées</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Adresse email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="admin@cap-citoyen.fr" autoComplete="email"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••" autoComplete="current-password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition" />
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/20 rounded-xl px-3 py-2.5">
              <p className="text-xs text-red-400">⚠ {error}</p>
            </div>
          )}
          <button onClick={handleLogin} disabled={!email.trim() || !password.trim() || loading}
            className="w-full bg-white text-slate-900 font-medium text-sm py-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition mt-2">
            {loading ? 'Vérification…' : 'Accéder au panneau'}
          </button>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-slate-600">Toutes les connexions sont enregistrées.</p>
          <a href="/" className="text-xs text-slate-600 hover:text-slate-400 transition">← Retour au site</a>
        </div>
      </div>
    </div>
  )
}
