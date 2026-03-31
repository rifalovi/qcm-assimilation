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

function getInitials(
  firstName: string | null,
  lastName: string | null,
  username: string
) {
  if (firstName?.trim()) {
    return `${firstName.charAt(0)}${lastName?.charAt(0) ?? ''}`.toUpperCase()
  }
  return username.charAt(0).toUpperCase()
}

function formatName(
  firstName: string | null,
  lastName: string | null,
  username: string
) {
  if (firstName?.trim()) {
    return `${firstName} ${
      lastName ? `${lastName.charAt(0).toUpperCase()}.` : ''
    }`.trim()
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

// ─────────────────────────────────────────────
// HAUTEURS FIXES (à synchroniser avec votre design)
// ─────────────────────────────────────────────
const HEADER_HEIGHT = 64   // px — hauteur du header fixe
const FOOTER_HEIGHT = 68   // px — hauteur minimale du footer (sans clavier)

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const otherUserId = params.userId as string
  const supabase = useMemo(() => createClient(), [])

  // CONCEPT : `null` = pas encore chargé, '' = chargé mais vide
  // On ne rend les messages QUE quand currentUserId est connu,
  // sinon isMe sera toujours false → toutes les bulles à gauche.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Décalage du footer depuis le bas de l'écran (remonte quand le clavier s'ouvre)
  const [footerBottom, setFooterBottom] = useState(0)
  // Hauteur actuelle du footer (pour le padding-bottom du main)
  const [footerHeight, setFooterHeight] = useState(FOOTER_HEIGHT)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  // ─────────────────────────────────────────────
  // CONCEPT : visualViewport listener
  //
  // Sur iOS Safari, quand le clavier s'ouvre :
  //   - window.innerHeight reste identique (le layout viewport ne change pas)
  //   - window.visualViewport.height rétrécit (ce que l'utilisateur voit vraiment)
  //
  // On calcule donc :
  //   footerBottom = window.innerHeight - vv.height - vv.offsetTop
  //
  // Cela pousse le footer exactement au-dessus du clavier.
  // On mesure aussi la hauteur réelle du footer pour ajuster le padding du main.
  // ─────────────────────────────────────────────
  useEffect(() => {
    const vv = window.visualViewport

    const update = () => {
      if (!vv) return

      // Décalage depuis le bas = espace occupé par le clavier
      const keyboardOffset = window.innerHeight - vv.height - vv.offsetTop
      setFooterBottom(Math.max(0, keyboardOffset))

      // Hauteur réelle du footer DOM (pour padding-bottom du main)
      const fh = footerRef.current?.offsetHeight ?? FOOTER_HEIGHT
      setFooterHeight(fh)

      // Scroll en bas quand le clavier s'ouvre
      requestAnimationFrame(() => scrollToBottom('auto'))
    }

    update()
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)

    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
    }
  }, [scrollToBottom])

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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }



    const [{ data: other }, { data: msgs }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, first_name, last_name, username')
        .eq('id', otherUserId)
        .single(),
      supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, is_read, created_at')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true }),
    ])

    setOtherUser((other as OtherUser) ?? null)
    setMessages((msgs as Message[]) ?? [])

    await markMessagesAsRead(otherUserId, user.id)
    setLoading(false)

    requestAnimationFrame(() => {
      scrollToBottom('auto')
    })
  }, [markMessagesAsRead, otherUserId, router, scrollToBottom, supabase])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  useEffect(() => {
    if (!currentUserId || !otherUserId) return

    const conversationKey = [currentUserId, otherUserId].sort().join('-')

    const channel = supabase
      .channel(`conversation-${conversationKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId}))`,
        },
        async (payload) => {
          const incoming = payload.new as Message

          setMessages((prev) => {
            const exists = prev.some((m) => m.id === incoming.id)
            if (exists) return prev
            return [...prev, incoming]
          })

          if (
            incoming.sender_id === otherUserId &&
            incoming.receiver_id === currentUserId
          ) {
            await markMessagesAsRead(otherUserId, currentUserId)
          }

          requestAnimationFrame(() => {
            scrollToBottom('smooth')
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUserId, markMessagesAsRead, scrollToBottom, supabase])

  // Scroll automatique quand les messages changent
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom('smooth')
    })
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

    requestAnimationFrame(() => {
      scrollToBottom('smooth')
    })

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content,
      })
      .select('id, sender_id, receiver_id, content, is_read, created_at')
      .single()

    if (error || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      setNewMessage(content)
      setSending(false)
      return
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === tempMessage.id ? (data as Message) : m))
    )

    setSending(false)
    try {
      inputRef.current?.focus({ preventScroll: true })
    } catch {
      inputRef.current?.focus()
    }
  }, [
    currentUserId,
    newMessage,
    otherUserId,
    scrollToBottom,
    sending,
    supabase,
  ])

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputFocus = useCallback(() => {
    // Petit délai pour laisser le clavier s'ouvrir avant de scroller
    setTimeout(() => scrollToBottom('auto'), 150)
  }, [scrollToBottom])

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-[#0b141a]" style={{ height: '100dvh' }}>
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
    // ─────────────────────────────────────────────
    // CONCEPT : conteneur racine
    //
    // On utilise `100dvh` (dynamic viewport height) au lieu de `100vh`.
    // - `100vh` = hauteur du layout viewport (ne change pas quand le clavier s'ouvre)
    // - `100dvh` = hauteur du viewport visuel réel (rétrécit avec le clavier sur iOS 16+)
    //
    // `overflow: hidden` empêche le rebond de scroll natif iOS sur le conteneur.
    // ─────────────────────────────────────────────
    <div
      className="flex flex-col bg-[#0b141a]"
      style={{
        height: '100dvh',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* ── HEADER ── fixe, hauteur HEADER_HEIGHT */}
      <header
        className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#202c33] px-3"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        <button
          onClick={() => router.push('/communaute/messages')}
          className="rounded-full p-2 text-slate-300 transition hover:bg-white/10"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>

        <div
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-bold ${
            otherUser ? avatarColor(otherUser.id) : 'bg-slate-700 text-slate-300'
          }`}
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {displayName}
          </p>
          <p className="truncate text-xs text-slate-400">
            @{otherUser?.username ?? 'utilisateur'}
          </p>
        </div>
      </header>

      {/* ── MAIN (messages) ──
          CONCEPT : flex-1 + overflow-y-auto
          - flex-1 prend tout l'espace restant entre header et footer
          - overflow-y-auto permet le scroll interne sans déborder
          - padding-bottom = footerHeight pour que le dernier message
            reste visible au-dessus du footer fixe
      */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none]"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          backgroundColor: '#0b141a',
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          // Espace en bas pour ne pas être caché sous le footer
          paddingBottom: `${footerHeight + 8}px`,
          paddingTop: '12px',
          paddingLeft: '8px',
          paddingRight: '8px',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12">
            <p className="text-sm text-slate-400">Début de la conversation</p>
            <p className="text-xs text-slate-500">
              Envoyez un message pour commencer
            </p>
          </div>
        ) : (
          // CONCEPT : w-full + overflow-hidden sur le conteneur liste
          // Sans overflow-hidden, les enfants flex peuvent dépasser la largeur
          // du parent sur Android (min-width: auto par défaut en flex).
          // w-full force le conteneur à prendre exactement la largeur du main.
          <div className="w-full overflow-hidden space-y-1">
            {/* CONCEPT : on ne rend les bulles QUE si currentUserId est chargé.
                Si currentUserId est null (auth pas encore résolue), on montre
                un skeleton neutre. Cela évite le flash où tous les messages
                apparaissent à gauche (isMe = false) puis sautent à droite. */}
            {currentUserId === null ? (
              <div className="flex justify-center py-8">
                <span className="text-xs text-slate-500">Chargement…</span>
              </div>
            ) : messages.map((msg, index) => {
              const prev = messages[index - 1]
              const next = messages[index + 1]
              const isMe = msg.sender_id === currentUserId
              const isLastInGroup = !next || next.sender_id !== msg.sender_id
              const isFirstOfDay =
                !prev || !isSameDay(msg.created_at, prev.created_at)
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
                      <span className="text-[10px] text-slate-500">
                        {formatBubbleTime(msg.created_at)}
                      </span>
                    </div>
                  )}

                  {/* CONCEPT : troncature Android
                      - Le conteneur flex row a w-full pour ne pas dépasser
                      - La bulle a max-w-[75%] pour limiter sa largeur
                      - overflow-hidden sur la bulle clip le contenu débordant
                      - break-words + word-break: break-word gère les longs mots */}
                  <div
                    className={`flex w-full px-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={[
                        'max-w-[75%] overflow-hidden break-words px-3.5 py-2 text-[14px] leading-relaxed shadow-sm',
                        isMe
                          ? 'rounded-2xl rounded-br-md bg-[#005c4b] text-white'
                          : 'rounded-2xl rounded-bl-md bg-[#202c33] text-slate-100',
                        msg.id.startsWith('temp-') ? 'opacity-70' : '',
                      ].join(' ')}
                      style={{ wordBreak: 'break-word' }}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          isMe ? 'text-emerald-100/70' : 'text-slate-400'
                        }`}
                      >
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

      {/* ── FOOTER ──
          CONCEPT : position fixed + bottom dynamique
          
          On positionne le footer avec `position: fixed` et `bottom: footerBottom`.
          footerBottom = 0 quand le clavier est fermé.
          footerBottom = hauteur du clavier quand il est ouvert.
          
          C'est le visualViewport listener (useEffect ci-dessus) qui calcule
          cette valeur en temps réel.
          
          safe-area-inset-bottom : sur iPhone sans bouton home, la barre
          de geste en bas nécessite un padding. On l'applique seulement
          quand le clavier est fermé (footerBottom === 0), sinon le clavier
          remplace cette zone.
      */}
      <footer
        ref={footerRef}
        className="left-0 right-0 z-50 border-t border-white/10 bg-[#202c33]"
        style={{
          position: 'fixed',
          bottom: footerBottom,
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
          paddingTop: '0.5rem',
          paddingBottom: footerBottom === 0
            ? 'max(0.5rem, env(safe-area-inset-bottom))'
            : '0.5rem',
        }}
      >
        <div className="flex w-full items-end gap-2">
          <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-3xl bg-[#2a3942] px-3 py-2.5">
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              enterKeyHint="send"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              maxLength={2000}
              placeholder="Message"
              className="h-6 min-w-0 flex-1 bg-transparent px-1 text-sm text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
              newMessage.trim()
                ? 'bg-[#00a884] text-white hover:brightness-110'
                : 'bg-[#2a3942] text-slate-500'
            } disabled:opacity-60`}
            aria-label="Envoyer"
          >
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  )
}
