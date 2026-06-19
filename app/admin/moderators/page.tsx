'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Search, UserMinus, UserPlus } from 'lucide-react'

type Profile = { id: string; username: string; role: string; created_at: string }

export default function ModeratorsPage() {
  const supabase = createClient()
  const [moderators, setModerators] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, role, created_at')
        .in('role', ['moderator', 'admin'])
        .order('created_at', { ascending: false })
      setModerators(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, username, role, created_at')
        .ilike('username', `%${search.replace(/[%_\\,()'"]/g, '').slice(0, 50)}%`)
        .in('role', ['premium', 'elite', 'freemium'])
        .limit(5)
      setSearchResults(data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, supabase])

  async function promoteToModerator(user: Profile) {
    setProcessing(user.id)
    await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role: 'moderator' }),
    })
    setModerators((m) => [...m, { ...user, role: 'moderator' }])
    setSearchResults((r) => r.filter((u) => u.id !== user.id))
    setSearch('')
    setProcessing(null)
  }

  async function removeModerator(userId: string) {
    setProcessing(userId)
    await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: 'premium' }),
    })
    setModerators((m) => m.filter((mod) => mod.id !== userId))
    setProcessing(null)
  }

  function timeAgo(d: string) {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
    if (days === 0) return "aujourd'hui"
    if (days < 30) return `${days}j`
    return `${Math.floor(days / 30)}mois`
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="adm-title">Modérateurs</h1>
        <p className="adm-subtitle">{moderators.length} modérateur{moderators.length > 1 ? 's' : ''} actif{moderators.length > 1 ? 's' : ''}</p>
      </div>

      {/* Ajouter un modérateur */}
      <div className="adm-panel p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--cc-text)' }}>Désigner un modérateur</h2>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cc-text-disabled)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre Premium…"
            className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl" />
        </div>
        {searching && <p className="text-xs mt-2" style={{ color: 'var(--cc-text-disabled)' }}>Recherche…</p>}
        {searchResults.map((u) => (
          <div key={u.id} className="flex items-center gap-3 mt-2 p-3 rounded-xl" style={{ background: 'var(--cc-surface-alt)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--cc-surface-raised)', color: 'var(--cc-text)' }}>
              {u.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm" style={{ color: 'var(--cc-text)' }}>{u.username}</p>
              <p className="text-xs" style={{ color: 'var(--cc-text-disabled)' }}>{u.role}</p>
            </div>
            <button onClick={() => promoteToModerator(u)} disabled={processing === u.id}
              className="cc-btn cc-btn-primary cc-btn-sm">
              <UserPlus size={12} />Désigner
            </button>
          </div>
        ))}
      </div>

      {/* Liste modérateurs */}
      {loading ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--cc-text-muted)' }}>Chargement…</p>
      ) : moderators.length === 0 ? (
        <div className="adm-empty">
          <Shield size={24} className="adm-empty-icon" />
          <p className="text-sm" style={{ color: 'var(--cc-text-muted)' }}>Aucun modérateur désigné</p>
        </div>
      ) : (
        <div className="adm-panel overflow-hidden">
          <table className="adm-table">
            <thead>
              <tr>
                {['Membre', 'Rôle', 'Depuis', 'Action'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {moderators.map((mod) => (
                <tr key={mod.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--cc-primary-soft)', color: 'var(--cc-primary)' }}>
                        {mod.username.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--cc-text)' }}>{mod.username}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`cc-badge cc-badge-sm ${mod.role === 'admin' ? 'cc-badge-info' : 'cc-badge-success'}`}>
                      {mod.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--cc-text-disabled)' }}>{timeAgo(mod.created_at)}</td>
                  <td>
                    <button onClick={() => removeModerator(mod.id)} disabled={processing === mod.id}
                      className="adm-action adm-action-danger">
                      <UserMinus size={12} />Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
