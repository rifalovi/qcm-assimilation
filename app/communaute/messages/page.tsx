'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Plus, Search } from 'lucide-react'

type Conversation = {
  other_user_id: string
  other_first_name: string | null
  other_last_name: string | null
  last_message: string
  last_message_at: string
  unread_count: number
}

type Member = {
  id: string
  first_name: string | null
  last_name: string | null
  username: string
}

const AVATAR_COLORS = ['bg-teal-900/60 text-teal-300','bg-orange-900/60 text-orange-300','bg-blue-900/60 text-blue-300','bg-pink-900/60 text-pink-300','bg-purple-900/60 text-purple-300']
function avatarColor(id: string) { const s = id.charCodeAt(0)+id.charCodeAt(id.length-1); return AVATAR_COLORS[s%AVATAR_COLORS.length] }
function getInitials(fn: string|null, ln: string|null) { return ((fn?.charAt(0)??'')+(ln?.charAt(0)??'')).toUpperCase()||'M' }
function formatName(fn: string|null, ln: string|null, username?: string) { if(!fn&&!ln) return username ?? 'Membre'; return `${fn??''} ${ln?ln.charAt(0).toUpperCase()+'.':''}`.trim() }
function timeAgo(dateStr: string) {
  const diff = Date.now()-new Date(dateStr).getTime()
  const mins = Math.floor(diff/60000)
  if(mins<1) return "à l'instant"
  if(mins<60) return `${mins}min`
  const hours = Math.floor(mins/60)
  if(hours<24) return `${hours}h`
  return `${Math.floor(hours/24)}j`
}

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'premium' && profile?.role !== 'elite') { router.push('/communaute/upgrade?feature=la messagerie privée&back=/communaute/messages'); return }
      setCurrentUserId(user.id)

      // Charge toutes les conversations via les messages
      const { data: messages } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, is_read, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (!messages) { setLoading(false); return }

      // Groupe par conversation (interlocuteur unique)
      const convMap = new Map<string, typeof messages[0]>()
      for (const msg of messages) {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        if (!convMap.has(otherId)) convMap.set(otherId, msg)
      }

      // Charge les profils des interlocuteurs
      const otherIds = Array.from(convMap.keys())
      if (!otherIds.length) { setLoading(false); return }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', otherIds)

      // Compte les non-lus par conversation
      const { data: unread } = await supabase
        .from('direct_messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      const unreadMap: Record<string, number> = {}
      for (const u of unread ?? []) {
        unreadMap[u.sender_id] = (unreadMap[u.sender_id] ?? 0) + 1
      }

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
      const convList: Conversation[] = otherIds.map((otherId) => {
        const msg = convMap.get(otherId)!
        const p = profileMap.get(otherId)
        return {
          other_user_id: otherId,
          other_first_name: p?.first_name ?? null,
          other_last_name: p?.last_name ?? null,
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread_count: unreadMap[otherId] ?? 0,
        }
      }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())

      setConversations(convList)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  // Recherche de membres
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .neq('id', currentUserId)
        .in('role', ['premium', 'elite'])
        .limit(8)
      setSearchResults(data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, currentUserId, supabase])

  if (loading) return <main className="max-w-2xl mx-auto px-4 py-16 text-center"><p className="text-slate-400 text-sm">Chargement…</p></main>

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/communaute" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={15} />Communauté
        </Link>
        <button onClick={() => setShowSearch(!showSearch)}
          className="inline-flex items-center gap-1.5 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors">
          <Plus size={15} />Nouveau message
        </button>
      </div>

      <h1 className="text-2xl font-medium text-white mb-6">Messages privés</h1>

      {/* Recherche membre */}
      {showSearch && (
        <div className="mb-6 bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <p className="text-sm text-slate-300 mb-3">Rechercher un membre</p>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Prénom, nom ou pseudo…"
              className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-700 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          </div>
          {searching && <p className="text-xs text-slate-500 text-center py-2">Recherche…</p>}
          {searchResults.map((member) => (
            <button key={member.id} onClick={() => router.push(`/communaute/messages/${member.id}`)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-700 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${avatarColor(member.id)}`}>
                {getInitials(member.first_name, member.last_name)}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{formatName(member.first_name, member.last_name)}</p>
                <p className="text-xs text-slate-500">@{member.username}</p>
              </div>
            </button>
          ))}
          {!searching && searchQuery && searchResults.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-2">Aucun membre trouvé</p>
          )}
        </div>
      )}

      {/* Liste conversations */}
      {conversations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm mb-2">Aucune conversation</p>
          <p className="text-slate-600 text-xs">Contactez un membre depuis un témoignage ou le forum</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <Link key={conv.other_user_id} href={`/communaute/messages/${conv.other_user_id}`}
              className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-slate-800 transition-colors">
              <div className="relative">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium ${avatarColor(conv.other_user_id)}`}>
                  {getInitials(conv.other_first_name, conv.other_last_name)}
                </div>
                {conv.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-0.5">
                  <p className={`text-sm ${conv.unread_count > 0 ? 'font-semibold text-white' : 'font-medium text-white'}`}>
                    {formatName(conv.other_first_name, conv.other_last_name)}
                  </p>
                  <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{timeAgo(conv.last_message_at)}</span>
                </div>
                <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-slate-300' : 'text-slate-500'}`}>
                  {conv.last_message}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
