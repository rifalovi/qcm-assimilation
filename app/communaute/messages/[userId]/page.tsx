'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send } from 'lucide-react'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'

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
  'bg-purple-900/60 text-purple-300',
]

function avatarColor(id: string) {
  const s = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return AVATAR_COLORS[s % AVATAR_COLORS.length]
}

function getInitials(fn: string | null, ln: string | null) {
  return ((fn?.charAt(0) ?? '') + (ln?.charAt(0) ?? '')).toUpperCase() || 'M'
}

function formatName(fn: string | null, ln: string | null, username?: string) {
  if (!fn && !ln) return username ?? 'Membre'
  return `${fn ?? ''} ${ln ? ln.charAt(0).toUpperCase() + '.' : ''}`.trim()
}

function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
}

function formatDayLabel(date: string) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })
}

function formatBubbleTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function showSeparator(current: Message, previous?: Message) {
  if (!previous) return true
  return new Date(current.created_at).getTime() - new Date(previous.created_at).getTime() > 5 * 60 * 1000
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  // Trailing slash strip — next.config trailingSlash:true
  const otherUserId = (params.userId as string).replace(/\/$/, '')
  const supabase = useMemo(() => createClient(), [])

  // null = auth pas encore résolue → évite le flash bulles à gauche
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  const resizeTextarea = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`
  }, [])

  // ─── CLEF DU SUCCÈS ───────────────────────────────────────────────────────
  // useEffect avec cleanup — neutralise le layout global UNIQUEMENT sur cette
  // page, sans toucher aux fichiers globaux (layout.tsx, globals.css, etc.)
  // Le cleanup restore tout quand on quitte la page → autres pages non affectées
  // ──────────────────────────────────────────────────────────────────────────


  useEffect(() => {
    resizeTextarea()
  }, [newMessage, resizeTextarea])

  useEffect(() => {
    requestAnimationFrame(() => scrollToBottom('smooth'))
  }, [messages, scrollToBottom])

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setCurrentUserId(user.id)

        const [{ data: other, error: profileError }, { data: msgs }] = await Promise.all([
          supabase.from('profiles')
            .select('id, first_name, last_name, username')
            .eq('id', otherUserId)
            .single(),
          supabase.from('direct_messages')
            .select('id, sender_id, receiver_id, content, is_read, created_at')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true }),
        ])

        if (profileError) console.error('[Chat] profile error:', profileError.message)
        console.log('[Chat] other:', JSON.stringify(other))
        setOtherUser(other ?? null)
        setMessages((msgs as Message[]) ?? [])

        await supabase.from('direct_messages')
          .update({ is_read: true })
          .eq('sender_id', otherUserId)
          .eq('receiver_id', user.id)
          .eq('is_read', false)

        requestAnimationFrame(() => scrollToBottom('auto'))
      } catch (err) {
        console.error('[Chat] load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [otherUserId, router, scrollToBottom, supabase])

  useEffect(() => {
    if (!currentUserId || !otherUserId) return
    const key = [currentUserId, otherUserId].sort().join('-')
    const channel = supabase.channel(`conv-${key}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
        filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId}))`,
        // Écoute les deux sens de la conversation
      }, async (payload: RealtimePostgresInsertPayload<Message>) => {
        const msg = payload.new as Message
        if (msg.sender_id !== otherUserId) return
        setMessages((m) => {
          if (m.some((x) => x.id === msg.id)) return m
          return [...m, msg]
        })
        await supabase.from('direct_messages').update({ is_read: true }).eq('id', msg.id)
        requestAnimationFrame(() => scrollToBottom('smooth'))
      })
      .subscribe((status) => {
        console.log('[Realtime] status:', status)
      })
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, otherUserId, scrollToBottom, supabase])

  const handleSend = useCallback(async () => {
    const content = newMessage.trim()
    if (!content || sending || !currentUserId) return
    setSending(true)

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((m) => [...m, optimistic])
    setNewMessage('')
    requestAnimationFrame(() => { resizeTextarea(); scrollToBottom('smooth') })

    const { data, error } = await supabase.from('direct_messages')
      .insert({ sender_id: currentUserId, receiver_id: otherUserId, content })
      .select('id, sender_id, receiver_id, content, is_read, created_at')
      .single()

    if (!error && data) {
      setMessages((m) => m.map((msg) => msg.id === optimistic.id ? data as Message : msg))
    } else {
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id))
      setNewMessage(content)
    }
    setSending(false)
    inputRef.current?.focus()
  }, [currentUserId, newMessage, otherUserId, resizeTextarea, scrollToBottom, sending, supabase])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0b141a] z-50">
        <p className="text-sm text-slate-400">Chargement…</p>
      </div>
    )
  }

  const displayName = formatName(otherUser?.first_name ?? null, otherUser?.last_name ?? null, otherUser?.username)
  const initials = getInitials(otherUser?.first_name ?? null, otherUser?.last_name ?? null)

  return (
    // position: fixed; inset: 0 → occupe tout l'écran visible
    // indépendamment du layout global
    // z-40 → au-dessus du contenu mais sous les modals
    <div
      className="flex flex-col bg-[#0b141a] overflow-hidden"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
      }}
      ref={(el) => {
        if (!el) return;
        const update = () => {
          const h = window.visualViewport?.height ?? window.innerHeight;
          el.style.height = h + 'px';
        };
        update();
        window.visualViewport?.addEventListener('resize', update);
      }}
    >


      {/* ── HEADER ── */}
      <header className="flex flex-none items-center gap-3 border-b border-white/10 bg-[#202c33] px-3 py-3">
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

      {/* ── MESSAGES ── */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 [scrollbar-width:none]"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          backgroundColor: '#0b141a',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-sm text-slate-400">Début de la conversation</p>
            <p className="text-xs text-slate-500">Envoyez un message pour commencer</p>
          </div>
        ) : (
          <div className="w-full space-y-1">
            {currentUserId === null ? (
              <div className="flex justify-center py-8">
                <span className="text-xs text-slate-500">Chargement…</span>
              </div>
            ) : messages.map((msg, index) => {
              const prev = messages[index - 1]
              const next = messages[index + 1]
              const isMe = msg.sender_id === currentUserId
              const isLastInGroup = !next || next.sender_id !== msg.sender_id
              const isFirstOfDay = !prev || !isSameDay(msg.created_at, prev.created_at)
              const showSep = showSeparator(msg, prev)

              return (
                <div key={msg.id}>
                  {isFirstOfDay && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-lg bg-[#182229] px-3 py-1 text-[11px] text-slate-300 shadow-sm">
                        {formatDayLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  {showSep && !isFirstOfDay && (
                    <div className="my-2 flex justify-center">
                      <span className="text-[10px] text-slate-500">{formatBubbleTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={[
                        'max-w-[78%] break-words px-3.5 py-2 text-[14px] leading-relaxed shadow-sm',
                        isMe ? 'rounded-2xl rounded-br-md bg-[#005c4b] text-white' : 'rounded-2xl rounded-bl-md bg-[#202c33] text-slate-100',
                        msg.id.startsWith('temp-') ? 'opacity-70' : '',
                      ].join(' ')}
                      style={{ wordBreak: 'break-word' }}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-emerald-100/70' : 'text-slate-400'}`}>
                        <span>{formatBubbleTime(msg.created_at)}</span>
                        {isMe && isLastInGroup && (
                          <span>{msg.id.startsWith('temp-') ? '⏳' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer
        className="flex flex-none items-center gap-2 border-t border-white/10 bg-[#202c33] px-3 py-2 overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex flex-1 items-center rounded-3xl bg-[#2a3942] px-3 py-1.5">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); resizeTextarea() }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            rows={1}
            maxLength={2000}
            placeholder="Message"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            className="max-h-[110px] min-h-[24px] flex-1 resize-none bg-transparent px-1 text-white placeholder:text-slate-400 focus:outline-none" style={{fontSize: "16px"}}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          style={{minWidth:'2.75rem', minHeight:'2.75rem', width:'2.75rem', height:'2.75rem'}} className={`flex shrink-0 items-center justify-center rounded-full transition ${newMessage.trim() ? 'bg-[#00a884] text-white hover:brightness-110' : 'bg-[#2a3942] text-slate-500'} disabled:opacity-60`}
          aria-label="Envoyer"
        >
          <Send size={18} />
        </button>
      </footer>
    </div>
  )
}
