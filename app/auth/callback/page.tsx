'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Vérification en cours...')

  useEffect(() => {
    async function handleCallback() {
      const timeout = setTimeout(() => router.push("/"), 8000)
      const code = searchParams.get('code')
      const type = searchParams.get('type')

      setStatus(`Code: ${code?.slice(0,10)}... Type: ${type}`)

      if (!code) {
        setStatus('Pas de code — redirection login')
        setTimeout(() => router.push('/login?error=no_code'), 2000)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        setStatus(`Erreur: ${error.message} — redirection login`)
        setTimeout(() => router.push('/login?error=confirmation_failed'), 2000)
        return
      }

      if (type === 'recovery') {
        setStatus('Recovery OK — redirection reset-password')
        setTimeout(() => router.push('/reset-password'), 500)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ role: 'freemium' }).eq('id', user.id)
      }
      setStatus('Confirmation OK — redirection accueil')
      setTimeout(() => router.push('/account'), 1500)
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 max-w-sm w-full">
        <p className="text-slate-600 dark:text-slate-400 text-sm">{status}</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Connexion en cours...</div>}>
      <CallbackHandler />
    </Suspense>
  )
}
