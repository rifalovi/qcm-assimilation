'use client'

// Barre de saisie enrichie : texte + images + emoji + détection liens
// Réutilisable dans forum, témoignages, messages privés

import { useState, useRef, useEffect } from 'react'
import { validateContent } from '@/lib/contentSafety'
import { createClient } from '@/lib/supabase/client'
import { Image, Smile, Send, X, Link as LinkIcon, Loader } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface Props {
  onSubmit: (content: string, attachments: string[]) => Promise<void>
  placeholder?: string
  maxLength?: number
  minLength?: number
  submitLabel?: string
  rows?: number
  disabled?: boolean
}

interface LinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
  loading: boolean
}

// ── Emojis fréquents (picker léger sans dépendance) ───────────
const EMOJI_GROUPS = [
  { label: 'Fréquents', emojis: ['👍','❤️','😊','🙏','💪','🎉','✅','🇫🇷','😮','🤝','👏','💡','⭐','🔥','😅'] },
  { label: 'Visages', emojis: ['😀','😃','😄','😁','😆','😂','🤣','😊','😇','🥰','😍','🤩','😘','😗','😙'] },
  { label: 'Gestes', emojis: ['👋','🤚','✋','🖐','👌','🤌','🤏','✌️','🤞','🤟','🤘','👈','👉','👆','👇'] },
  { label: 'Objets', emojis: ['📚','📝','✏️','🖊','📖','🗒','📋','🔍','💼','🏛','⚖️','🎓','📜','🗳','🏅'] },
]

// ── Détection d'URL dans le texte ─────────────────────────────
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) ?? []
}

// ── Composant principal ────────────────────────────────────────
export default function MediaInput({
  onSubmit,
  placeholder = 'Écrivez votre message…',
  maxLength = 2000,
  minLength = 1,
  submitLabel = 'Envoyer',
  rows = 3,
  disabled = false,
}: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [activeEmojiGroup, setActiveEmojiGroup] = useState(0)
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Détection automatique de liens dans le texte
  useEffect(() => {
    const urls = extractUrls(content)
    if (!urls.length) { setLinkPreview(null); return }
    const url = urls[urls.length - 1]
    if (linkPreview?.url === url) return

    setLinkPreview({ url, loading: true })
    // On affiche juste l'URL — pas de fetch externe pour éviter les CORS
    setTimeout(() => {
      setLinkPreview({ url, loading: false, title: url })
    }, 300)
  }, [content])

  // Upload image vers Supabase Storage
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type)) {
      alert('Format non supporté. Utilisez JPG, PNG, GIF ou WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop lourde (max 5 MB).')
      return
    }
    if (attachments.length >= 4) {
      alert('Maximum 4 images par message.')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('forum-attachments')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (!error && data) {
      const { data: urlData } = supabase.storage.from('forum-attachments').getPublicUrl(data.path)
      setAttachments((a) => [...a, urlData.publicUrl])
    } else {
      alert('Erreur lors de l\'upload. Réessayez.')
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Supprime une image
  async function removeAttachment(url: string) {
    const path = url.split('/forum-attachments/')[1]
    await supabase.storage.from('forum-attachments').remove([path])
    setAttachments((a) => a.filter((u) => u !== url))
  }

  // Insère un emoji à la position du curseur
  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current
    if (!textarea) { setContent((c) => c + emoji); return }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.slice(0, start) + emoji + content.slice(end)
    setContent(newContent)
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
      textarea.focus()
    }, 0)
  }

  async function handleSubmit() {
    if (submitting || disabled) return
    if (content.trim().length < minLength && attachments.length === 0) return

    // Validation sécurité
    if (content.trim()) {
      const check = validateContent(content)
      if (!check.valid) {
        alert(check.error)
        return
      }
    }

    setSubmitting(true)
    await onSubmit(content.trim(), attachments)
    setContent('')
    setAttachments([])
    setLinkPreview(null)
    setShowEmoji(false)
    setSubmitting(false)
  }

  const canSubmit = (content.trim().length >= minLength || attachments.length > 0) && !submitting && !disabled

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">

      {/* Préview images sélectionnées */}
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap p-3 pb-0">
          {attachments.map((url) => (
            <div key={url} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-600" />
              <button
                onClick={() => removeAttachment(url)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Préview lien détecté */}
      {linkPreview && (
        <div className="mx-3 mt-3 flex items-center gap-2 bg-slate-700 rounded-xl px-3 py-2">
          <LinkIcon size={12} className="text-slate-400 flex-shrink-0" />
          {linkPreview.loading
            ? <Loader size={12} className="text-slate-400 animate-spin" />
            : <p className="text-xs text-slate-300 truncate">{linkPreview.title}</p>
          }
          <button onClick={() => setLinkPreview(null)} className="ml-auto text-slate-500 hover:text-slate-300">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Zone de texte */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && rows <= 2 && (e.preventDefault(), handleSubmit())}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full px-4 pt-3 pb-2 text-sm bg-transparent text-white placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
        onInput={(e) => {
          if (rows > 2) return
          const t = e.target as HTMLTextAreaElement
          t.style.height = 'auto'
          t.style.height = Math.min(t.scrollHeight, 120) + 'px'
        }}
      />

      {/* Picker emoji */}
      {showEmoji && (
        <div className="border-t border-slate-700 p-3">
          {/* Onglets groupes */}
          <div className="flex gap-1 mb-2">
            {EMOJI_GROUPS.map((g, i) => (
              <button key={g.label} onClick={() => setActiveEmojiGroup(i)}
                className={`text-xs px-2 py-1 rounded-lg transition-colors ${activeEmojiGroup === i ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {g.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-10 gap-0.5">
            {EMOJI_GROUPS[activeEmojiGroup].emojis.map((emoji) => (
              <button key={emoji} onClick={() => insertEmoji(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-600 transition-colors text-lg">
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barre d'outils */}
      <div className="flex items-center justify-between px-2 py-2 border-t border-slate-700 gap-2">
        <div className="flex items-center gap-1">

          {/* Upload image */}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || attachments.length >= 4}
            title="Ajouter une image"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors">
            {uploading ? <Loader size={16} className="animate-spin" /> : <Image size={16} />}
          </button>

          {/* Picker emoji */}
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            title="Emoji"
            className={`p-1.5 rounded-lg transition-colors ${showEmoji ? 'text-amber-400 bg-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`}>
            <Smile size={16} />
          </button>

          {/* Compteur caractères */}
          {content.length > maxLength * 0.8 && (
            <span className={`text-xs ml-1 ${content.length >= maxLength ? 'text-red-400' : 'text-slate-500'}`}>
              {maxLength - content.length}
            </span>
          )}
        </div>

        {/* Bouton envoyer */}
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors flex-shrink-0">
          {submitting ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
          <span className="hidden sm:inline">{submitLabel}</span>
        </button>
      </div>
    </div>
  )
}
