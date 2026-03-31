'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

type OtherUser = {
  id: string
  first_name: string | null
  last_name: string | null
  username: string
}

const AVATAR_COLORS = [
  'bg-teal-900/60 text-teal-300',
  'bg-orange-900/60 text-orange-300',
  'bg-blue-900/60 text-blue-300',
  'bg-pink-900/60 text-pink-300',
]

function avatarColor(id: string) {
  if (!id) return AVATAR_COLORS[0]
  return AVATAR_COLORS[
    (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % AVATAR_COLORS.length
  ]
}

function getInitials(firstName: string | null, lastName: string | null, username: string) {
  if (firstName?.trim()) {
    return `${firstName.charAt(0)}${lastName?.charAt(0) ?? ''}`.toUpperCase()
  }
  return username.charAt(0).toUpperCase()
}

function formatName(firstName: string | null, lastName: string | null, username: string) {
  if (firstName?.trim()) {
    return `${firstName} ${lastName ? `${lastName.charAt(0).toUpperCase()}.` : ''}`.trim()
  }
  return username
}

function isSameDay(a: string, b: string) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

function formatDayLabel(date: string) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()

  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()

  if (isToday) return "Aujourd'hui"
  if (isYesterday) return 'Hier'

  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function formatBubbleTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shouldShowTimestampSeparator(current: Message, previous?: Message) {
  if (!previous) return true
  const diff =
    new Date(current.created_at).getTime() -
    new Date(previous.created_at).getTime()
  return diff > 5 * 60 * 1000
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const otherUserId = params.userId as string
  const supabase = useMemo(() => createClient(), [])

  const [currentUserId, setCurrentUserId] = useState('')
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  const resizeTextarea = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`
  }, [])

  const markMessagesAsRead = useCallback(
    async (senderId: string, receiverId: string) => {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .eq('is_read', false)
    },
    [supabase]
  )

  const loadConversation = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setCurrentUserId(user.id)

    const [{ data: other }, { data: msgs }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, first_name, last_name, username')
        .eq('id', otherUserId)
        .single(),
      supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, is_read, created_at')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true }),
    ])

    setOtherUser((other as OtherUser) ?? null)
    setMessages((msgs as Message[]) ?? [])
    await markMessagesAsRead(otherUserId, user.id)
    setLoading(false)
    requestAnimationFrame(() => scrollToBottom('auto'))
  }, [markMessagesAsRead, otherUserId, router, scrollToBottom, supabase])

  useEffect(() => { loadConversation() }, [loadConversation])

  useEffect(() => {
    if (!currentUserId || !otherUserId) return
    const conversationKey = [currentUserId, otherUserId].sort().join('-')
    const channel = supabase
      .channel(`conversation-${conversationKey}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId}))` },
        async (payload) => {
          const incoming = payload.new as Message
          setMessages((prev) => {
            const alreadyExists = prev.some((m) => m.id === incoming.id)
            if (alreadyExists) return prev
            return [...prev, incoming]
          })
          if (incoming.sender_id === otherUserId && incoming.receiver_id === currentUserId) {
            await markMessagesAsRead(otherUserId, currentUserId)
          }
          requestAnimationFrame(() => scrollToBottom('smooth'))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, markMessagesAsRead, otherUserId, scrollToBottom, supabase])

  useEffect(() => { resizeTextarea() }, [newMessage, resizeTextarea])

  useEffect(() => {
    requestAnimationFrame(() => scrollToBottom('smooth'))
  }, [messages, scrollToBottom])

  const handleSend = useCallback(async () => {
    const content = newMessage.trim()
    if (!content || sending || !currentUserId) return
    setSending(true)

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, tempMessage])
    setNewMessage('')
    requestAnimationFrame(() => { resizeTextarea(); scrollToBottom('smooth') })

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: currentUserId, receiver_id: otherUserId, content })
      .select('id, sender_id, receiver_id, content, is_read, created_at')
      .single()

    if (error || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      setNewMessage(content)
      setSending(false)
      return
    }

    setMessages((prev) => prev.map((m) => (m.id === tempMessage.id ? (data as Message) : m)))
    setSending(false)
    inputRef.current?.focus()
  }, [currentUserId, newMessage, otherUserId, resizeTextarea, scrollToBottom, sending, supabase])

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b141a]">
        <p className="text-sm text-slate-400">Chargement…</p>
      </div>
    )
  }

  const displayName = otherUser
    ? formatName(otherUser.first_name, otherUser.last_name, otherUser.username)
    : 'Conversation'

  const initials = otherUser
    ? getInitials(otherUser.first_name, otherUser.last_name, otherUser.username)
    : '?'

  return (
    <div className="fixed inset-0 flex h-dvh min-h-0 flex-col overflow-hidden bg-[#0b141a]">

      {/* Header */}
      <header className="relative z-30 flex flex-none items-center gap-3 border-b border-white/10 bg-[#202c33] px-3 py-3 shrink-0">
        <button
          onClick={() => router.push('/communaute/messages')}
          className="rounded-full p-2 text-slate-300 transition hover:bg-white/10"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-bold ${otherUser ? avatarColor(otherUser.id) : 'bg-slate-700 text-slate-300'}`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-slate-400">@{otherUser?.username ?? 'utilisateur'}</p>
        </div>
      </header>

      {/* Messages */}
      <main
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          backgroundColor: '#0b141a',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          paddingBottom: 'env(safe-area-inset-bottom)',
          minHeight: 0,
        } as React.CSSProperties}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12">
            <p className="text-sm text-slate-400">Début de la conversation</p>
            <p className="text-xs text-slate-500">Envoyez un message pour commencer</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, index) => {
              const prev = messages[index - 1]
              const next = messages[index + 1]
              const isMe = msg.sender_id === currentUserId
              const isLastInGroup = !next || next.sender_id !== msg.sender_id
              const isFirstOfDay = !prev || !isSameDay(msg.created_at, prev.created_at)
              const showMiniTimestamp = shouldShowTimestampSeparator(msg, prev)

              return (
                <React.Fragment key={msg.id}>
                  {isFirstOfDay && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-lg bg-[#182229] px-3 py-1 text-[11px] text-slate-300 shadow-sm">
                        {formatDayLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  {showMiniTimestamp && !isFirstOfDay && (
                    <div className="my-2 flex justify-center">
                      <span className="text-[10px] text-slate-500">{formatBubbleTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={[
                      'relative max-w-[82%] break-words px-3.5 py-2 text-[14px] leading-relaxed shadow-sm',
                      isMe ? 'rounded-2xl rounded-br-md bg-[#005c4b] text-white' : 'rounded-2xl rounded-bl-md bg-[#202c33] text-slate-100',
                      msg.id.startsWith('temp-') ? 'opacity-70' : '',
                    ].join(' ')}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-emerald-100/70' : 'text-slate-400'}`}>
                        <span>{formatBubbleTime(msg.created_at)}</span>
                        {isMe && isLastInGroup && (
                          <span>{msg.id.startsWith('temp-') ? '⏳' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Input */}
      <footer className="relative z-30 flex flex-none shrink-0 items-end gap-2 border-t border-white/10 bg-[#202c33] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-1 items-end rounded-3xl bg-[#2a3942] px-3 py-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            rows={1}
            maxLength={2000}
            placeholder="Message"
            className="max-h-[110px] min-h-[24px] flex-1 resize-none bg-transparent px-1 text-sm text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className={`flex h-11 w-11 flex-none items-center justify-center rounded-full transition ${
            newMessage.trim() ? 'bg-[#00a884] text-white hover:brightness-110' : 'bg-[#2a3942] text-slate-500'
          } disabled:opacity-60`}
          aria-label="Envoyer"
        >
          <Send size={18} />
        </button>
      </footer>
    </div>
  )
}
