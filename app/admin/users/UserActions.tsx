'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Ban, Shield, ChevronDown } from 'lucide-react'

type User = { id: string; username: string; role: string; city: string | null; postal_code: string | null; first_name: string | null; last_name: string | null; email: string; updated_at: string }
type Props = { users: User[]; bannedIds: string[]; currentRole: string }

const ROLES = ['anonymous', 'freemium', 'premium', 'elite', 'moderator', 'admin', 'super_admin']
const ROLE_COLORS: Record<string, string> = {
  anonymous: 'cc-badge cc-badge-sm cc-badge-neutral',
  freemium: 'cc-badge cc-badge-sm cc-badge-info',
  premium: 'cc-badge cc-badge-sm cc-badge-warning',
  elite: 'cc-badge cc-badge-sm cc-badge-warning',
  moderator: 'cc-badge cc-badge-sm cc-badge-success',
  admin: 'cc-badge cc-badge-sm cc-badge-info',
  super_admin: 'cc-badge cc-badge-sm cc-badge-danger',
}

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `${days}j`
  return `${Math.floor(days / 30)}mois`
}

export default function UserActions({ users, bannedIds, currentRole }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [banned, setBanned] = useState(new Set(bannedIds))
  const [roles, setRoles] = useState<Record<string, string>>(
    Object.fromEntries(users.map((u) => [u.id, u.role]))
  )
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      u.username?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q) ||
      u.postal_code?.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || u.role === filter || (filter === 'banned' && banned.has(u.id))
    return matchSearch && matchFilter
  })

  async function changeRole(userId: string, newRole: string) {
    setLoading(userId)
    const res = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    if (res.ok) setRoles((r) => ({ ...r, [userId]: newRole }))
    setLoading(null)
  }

  async function toggleBan(userId: string, username: string) {
    setLoading(userId)
    if (banned.has(userId)) {
      await supabase.from('bans').delete().eq('user_id', userId)
      setBanned((b) => { const n = new Set(b); n.delete(userId); return n })
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('bans').insert({ user_id: userId, banned_by: user?.id, reason: 'Banni via admin' })
      setBanned((b) => new Set([...b, userId]))
    }
    setLoading(null)
  }

  const canChangeRole = ['admin', 'super_admin'].includes(currentRole)
  const canBan = ['moderator', 'admin', 'super_admin'].includes(currentRole)

  return (
    <div>
      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cc-text-disabled)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, prénom, email, ville, code postal…"
            className="w-full pl-8 pr-4 py-2 text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 text-sm">
          <option value="all">Tous les rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          <option value="banned">Bannis</option>
        </select>
      </div>

      {/* Table */}
      <div className="adm-panel overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
        <table className="adm-table">
          <thead>
            <tr>
              {['Membre', 'Rôle', 'Ville', 'Inscription', 'Actions'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} onClick={() => router.push(`/admin/users/${u.id}`)} className={`cursor-pointer ${banned.has(u.id) ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: 'var(--cc-surface-alt)', color: 'var(--cc-text)' }}>
                      {u.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--cc-text)' }}>{u.first_name ? `${u.first_name} ${u.last_name?.charAt(0) ?? ''}.` : u.username}</p>
                      <p className="text-[10px]" style={{ color: 'var(--cc-text-disabled)' }}>@{u.username} · {u.email}</p>
                      {banned.has(u.id) && <span className="text-[10px] text-[var(--cc-danger)]">Banni</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {canChangeRole ? (
                    <div className="relative">
                      <select
                        onClick={(e) => e.stopPropagation()}
                        value={roles[u.id] ?? u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={loading === u.id}
                        className={`text-xs px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer ${ROLE_COLORS[roles[u.id] ?? u.role] ?? 'cc-badge cc-badge-sm cc-badge-neutral'}`}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  ) : (
                    <span className={`${ROLE_COLORS[u.role] ?? 'cc-badge cc-badge-sm cc-badge-neutral'}`}>{u.role}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--cc-text-muted)' }}>{u.city ?? '—'}{u.postal_code ? ` (${u.postal_code})` : ''}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--cc-text-disabled)' }}>{timeAgo(u.updated_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {canBan && (
                      <button onClick={(e) => { e.stopPropagation(); toggleBan(u.id, u.username) }}
                        disabled={loading === u.id}
                        title={banned.has(u.id) ? 'Débannir' : 'Bannir'}
                        className={`adm-action ${banned.has(u.id) ? 'adm-action-success' : 'adm-action-danger'}`}>
                        <Ban size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--cc-text-disabled)' }}>Aucun utilisateur trouvé</p>
        )}
        </div>
      </div>
    </div>
  )
}
