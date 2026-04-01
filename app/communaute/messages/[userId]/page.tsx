'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import MediaInput from '@/components/community/MediaInput'
import MediaDisplay from '@/components/community/MediaDisplay'

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  attachments?: string[]
  is_read: boolean
  created_at: string
}

type OtherUser = {
  id: string
  first_name: string | null
  last_name: string | null
  username: string
}

const AVATAR_COLORS = ['bg-teal-900/60 text-teal-300','bg-orange-900/60 text-orange-300','bg-blue-900/60 text-blue-300','bg-pink-900/60 text-pink-300','bg-purple-900/60 text-purple-300']
function avatarColor(id: string) { const s = id.charCodeAt(0)+id.charCodeAt(id.length-1); return AVATAR_COLORS[s%AVATAR_COLORS.length] }
function getInitials(fn: string|null, ln: string|null) { return ((fn?.charAt(0)??'')+(ln?.charAt(0)??'')).toUpperCase()||'M' }
function formatName(fn: string|null, ln: string|null, username?: string) { if(!fn&&!ln) return username ?? 'Membre'; return `${fn??''} ${ln?ln.charAt(0).toUpperCase()+'.':''}`.trim() }

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const otherUserId = params.userId as string
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState('')
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      // Charge le profil de l'interlocuteur
      const { data: other } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username')
        .eq('id', otherUserId)
        .single()
      setOtherUser(other)

      // Charge l'historique des messages
      const { data: msgs } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, is_read, created_at')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      setMessages((msgs as Message[]) ?? [])

      // Marque les messages reçus comme lus
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      setLoading(false)

      // ── Supabase Realtime ──────────────────────────────────
      // S'abonne aux nouveaux messages de cette conversation
      const channel = supabase
        .channel(`conv-${[user.id, otherUserId].sort().join('-')}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        }, async (payload) => {
          const msg = payload.new as Message
          // Filtre : seulement les messages de cet interlocuteur
          if (msg.sender_id !== otherUserId) return
          setMessages((m) => [...m, msg])
          // Marque comme lu immédiatement
          await supabase.from('direct_messages').update({ is_read: true }).eq('id', msg.id)
        })
        .subscribe()

      // Cleanup : se désabonne quand on quitte la page
      return () => { supabase.removeChannel(channel) }
    }
    load()
  }, [otherUserId, router, supabase])

  async function handleSend() {
    if (!newMessage.trim() || sending) return
    setSending(true)

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: newMessage.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    }

    // Optimistic update
    setMessages((m) => [...m, optimistic])
    setNewMessage('')

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: currentUserId, receiver_id: otherUserId, content: optimistic.content })
      .select('id, sender_id, receiver_id, content, is_read, created_at')
      .single()

    if (!error && data) {
      // Remplace le message optimiste par le vrai
      setMessages((m) => m.map((msg) => msg.id === optimistic.id ? data as Message : msg))
    } else {
      // Rollback si erreur
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id))
      setNewMessage(optimistic.content)
    }

    setSending(false)
    inputRef.current?.focus()
  }

  if (loading) return <main className="flex flex-col h-screen max-w-lg mx-auto px-4 py-16 items-center justify-center"><p className="text-slate-400 text-sm">Chargement…</p></main>

  return (
    <main className="flex flex-col max-w-lg mx-auto" style={{ height: "calc(100svh - 120px)", position: "fixed", top: "56px", left: 0, right: 0, bottom: "64px", maxWidth: "512px", margin: "0 auto" }}>

      {/* Header fixe */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-900 flex-shrink-0">
        <button onClick={() => router.push('/communaute/messages')}
          className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={18} />
        </button>
        {otherUser && (
          <>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium ${avatarColor(otherUser.id)}`}>
              {getInitials(otherUser.first_name, otherUser.last_name)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{formatName(otherUser.first_name, otherUser.last_name, otherUser.username)}</p>
              <p className="text-xs text-slate-500">@{otherUser.username}</p>
            </div>
          </>
        )}
      </div>

      {/* Zone messages scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">Début de la conversation</p>
            <p className="text-slate-600 text-xs mt-1">Envoyez un message pour démarrer</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          const prevMsg = messages[i - 1]
          const showTime = !prevMsg || new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000

          return (
            <div key={msg.id}>
              {showTime && (
                <p className="text-center text-[10px] text-slate-600 my-2">{formatTime(msg.created_at)}</p>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                } ${msg.id.startsWith('temp-') ? 'opacity-70' : ''}`}>
                  {msg.content}
                  {msg.attachments && msg.attachments.length > 0 && <MediaDisplay attachments={msg.attachments} content={msg.content} />}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie fixe */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-900 flex-shrink-0">
        <MediaInput
          onSubmit={async (content, attachments) => {
            if (!content.trim() && attachments.length === 0) return
            const optimistic: Message = {
              id: `temp-${Date.now()}`,
              sender_id: currentUserId,
              receiver_id: otherUserId,
              content,
              attachments,
              is_read: false,
              created_at: new Date().toISOString(),
            }
            setMessages((m) => [...m, optimistic])
            const { data, error } = await supabase
              .from('direct_messages')
              .insert({ sender_id: currentUserId, receiver_id: otherUserId, content, attachments })
              .select('id, sender_id, receiver_id, content, attachments, is_read, created_at')
              .single()
            if (!error && data) {
              setMessages((m) => m.map((msg) => msg.id === optimistic.id ? data as Message : msg))
            } else {
              setMessages((m) => m.filter((msg) => msg.id !== optimistic.id))
            }
          }}
          placeholder="Message…"
          submitLabel="Envoyer"
          rows={1}
        />
      </div>
    </main>
  )
}
