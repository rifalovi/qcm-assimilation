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
        .ilike('username', `%${search}%`)
        .in('role', ['premium', 'elite', 'freemium'])
        .limit(5)
      setSearchResults(data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, supabase])

  async function promoteToModerator(user: Profile) {
    setProcessing(user.id)
    await supabase.from('profiles').update({ role: 'moderator' }).eq('id', user.id)
    setModerators((m) => [...m, { ...user, role: 'moderator' }])
    setSearchResults((r) => r.filter((u) => u.id !== user.id))
    setSearch('')
    setProcessing(null)
  }

  async function removeModerator(userId: string) {
    setProcessing(userId)
    await supabase.from('profiles').update({ role: 'premium' }).eq('id', userId)
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
        <h1 className="text-2xl font-medium text-white mb-1">Modérateurs</h1>
        <p className="text-sm text-slate-400">{moderators.length} modérateur{moderators.length > 1 ? 's' : ''} actif{moderators.length > 1 ? 's' : ''}</p>
      </div>

      {/* Ajouter un modérateur */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-medium text-white mb-3">Désigner un modérateur</h2>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre Premium…"
            className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-700 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500" />
        </div>
        {searching && <p className="text-xs text-slate-500 mt-2">Recherche…</p>}
        {searchResults.map((u) => (
          <div key={u.id} className="flex items-center gap-3 mt-2 p-3 bg-slate-700 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs text-slate-300">
              {u.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm text-white">{u.username}</p>
              <p className="text-xs text-slate-500">{u.role}</p>
            </div>
            <button onClick={() => promoteToModerator(u)} disabled={processing === u.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors">
              <UserPlus size={12} />Désigner
            </button>
          </div>
        ))}
      </div>

      {/* Liste modérateurs */}
      {loading ? (
        <p className="text-slate-400 text-sm text-center py-8">Chargement…</p>
      ) : moderators.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-2xl">
          <Shield size={24} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Aucun modérateur désigné</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Membre', 'Rôle', 'Depuis', 'Action'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {moderators.map((mod) => (
                <tr key={mod.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-900/60 flex items-center justify-center text-xs text-teal-300">
                        {mod.username.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm text-white">{mod.username}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${mod.role === 'admin' ? 'bg-purple-900/40 text-purple-400' : 'bg-teal-900/40 text-teal-400'}`}>
                      {mod.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(mod.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => removeModerator(mod.id)} disabled={processing === mod.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 border border-red-500/30 text-red-400 text-xs rounded-xl hover:bg-red-900/30 disabled:opacity-40 transition-colors">
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
