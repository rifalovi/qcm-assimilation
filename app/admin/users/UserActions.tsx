'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Ban, Shield, ChevronDown } from 'lucide-react'

type User = { id: string; username: string; role: string; city: string | null; created_at: string }
type Props = { users: User[]; bannedIds: string[]; currentRole: string }

const ROLES = ['anonymous', 'freemium', 'premium', 'elite', 'moderator', 'admin', 'super_admin']
const ROLE_COLORS: Record<string, string> = {
  anonymous: 'bg-slate-700 text-slate-400',
  freemium: 'bg-blue-900/40 text-blue-400',
  premium: 'bg-amber-900/40 text-amber-400',
  elite: 'bg-yellow-900/40 text-yellow-300',
  moderator: 'bg-teal-900/40 text-teal-400',
  admin: 'bg-purple-900/40 text-purple-400',
  super_admin: 'bg-red-900/40 text-red-400',
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
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [banned, setBanned] = useState(new Set(bannedIds))
  const [roles, setRoles] = useState<Record<string, string>>(
    Object.fromEntries(users.map((u) => [u.id, u.role]))
  )
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = users.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.role === filter || (filter === 'banned' && banned.has(u.id))
    return matchSearch && matchFilter
  })

  async function changeRole(userId: string, newRole: string) {
    setLoading(userId)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (!error) setRoles((r) => ({ ...r, [userId]: newRole }))
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
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre…"
            className="w-full pl-8 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none">
          <option value="all">Tous les rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          <option value="banned">Bannis</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              {['Membre', 'Rôle', 'Ville', 'Inscription', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filtered.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-700/30 transition-colors ${banned.has(u.id) ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 flex-shrink-0">
                      {u.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white">{u.username}</p>
                      {banned.has(u.id) && <span className="text-[10px] text-red-400">Banni</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {canChangeRole ? (
                    <div className="relative">
                      <select
                        value={roles[u.id] ?? u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={loading === u.id}
                        className={`text-xs px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer ${ROLE_COLORS[roles[u.id] ?? u.role] ?? 'bg-slate-700 text-slate-400'}`}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded-lg ${ROLE_COLORS[u.role] ?? 'bg-slate-700 text-slate-400'}`}>{u.role}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{u.city ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(u.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {canBan && (
                      <button onClick={() => toggleBan(u.id, u.username)}
                        disabled={loading === u.id}
                        title={banned.has(u.id) ? 'Débannir' : 'Bannir'}
                        className={`p-1.5 rounded-lg transition-colors ${banned.has(u.id) ? 'text-teal-400 hover:bg-teal-900/30' : 'text-slate-500 hover:text-red-400 hover:bg-red-900/20'}`}>
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
          <p className="text-center text-slate-500 text-sm py-8">Aucun utilisateur trouvé</p>
        )}
      </div>
    </div>
  )
}
