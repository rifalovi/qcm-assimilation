'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, Eye, EyeOff, Check } from 'lucide-react'

type Report = {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  reason: string | null
  created_at: string
  profiles: { username: string } | null
}

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  return `${days}j`
}

export default function ReportsPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'testimonial' | 'comment'>('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('reports')
        .select('id, reporter_id, target_type, target_id, reason, created_at, profiles!reporter_id ( username )')
        .order('created_at', { ascending: false })
        .limit(100)
      setReports((data as unknown as Report[]) ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleHide(report: Report) {
    setProcessing(report.id)
    const table = report.target_type === 'testimonial' ? 'testimonials' : 'comments'
    await supabase.from(table).update({ is_hidden: true }).eq('id', report.target_id)
    setReports((r) => r.filter((rep) => rep.id !== report.id))
    setProcessing(null)
  }

  async function handleDismiss(reportId: string) {
    setProcessing(reportId)
    await supabase.from('reports').delete().eq('id', reportId)
    setReports((r) => r.filter((rep) => rep.id !== reportId))
    setProcessing(null)
  }

  const filtered = reports.filter((r) => filter === 'all' || r.target_type === filter)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Signalements</h1>
        <p className="text-sm text-slate-400">{reports.length} signalement{reports.length > 1 ? 's' : ''} en attente</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        {[['all','Tous'],['testimonial','Témoignages'],['comment','Commentaires']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val as typeof filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === val ? 'bg-slate-200 text-slate-900' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-8">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-2xl">
          <Flag size={24} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Aucun signalement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const reporter = Array.isArray(r.profiles) ? (r.profiles as unknown as { username: string }[])[0] : r.profiles
            return (
              <div key={r.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.target_type === 'testimonial' ? 'bg-teal-900/40 text-teal-400' : 'bg-orange-900/40 text-orange-400'}`}>
                        {r.target_type}
                      </span>
                      <span className="text-xs text-slate-500">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-sm text-white mb-1">
                      Signalé par <span className="font-medium">{reporter?.username ?? 'Membre'}</span>
                    </p>
                    {r.reason && <p className="text-xs text-slate-400">Raison : {r.reason}</p>}
                    <p className="text-xs text-slate-600 mt-1 font-mono">ID : {r.target_id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleHide(r)} disabled={processing === r.id}
                      title="Masquer le contenu"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 border border-red-500/30 text-red-400 text-xs rounded-xl hover:bg-red-900/30 disabled:opacity-40 transition-colors">
                      <EyeOff size={12} />Masquer
                    </button>
                    <button onClick={() => handleDismiss(r.id)} disabled={processing === r.id}
                      title="Ignorer le signalement"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-xl hover:bg-slate-600 disabled:opacity-40 transition-colors">
                      <Check size={12} />Ignorer
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
