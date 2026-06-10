"use client";

import { useEffect, useState } from "react";

type Overview = {
  totalTokens: number; todayTokens: number; weekTokens: number; monthTokens: number;
  totalRequests: number; todayRequests: number; weekRequests: number; monthRequests: number;
  offTopicCount: number; estimatedCostTotal: number; estimatedCostMonth: number;
};
type ByMode = Record<string, { requests: number; tokens: number }>;
type TopUser = { id: string; requests: number; tokens: number; username?: string };
type TimelineEntry = { date: string; requests: number; tokens: number };

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {sub && <p className="mt-0.5 text-xs opacity-60">{sub}</p>}
    </div>
  );
}

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  explain: { label: "Explications", color: "bg-violet-500" },
  coach: { label: "Coach", color: "bg-sky-500" },
  assistant: { label: "Assistant", color: "bg-emerald-500" },
  chat: { label: "Chatbot", color: "bg-blue-500" },
};

export default function AiUsagePage() {
  const [data, setData] = useState<{
    overview: Overview; byMode: ByMode; topUsers: TopUser[]; timeline: TimelineEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/ai-analytics")
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--cc-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center py-20" style={{ color: 'var(--cc-text-muted)' }}>Impossible de charger les données</p>;
  }

  const { overview, byMode, topUsers, timeline } = data;
  const maxTokensDay = Math.max(...timeline.map(d => d.tokens), 1);
  const maxReqDay = Math.max(...timeline.map(d => d.requests), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="adm-title">Usage IA</h1>
        <p className="adm-subtitle">Suivi des tokens OpenAI, coûts et quotas</p>
      </div>

      {/* KPI principaux */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tokens aujourd'hui" value={formatTokens(overview.todayTokens)} sub={`${overview.todayRequests} requêtes`} accent="border-[var(--cc-primary)] bg-[var(--cc-info-soft)] text-[var(--cc-primary)]" />
        <StatCard label="Tokens cette semaine" value={formatTokens(overview.weekTokens)} sub={`${overview.weekRequests} requêtes`} accent="border-[var(--cc-success)] bg-[var(--cc-success-soft)] text-[var(--cc-success)]" />
        <StatCard label="Tokens ce mois" value={formatTokens(overview.monthTokens)} sub={`${overview.monthRequests} req · ~${overview.estimatedCostMonth}$`} accent="border-[var(--cc-primary)] bg-[var(--cc-primary-soft)] text-[var(--cc-primary)]" />
        <StatCard label="Total cumulé" value={formatTokens(overview.totalTokens)} sub={`${overview.totalRequests} req · ~${overview.estimatedCostTotal}$`} accent="border-[var(--cc-warning)] bg-[var(--cc-warning-soft)] text-[var(--cc-warning)]" />
      </div>

      {/* Alerte coût */}
      {overview.estimatedCostMonth > 5 && (
        <div className="rounded-2xl border border-[var(--cc-danger)] bg-[var(--cc-danger-soft)] p-4 flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--cc-danger-soft)] text-sm">!</span>
          <div>
            <p className="text-sm font-bold text-[var(--cc-danger)]">Coût mensuel élevé : ~{overview.estimatedCostMonth}$</p>
            <p className="text-xs text-[var(--cc-danger)]">Pensez à ajuster les quotas dans src/lib/aiQuota.ts si nécessaire.</p>
          </div>
        </div>
      )}

      {/* Stats secondaires */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Questions hors-sujet bloquées" value={String(overview.offTopicCount)} sub="Tokens économisés" accent="border-[var(--cc-danger)] bg-[var(--cc-danger-soft)] text-[var(--cc-danger)]" />
        <StatCard label="Coût moyen / requête" value={overview.totalRequests > 0 ? `${((overview.estimatedCostTotal / overview.totalRequests) * 100).toFixed(3)}¢` : '—'} accent="adm-stat" />
        <StatCard label="Tokens moyen / requête" value={overview.totalRequests > 0 ? String(Math.round(overview.totalTokens / overview.totalRequests)) : '—'} accent="adm-stat" />
      </div>

      {/* Usage par mode */}
      <div className="adm-panel p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--cc-text)' }}>Répartition par mode</h2>
        <div className="space-y-3">
          {Object.entries(byMode).sort((a, b) => b[1].tokens - a[1].tokens).map(([mode, stats]) => {
            const pct = overview.totalTokens > 0 ? (stats.tokens / overview.totalTokens) * 100 : 0;
            const meta = MODE_LABELS[mode] ?? { label: mode, color: "bg-zinc-500" };
            return (
              <div key={mode}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                    <span className="text-xs font-medium" style={{ color: 'var(--cc-text)' }}>{meta.label}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>
                    {formatTokens(stats.tokens)} tokens · {stats.requests} req · {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full" style={{ background: 'var(--cc-surface-alt)' }}>
                  <div className={`h-full rounded-full ${meta.color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline 30 jours — Tokens */}
      <div className="adm-panel p-5">
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--cc-text)' }}>Tokens consommés — 30 derniers jours</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--cc-text-disabled)' }}>Barres = tokens · Ligne = requêtes</p>
        <div className="flex items-end gap-[2px] h-32">
          {timeline.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div
                className="w-full bg-[var(--cc-primary)] rounded-t-sm transition-all hover:bg-[var(--cc-primary-hover)]"
                style={{ height: `${Math.max(2, (d.tokens / maxTokensDay) * 100)}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="rounded-lg px-2 py-1 text-[10px] whitespace-nowrap shadow-lg" style={{ background: 'var(--cc-surface-alt)', color: 'var(--cc-text)' }}>
                  <p className="font-bold">{d.date.slice(5)}</p>
                  <p>{formatTokens(d.tokens)} tokens</p>
                  <p>{d.requests} requêtes</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[9px]" style={{ color: 'var(--cc-text-disabled)' }}>
          <span>{timeline[0]?.date.slice(5)}</span>
          <span>{timeline[timeline.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      {/* Top utilisateurs */}
      <div className="adm-panel p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--cc-text)' }}>Top utilisateurs par consommation</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--cc-border)]">
                <th className="text-left py-2 font-medium" style={{ color: 'var(--cc-text-muted)' }}>Utilisateur</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--cc-text-muted)' }}>Requêtes</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--cc-text-muted)' }}>Tokens</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--cc-text-muted)' }}>Coût estimé</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--cc-text-muted)' }}>% total</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u, i) => {
                const pct = overview.totalTokens > 0 ? (u.tokens / overview.totalTokens) * 100 : 0;
                const cost = u.tokens * 0.0000003;
                return (
                  <tr key={u.id} className="border-b border-[var(--cc-border)] last:border-0">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]" style={{ background: 'var(--cc-surface-alt)', color: 'var(--cc-text-muted)' }}>{i + 1}</span>
                        <span className="font-medium" style={{ color: 'var(--cc-text)' }}>{u.username ?? (u.id === 'anonymous' ? 'Anonymes' : u.id.slice(0, 8))}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right" style={{ color: 'var(--cc-text)' }}>{u.requests}</td>
                    <td className="py-2 text-right" style={{ color: 'var(--cc-text)' }}>{formatTokens(u.tokens)}</td>
                    <td className="py-2 text-right" style={{ color: 'var(--cc-text)' }}>{cost < 0.01 ? '<0.01$' : `${cost.toFixed(2)}$`}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="h-1.5 w-12 rounded-full" style={{ background: 'var(--cc-surface-alt)' }}>
                          <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="w-10 text-right" style={{ color: 'var(--cc-text-muted)' }}>{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info quotas */}
      <div className="adm-panel p-5">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--cc-text)' }}>Quotas configurés</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--cc-border)]">
                <th className="text-left py-2" style={{ color: 'var(--cc-text-muted)' }}>Rôle</th>
                <th className="text-center py-2" style={{ color: 'var(--cc-text-muted)' }}>Explain</th>
                <th className="text-center py-2" style={{ color: 'var(--cc-text-muted)' }}>Coach</th>
                <th className="text-center py-2" style={{ color: 'var(--cc-text-muted)' }}>Assistant</th>
                <th className="text-center py-2" style={{ color: 'var(--cc-text-muted)' }}>Chatbot</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: "Anonyme", e: "3/j", c: "—", a: "3/j", ch: "3/j" },
                { role: "Freemium", e: "10/j", c: "3/j", a: "10/j", ch: "10/j" },
                { role: "Premium", e: "Illimité", c: "Illimité", a: "Illimité", ch: "Illimité" },
                { role: "Élite", e: "Illimité", c: "Illimité", a: "Illimité", ch: "Illimité" },
              ].map(r => (
                <tr key={r.role} className="border-b border-[var(--cc-border)] last:border-0">
                  <td className="py-2 font-medium" style={{ color: 'var(--cc-text)' }}>{r.role}</td>
                  <td className="py-2 text-center" style={{ color: 'var(--cc-text)' }}>{r.e}</td>
                  <td className="py-2 text-center" style={{ color: 'var(--cc-text)' }}>{r.c}</td>
                  <td className="py-2 text-center" style={{ color: 'var(--cc-text)' }}>{r.a}</td>
                  <td className="py-2 text-center" style={{ color: 'var(--cc-text)' }}>{r.ch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--cc-text-disabled)' }}>Modifier les quotas dans <code style={{ color: 'var(--cc-text-muted)' }}>src/lib/aiQuota.ts</code></p>
      </div>
    </div>
  );
}
