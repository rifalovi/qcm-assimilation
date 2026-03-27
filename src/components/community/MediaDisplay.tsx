'use client'

// Affiche les images et liens attachés à un message/post

import { useState } from 'react'
import { Link as LinkIcon, X } from 'lucide-react'

interface Props {
  attachments: string[]
  content?: string
}

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) ?? []
}

function renderTextWithLinks(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, i) =>
    part.match(/^https?:\/\//) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        className="text-teal-400 underline underline-offset-2 hover:text-teal-300 break-all">
        {part}
      </a>
    ) : part
  )
}

export default function MediaDisplay({ attachments, content }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const urls = content ? extractUrls(content) : []

  return (
    <>
      {/* Images */}
      {attachments.length > 0 && (
        <div className={`grid gap-2 mt-2 ${attachments.length === 1 ? 'grid-cols-1' : attachments.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {attachments.map((url) => (
            <button key={url} onClick={() => setLightbox(url)} className="relative overflow-hidden rounded-xl border border-slate-600 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full object-cover max-h-64 group-hover:scale-105 transition-transform duration-200" />
            </button>
          ))}
        </div>
      )}

      {/* Liens détectés */}
      {urls.map((url) => (
        <a key={url} href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 mt-2 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 hover:border-slate-500 transition-colors">
          <LinkIcon size={12} className="text-slate-400 flex-shrink-0" />
          <span className="text-xs text-teal-400 truncate">{url}</span>
        </a>
      ))}

      {/* Lightbox image plein écran */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

export { renderTextWithLinks }
