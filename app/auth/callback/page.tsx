'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Connexion en cours...')

  useEffect(() => {
    async function handleCallback() {
      const timeout = setTimeout(() => router.push("/"), 8000)
      const supabase = createClient()
      const code = searchParams.get('code')
      const type = searchParams.get('type')

      // Cas OAuth Google — session via hash fragment (gérée automatiquement par Supabase)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        clearTimeout(timeout)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (!profile?.role || profile.role === 'anonymous') {
          await supabase.from('profiles').update({ role: 'freemium' }).eq('id', session.user.id)
        }
        setStatus('Connexion OK — redirection...')
        setTimeout(() => router.push('/account'), 500)
        return
      }

      // Cas email confirmation — session via code
      if (!code) {
        setStatus('Pas de code — redirection login')
        setTimeout(() => router.push('/login?error=no_code'), 2000)
        return
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        setStatus(`Erreur: ${error.message}`)
        setTimeout(() => router.push('/login?error=confirmation_failed'), 2000)
        return
      }
      if (type === 'recovery') {
        setStatus('Recovery OK')
        setTimeout(() => router.push('/reset-password'), 500)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ role: 'freemium' }).eq('id', user.id)
      }
      setStatus('Confirmation OK — redirection...')
      setTimeout(() => router.push('/account'), 1500)
    }
    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 rounded-xl border border-slate-700 bg-slate-800 max-w-sm w-full">
        <div className="text-2xl mb-3">🔄</div>
        <p className="text-slate-300 text-sm">{status}</p>
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
