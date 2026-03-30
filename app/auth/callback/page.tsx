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
      const supabase = createClient()
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      const error = searchParams.get('error')

      if (error) {
        setTimeout(() => router.push('/login?error=' + error), 2000)
        return
      }

      if (code) {
        const { data, error: exchError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchError) {
          setStatus('Erreur de connexion...')
          setTimeout(() => router.push('/login?error=exchange_failed'), 2000)
          return
        }
        if (type === 'recovery') { router.push('/reset-password'); return }
        if (data.session?.user) {
          await supabase.from('profiles').update({ role: 'freemium' }).eq('id', data.session.user.id)
        }
        router.push('/account')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) { router.push('/account'); return }
      setTimeout(() => router.push('/login'), 2000)
    }
    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
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
