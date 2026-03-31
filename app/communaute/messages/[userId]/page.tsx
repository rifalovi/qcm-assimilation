'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send } from 'lucide-react'

type Message = { id: string; sender_id: string; receiver_id: string; content: string; is_read: boolean; created_at: string }
type OtherUser = { id: string; first_name: string|null; last_name: string|null; username: string }

const COLORS = ['bg-teal-900/60 text-teal-300','bg-orange-900/60 text-orange-300','bg-blue-900/60 text-blue-300','bg-pink-900/60 text-pink-300']
const avatarColor = (id: string) => COLORS[(id.charCodeAt(0)+id.charCodeAt(id.length-1))%COLORS.length]
const getInitials = (fn:string|null,ln:string|null,un:string) => fn?(fn.charAt(0)+(ln?.charAt(0)??'')).toUpperCase():un.charAt(0).toUpperCase()
const formatName = (fn:string|null,ln:string|null,un:string) => fn?.trim()?`${fn} ${ln?ln.charAt(0).toUpperCase()+'.':''}`.trim():un
const formatTime = (d:string) => { const dt=new Date(d),now=new Date(); return dt.toDateString()===now.toDateString()?dt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):dt.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})+' '+dt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) }

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const otherUserId = params.userId as string
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = useState('')
  const [otherUser, setOtherUser] = useState<OtherUser|null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fix iOS clavier — ajuste la hauteur via visualViewport
  useEffect(() => {
    const update = () => {
      const h = window.visualViewport?.height ?? window.innerHeight
      if (containerRef.current) {
        containerRef.current.style.height = h + 'px'
      }
      // Scroll vers le bas quand le clavier apparaît
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    update()
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)
      const { data: other } = await supabase.from('profiles').select('id, first_name, last_name, username').eq('id', otherUserId).single()
      setOtherUser(other)
      const { data: msgs } = await supabase.from('direct_messages')
        .select('id, sender_id, receiver_id, content, is_read, created_at')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      setMessages((msgs as Message[]) ?? [])
      await supabase.from('direct_messages').update({ is_read: true }).eq('sender_id', otherUserId).eq('receiver_id', user.id).eq('is_read', false)
      setLoading(false)
      const channel = supabase.channel(`conv-${[user.id,otherUserId].sort().join('-')}`)
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'direct_messages',filter:`receiver_id=eq.${user.id}`},
          async (payload) => { const msg=payload.new as Message; if(msg.sender_id!==otherUserId)return; setMessages(m=>[...m,msg]); await supabase.from('direct_messages').update({is_read:true}).eq('id',msg.id) })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
    load()
  }, [otherUserId, router, supabase])

  async function handleSend() {
    if (!newMessage.trim() || sending) return
    setSending(true)
    const text = newMessage.trim()
    const opt: Message = { id:`temp-${Date.now()}`, sender_id:currentUserId, receiver_id:otherUserId, content:text, is_read:false, created_at:new Date().toISOString() }
    setMessages(m=>[...m,opt])
    setNewMessage('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    const { data, error } = await supabase.from('direct_messages').insert({ sender_id:currentUserId, receiver_id:otherUserId, content:text }).select('id,sender_id,receiver_id,content,is_read,created_at').single()
    if (!error && data) setMessages(m=>m.map(msg=>msg.id===opt.id?data as Message:msg))
    else { setMessages(m=>m.filter(msg=>msg.id!==opt.id)); setNewMessage(text) }
    setSending(false)
    inputRef.current?.focus()
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900"><p className="text-slate-400 text-sm">Chargement…</p></div>

  const displayName = otherUser ? formatName(otherUser.first_name, otherUser.last_name, otherUser.username) : 'Chargement…'
  const initials = otherUser ? getInitials(otherUser.first_name, otherUser.last_name, otherUser.username) : '?'

  return (
    <div ref={containerRef} className="flex flex-col bg-slate-900" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100svh', overflow: 'hidden' }}>

      {/* ── Header fixe ── */}
      <div className="flex-none flex items-center gap-3 px-3 py-3 bg-slate-800 border-b border-slate-700 z-10">
        <button onClick={() => router.push('/communaute/messages')} className="p-1.5 rounded-full hover:bg-slate-700 transition text-slate-300 flex-none">
          <ArrowLeft size={20} />
        </button>
        {otherUser && (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-none ${avatarColor(otherUser.id)}`}>
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          <p className="text-xs text-slate-400">@{otherUser?.username}</p>
        </div>
      </div>

      {/* ── Messages scrollables ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-1" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-2">
            <p className="text-slate-500 text-sm">Début de la conversation</p>
            <p className="text-slate-600 text-xs">Envoyez un message pour démarrer</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          const prev = messages[i-1]
          const showTime = !prev || new Date(msg.created_at).getTime()-new Date(prev.created_at).getTime() > 5*60*1000
          const next = messages[i+1]
          const isLast = !next || next.sender_id !== msg.sender_id
          return (
            <div key={msg.id}>
              {showTime && <p className="text-center text-[10px] text-slate-500 my-2">{formatTime(msg.created_at)}</p>}
              <div className={`flex ${isMe?'justify-end':'justify-start'} items-end gap-1.5`}>
                {!isMe && isLast && otherUser && <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-none mb-0.5 ${avatarColor(otherUser.id)}`}>{initials}</div>}
                {!isMe && !isLast && <div className="w-6 flex-none"/>}
                <div className={`max-w-[78%] px-3.5 py-2 text-sm leading-relaxed break-words ${isMe?'bg-teal-600 text-white rounded-2xl rounded-br-sm':'bg-slate-700 text-slate-100 rounded-2xl rounded-bl-sm'} ${msg.id.startsWith('temp-')?'opacity-60':''}`}>
                  {msg.content}
                  {isMe && isLast && <span className="text-[10px] text-teal-200/60 ml-2 float-right mt-0.5">{msg.id.startsWith('temp-')?'⏳':'✓'}</span>}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} className="h-2"/>
      </div>

      {/* ── Barre de saisie fixe en bas ── */}
      <div className="flex-none flex items-end gap-2 px-3 py-3 bg-slate-800 border-t border-slate-700">
        <textarea
          ref={inputRef}
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,100)+'px' }}
          onKeyDown={(e) => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()} }}
          placeholder="Message…"
          rows={1}
          maxLength={2000}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 resize-none"
          style={{ minHeight:'42px', maxHeight:'100px' }}
        />
        <button onClick={handleSend} disabled={!newMessage.trim()||sending}
          className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all ${newMessage.trim()?'bg-teal-600 hover:bg-teal-500 text-white shadow-lg':'bg-slate-700 text-slate-500'} disabled:opacity-40`}>
          <Send size={18}/>
        </button>
      </div>
    </div>
  )
}
