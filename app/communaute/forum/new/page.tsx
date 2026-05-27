'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function NewForumPostPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(profile?.role ?? '')) { router.push('/communaute/upgrade?feature=la création de discussion&back=/communaute/forum'); return }
      setUserId(user.id)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  async function handleSubmit() {
    if (!title.trim() || !content.trim() || submitting) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({ user_id: userId, title: title.trim(), content: content.trim(), is_pinned: false, is_hidden: false, reply_count: 0 })
      .select('id').single()
    setSubmitting(false)
    if (!error && data) router.push(`/communaute/forum/${data.id}`)
  }

  if (loading) return <main className="max-w-2xl mx-auto px-4 py-16 text-center"><p className="text-sm" style={{ color: "var(--cc-text-muted)" }}>Chargement…</p></main>

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/communaute/forum')}
        className="inline-flex items-center gap-1.5 text-sm transition-colors mb-6 hover:opacity-80" style={{ color: "var(--cc-text-muted)" }}>
        <ArrowLeft size={15} />Retour au forum
      </button>

      <h1 className="text-xl font-medium mb-6" style={{ color: "var(--cc-text)" }}>Nouvelle discussion</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: "var(--cc-text-muted)" }}>Titre <span className="text-red-400">*</span></label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Comment se préparer à l'entretien de naturalisation ?"
            maxLength={150}
            className="w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text)" }} />
          <p className="text-xs mt-1 text-right" style={{ color: "var(--cc-text-disabled)" }}>{title.length}/150</p>
        </div>

        <div>
          <label className="block text-sm mb-1.5" style={{ color: "var(--cc-text-muted)" }}>Message <span className="text-red-400">*</span></label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Décrivez votre question ou partagez votre expérience…"
            rows={8} maxLength={2000}
            className="w-full rounded-2xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-none leading-relaxed"
            style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text)" }} />
          <p className="text-xs mt-1 text-right" style={{ color: "var(--cc-text-disabled)" }}>{content.length}/2000</p>
        </div>

        <button onClick={handleSubmit} disabled={!title.trim() || content.trim().length < 10 || submitting}
          className="w-full py-3 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors">
          {submitting ? 'Publication…' : 'Publier la discussion'}
        </button>
      </div>
    </main>
  )
}
