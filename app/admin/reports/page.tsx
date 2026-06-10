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
        <h1 className="adm-title">Signalements</h1>
        <p className="adm-subtitle">{reports.length} signalement{reports.length > 1 ? 's' : ''} en attente</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        {[['all','Tous'],['testimonial','Témoignages'],['comment','Commentaires']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val as typeof filter)}
            className={`adm-chip ${filter === val ? 'adm-chip-active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--cc-text-muted)' }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">
          <Flag size={24} className="adm-empty-icon" />
          <p className="text-sm">Aucun signalement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const reporter = Array.isArray(r.profiles) ? (r.profiles as unknown as { username: string }[])[0] : r.profiles
            return (
              <div key={r.id} className="adm-panel p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`cc-badge cc-badge-sm ${r.target_type === 'testimonial' ? 'cc-badge-success' : 'cc-badge-warning'}`}>
                        {r.target_type}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--cc-text-disabled)' }}>{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'var(--cc-text)' }}>
                      Signalé par <span className="font-medium">{reporter?.username ?? 'Membre'}</span>
                    </p>
                    {r.reason && <p className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Raison : {r.reason}</p>}
                    <p className="text-xs mt-1 font-mono" style={{ color: 'var(--cc-text-disabled)' }}>ID : {r.target_id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleHide(r)} disabled={processing === r.id}
                      title="Masquer le contenu" className="adm-action adm-action-danger">
                      <EyeOff size={12} />Masquer
                    </button>
                    <button onClick={() => handleDismiss(r.id)} disabled={processing === r.id}
                      title="Ignorer le signalement" className="adm-action">
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
