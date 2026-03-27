'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ban, UserCheck } from 'lucide-react'

type BanRecord = {
  id: string
  user_id: string
  reason: string | null
  expires_at: string | null
  created_at: string
  profiles: { username: string; role: string } | null
  banned_by_profile: { username: string } | null
}

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  return `il y a ${days}j`
}

export default function BansPage() {
  const supabase = createClient()
  const [bans, setBans] = useState<BanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('bans')
        .select('id, user_id, reason, expires_at, created_at, profiles!user_id ( username, role )')
        .order('created_at', { ascending: false })
      setBans((data as unknown as BanRecord[]) ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleUnban(banId: string, userId: string) {
    setProcessing(banId)
    await supabase.from('bans').delete().eq('id', banId)
    setBans((b) => b.filter((ban) => ban.id !== banId))
    setProcessing(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Utilisateurs bannis</h1>
        <p className="text-sm text-slate-400">{bans.length} ban{bans.length > 1 ? 's' : ''} actif{bans.length > 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-8">Chargement…</p>
      ) : bans.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-2xl">
          <Ban size={24} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Aucun utilisateur banni</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Membre', 'Raison', 'Expire', 'Banni', 'Action'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {bans.map((ban) => {
                const profile = Array.isArray(ban.profiles) ? (ban.profiles as unknown as { username: string; role: string }[])[0] : ban.profiles
                return (
                  <tr key={ban.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-900/40 flex items-center justify-center text-xs text-red-400">
                          {profile?.username?.charAt(0).toUpperCase() ?? 'M'}
                        </div>
                        <p className="text-sm text-white">{profile?.username ?? 'Membre'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">{ban.reason ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {ban.expires_at ? new Date(ban.expires_at).toLocaleDateString('fr-FR') : 'Permanent'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(ban.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleUnban(ban.id, ban.user_id)}
                        disabled={processing === ban.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-900/20 border border-teal-500/30 text-teal-400 text-xs rounded-xl hover:bg-teal-900/30 disabled:opacity-40 transition-colors">
                        <UserCheck size={12} />Débannir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
