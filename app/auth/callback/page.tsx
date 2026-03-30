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
    const supabase = createClient()
    const code = searchParams.get('code')
    const type = searchParams.get('type')

    // Écouter le changement d'état auth (OAuth Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        subscription.unsubscribe()
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (!profile?.role || profile.role === 'anonymous') {
          await supabase.from('profiles').update({ role: 'freemium' }).eq('id', session.user.id)
        }
        setStatus('Connexion réussie !')
        router.push('/account')
        return
      }
    })

    // Cas email confirmation via code
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ error }) => {
        if (error) {
          setStatus(`Erreur: ${error.message}`)
          setTimeout(() => router.push('/login?error=confirmation_failed'), 2000)
          return
        }
        if (type === 'recovery') {
          router.push('/reset-password')
          return
        }
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('profiles').update({ role: 'freemium' }).eq('id', user.id)
        }
        router.push('/account')
      })
    }

    // Timeout fallback
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      router.push('/')
    }, 10000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 rounded-xl border border-slate-700 bg-slate-800 max-w-sm w-full">
        <div className="text-2xl mb-3 animate-pulse">🔄</div>
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
