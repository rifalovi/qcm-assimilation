'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      const supabase = createClient()

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          if (type === 'recovery') {
            router.push('/reset-password')
            return
          }
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase
              .from('profiles')
              .update({ role: 'freemium' })
              .eq('id', user.id)
          }
          router.push('/register?confirmed=true')
          return
        }
      }
      router.push('/login?error=confirmation_failed')
    }
    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Vérification en cours...
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</div>}>
      <CallbackHandler />
    </Suspense>
  )
}
