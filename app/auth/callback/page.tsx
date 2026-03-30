'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<string[]>(['Démarrage...'])

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient()
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      const error = searchParams.get('error')

      addLog(`code=${code?.slice(0,10) ?? 'null'} type=${type} error=${error}`)

      if (error) {
        addLog(`Erreur OAuth: ${error}`)
        setTimeout(() => router.push('/login?error=' + error), 3000)
        return
      }

      if (code) {
        addLog('Échange du code...')
        const { data, error: exchError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchError) {
          addLog(`Erreur échange: ${exchError.message}`)
          setTimeout(() => router.push('/login?error=exchange_failed'), 3000)
          return
        }
        addLog(`Session OK — user: ${data.session?.user?.email}`)
        if (type === 'recovery') {
          router.push('/reset-password')
          return
        }
        if (data.session?.user) {
          await supabase.from('profiles').update({ role: 'freemium' }).eq('id', data.session.user.id)
        }
        addLog('Redirection vers /account...')
        router.push('/account')
        return
      }

      addLog('Pas de code — vérification session...')
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        addLog(`Session existante: ${session.user.email}`)
        router.push('/account')
        return
      }

      addLog('Aucune session — redirection login dans 3s')
      setTimeout(() => router.push('/login'), 3000)
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center p-8 rounded-xl border border-slate-700 bg-slate-800 max-w-sm w-full">
        <div className="text-2xl mb-3 animate-spin">⚙️</div>
        <p className="text-white font-bold mb-4">Authentification</p>
        <div className="text-left space-y-1">
          {logs.map((log, i) => (
            <p key={i} className="text-xs text-slate-400 font-mono">{log}</p>
          ))}
        </div>
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
