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
        <h1 className="adm-title">Utilisateurs bannis</h1>
        <p className="adm-subtitle">{bans.length} ban{bans.length > 1 ? 's' : ''} actif{bans.length > 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--cc-text-muted)' }}>Chargement…</p>
      ) : bans.length === 0 ? (
        <div className="adm-empty">
          <Ban size={24} className="adm-empty-icon" />
          <p className="text-sm">Aucun utilisateur banni</p>
        </div>
      ) : (
        <div className="adm-panel overflow-hidden">
          <table className="adm-table">
            <thead>
              <tr>
                {['Membre', 'Raison', 'Expire', 'Banni', 'Action'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => {
                const profile = Array.isArray(ban.profiles) ? (ban.profiles as unknown as { username: string; role: string }[])[0] : ban.profiles
                return (
                  <tr key={ban.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--cc-danger-soft)', color: 'var(--cc-danger)' }}>
                          {profile?.username?.charAt(0).toUpperCase() ?? 'M'}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--cc-text)' }}>{profile?.username ?? 'Membre'}</p>
                      </div>
                    </td>
                    <td className="max-w-xs truncate" style={{ color: 'var(--cc-text-muted)' }}>{ban.reason ?? '—'}</td>
                    <td style={{ color: 'var(--cc-text-muted)' }}>
                      {ban.expires_at ? new Date(ban.expires_at).toLocaleDateString('fr-FR') : 'Permanent'}
                    </td>
                    <td style={{ color: 'var(--cc-text-disabled)' }}>{timeAgo(ban.created_at)}</td>
                    <td>
                      <button onClick={() => handleUnban(ban.id, ban.user_id)}
                        disabled={processing === ban.id} className="adm-action adm-action-success">
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
