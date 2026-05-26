'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from 'recharts'
import { Euro, Leaf, Target, Zap } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────
type Granularity = 'day' | 'week' | 'month'

type AnalyticsPayload = {
  range: { days: number; granularity: Granularity; since: string }
  kpis: {
    totalUsers: number
    counts: Record<string, number>
    paidUsers: number
    conversionRate: number
    allTimeSignups: number
    totalAudioPlays: number
    totalPageviews: number
    quizTotal: number
    avgScore: number
    passesExpress: number
    passesSerenite: number
    revenusMonth: number
    conversionPassRate: number
  }
  signups: { timeline: { date: string; count: number }[]; total: number; allTime: number }
  pages: { total: number; top: { path: string; count: number }[] }
  episodes: { total: number; top: { title: string; slug: string; count: number }[] }
  quiz: {
    total: number; passed: number; failed: number
    exam: number; train: number; avgScore: number
    timeline: { date: string; count: number }[]
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────
const RANGE_OPTIONS: { days: number; label: string }[] = [
  { days: 7,  label: '7 j'  },
  { days: 30, label: '30 j' },
  { days: 90, label: '90 j' },
]

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day',   label: 'Jour'    },
  { value: 'week',  label: 'Semaine' },
  { value: 'month', label: 'Mois'    },
]

function formatBucketLabel(key: string, granularity: Granularity): string {
  if (granularity === 'day') {
    const [, m, d] = key.split('-')
    return `${d}/${m}`
  }
  if (granularity === 'week') {
    const [, w] = key.split('-W')
    return `S${w}`
  }
  // month
  const [y, m] = key.split('-')
  return `${m}/${y.slice(2)}`
}

// ─── Composants visuels ──────────────────────────────────────────────────
function KPICard({
  label, value, sub, icon, color,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: 'blue' | 'amber' | 'emerald' | 'yellow' | 'violet' | 'rose'
}) {
  const colors: Record<string, string> = {
    blue:    'border-blue-400/20 bg-blue-500/10',
    amber:   'border-amber-400/20 bg-amber-500/10',
    emerald: 'border-emerald-400/20 bg-emerald-500/10',
    yellow:  'border-yellow-400/20 bg-yellow-500/10',
    violet:  'border-violet-400/20 bg-violet-500/10',
    rose:    'border-rose-400/20 bg-rose-500/10',
  }
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="flex h-7 w-7 items-center justify-center text-slate-300">{icon}</div>
      <div className="mt-3 text-3xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-xs font-semibold text-slate-300">{label}</div>
      {sub && <div className="mt-1 text-[10px] text-slate-500">{sub}</div>}
    </div>
  )
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────
export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState<number>(30)
  const [granularity, setGranularity] = useState<Granularity>('day')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/admin/analytics?days=${days}&granularity=${granularity}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        if (json.error) { setError(json.error); return }
        setData(json)
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [days, granularity])

  const signupsChart = useMemo(
    () => (data?.signups.timeline ?? []).map((p) => ({
      label: formatBucketLabel(p.date, data?.range.granularity ?? 'day'),
      count: p.count,
    })),
    [data]
  )

  const quizChart = useMemo(
    () => (data?.quiz.timeline ?? []).map((p) => ({
      label: formatBucketLabel(p.date, data?.range.granularity ?? 'day'),
      count: p.count,
    })),
    [data]
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-white mb-1">Analytics</h1>
          <p className="text-sm text-slate-400">Activité, conversion et usage de Cap Citoyen</p>
        </div>

        {/* Sélecteurs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500">Période</span>
            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setDays(opt.days)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    days === opt.days ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500">Granularité</span>
            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              {GRANULARITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGranularity(opt.value)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    granularity === opt.value ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Chargement…</p>}
      {error && <p className="text-sm text-red-400">Erreur : {error}</p>}

      {data && (
        <div className="space-y-6">
          {/* ─── KPIs globaux ──────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              label="Utilisateurs total"
              value={data.kpis.totalUsers}
              sub={`${data.kpis.allTimeSignups} comptes auth depuis le début`}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              color="blue"
            />
            <KPICard
              label="Comptes payants"
              value={data.kpis.paidUsers}
              sub={`${data.kpis.counts.premium ?? 0} Premium · ${data.kpis.counts.elite ?? 0} Élite`}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
              color="amber"
            />
            <KPICard
              label="Taux de conversion"
              value={`${data.kpis.conversionRate}%`}
              sub="freemium → premium/élite"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              color="emerald"
            />
            <KPICard
              label="Quiz complétés"
              value={data.kpis.quizTotal}
              sub={`Score moyen ${data.kpis.avgScore}% · sur ${data.range.days} j`}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              color="violet"
            />
          </div>

          {/* ─── KPIs Passes ───────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              label="Pass Express actifs"
              value={data.kpis.passesExpress}
              sub="7 jours · 4,99 €"
              icon={<Zap size={20} />}
              color="amber"
            />
            <KPICard
              label="Pass Sérénité actifs"
              value={data.kpis.passesSerenite}
              sub="30 jours · 9,99 €"
              icon={<Leaf size={20} />}
              color="emerald"
            />
            <KPICard
              label="Revenus ce mois"
              value={`${data.kpis.revenusMonth.toFixed(2)} €`}
              sub="Passes achetés ce mois"
              icon={<Euro size={20} />}
              color="yellow"
            />
            <KPICard
              label="Conv. freemium → Pass"
              value={`${data.kpis.conversionPassRate}%`}
              sub="Passes actifs / comptes non-anonymes"
              icon={<Target size={20} />}
              color="violet"
            />
          </div>

          {/* ─── Évolution inscriptions ──────────────────────────────── */}
          <SectionCard
            title={`📈 Évolution des inscriptions (${data.signups.total} sur ${data.range.days} jours)`}
            subtitle={`Source : auth.users · Granularité : ${granularity}`}
          >
            {signupsChart.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">Aucune inscription dans la période</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <LineChart data={signupsChart} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickMargin={6} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#cbd5e1' }}
                      itemStyle={{ color: '#5eead4' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* ─── Conversion + répartition rôles ──────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="🎯 Taux de conversion freemium → premium" subtitle="Calcul : (premium + élite) / (utilisateurs non anonymes)">
              <div className="flex items-center gap-6">
                <div className="relative h-32 w-32 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.915" fill="none"
                      stroke="#10b981" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${data.kpis.conversionRate}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-white">
                    {data.kpis.conversionRate}%
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Stat label="Total comptes (non anonymes)" value={(data.kpis.totalUsers - (data.kpis.counts.anonymous ?? 0)).toString()} />
                  <Stat label="Freemium" value={(data.kpis.counts.freemium ?? 0).toString()} dot="bg-blue-400" />
                  <Stat label="Premium" value={(data.kpis.counts.premium ?? 0).toString()} dot="bg-amber-400" />
                  <Stat label="Élite" value={(data.kpis.counts.elite ?? 0).toString()} dot="bg-yellow-400" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="📚 Tests passés (détails)" subtitle="Répartition réussite, mode et score moyen">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Réussis" value={data.quiz.passed.toString()} dot="bg-emerald-400" />
                <Stat label="Échoués" value={data.quiz.failed.toString()} dot="bg-rose-400" />
                <Stat label="Mode train" value={data.quiz.train.toString()} dot="bg-blue-400" />
                <Stat label="Mode exam" value={data.quiz.exam.toString()} dot="bg-violet-400" />
              </div>
              <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Score moyen</p>
                <p className="text-2xl font-extrabold text-white">{data.quiz.avgScore}%</p>
              </div>
            </SectionCard>
          </div>

          {/* ─── Quiz timeline ──────────────────────────────────────── */}
          <SectionCard
            title={`📝 Quiz complétés sur ${data.range.days} jours`}
            subtitle={`Source : table results · Granularité : ${granularity}`}
          >
            {quizChart.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">Aucun quiz complété dans la période</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <BarChart data={quizChart} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickMargin={6} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#cbd5e1' }}
                      itemStyle={{ color: '#a78bfa' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* ─── Top pages + Top épisodes ────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title={`🌐 Pages les plus visitées (${data.pages.total} pageviews)`}
              subtitle={`Source : user_events $pageview · ${data.range.days} derniers jours`}
            >
              <TopList
                items={data.pages.top.map((p) => ({ key: p.path, label: p.path, count: p.count }))}
                accent="text-blue-300"
                bar="bg-blue-500"
                emptyMsg="Aucun pageview enregistré"
              />
            </SectionCard>

            <SectionCard
              title={`🎧 Épisodes les plus écoutés (${data.episodes.total} lectures)`}
              subtitle={`Source : user_events audio_played · ${data.range.days} derniers jours`}
            >
              <TopList
                items={data.episodes.top.map((e) => ({ key: e.slug, label: e.title, count: e.count }))}
                accent="text-purple-300"
                bar="bg-purple-500"
                emptyMsg="Aucun épisode encore écouté"
              />
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────
function Stat({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
      <span className="flex items-center gap-2 text-xs text-slate-400">
        {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
        {label}
      </span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  )
}

function TopList({
  items, accent, bar, emptyMsg,
}: {
  items: { key: string; label: string; count: number }[]
  accent: string
  bar: string
  emptyMsg: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-6">{emptyMsg}</p>
  }
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="w-4 text-xs text-slate-500">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className={`truncate text-sm ${accent}`}>{item.label}</span>
              <span className="shrink-0 text-xs text-slate-400">{item.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
