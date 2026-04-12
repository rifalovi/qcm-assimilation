"use client";

import { useEffect, useState } from "react";
import { STEP_LABELS, type EmailStep } from "../../../src/lib/emailTemplates";

type UserSequence = {
  id: string;
  username: string;
  email: string | null;
  role: string;
  created_at: string;
  sequences: Array<{
    id: string;
    step: number;
    status: string;
    scheduled_at: string;
    sent_at: string | null;
  }>;
  last_step_sent: number;
  next_pending_step: number | null;
  next_scheduled_at: string | null;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: "bg-emerald-500/10 border-emerald-400/20 text-emerald-300",
    pending: "bg-amber-500/10 border-amber-400/20 text-amber-300",
    failed: "bg-red-500/10 border-red-400/20 text-red-300",
    cancelled: "bg-slate-500/10 border-slate-400/20 text-slate-400",
  };

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}

export default function AdminEmailsPage() {
  const [users, setUsers] = useState<UserSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "completed">("all");
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-sequences");
      if (!res.ok) throw new Error("Erreur API");
      const json = await res.json();
      setUsers(json.users ?? []);
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function sendEmail(userId: string, step: EmailStep) {
    const key = `${userId}-${step}`;
    setSending(key);
    try {
      const res = await fetch("/api/admin/email-sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_email", user_id: userId, step }),
      });
      const json = await res.json();
      if (json.success) {
        await loadData();
      } else {
        alert("Erreur lors de l'envoi : " + (json.error ?? "Inconnue"));
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSending(null);
    }
  }

  async function triggerSequence(userId: string) {
    setSending(`seq-${userId}`);
    try {
      const res = await fetch("/api/admin/email-sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger_sequence", user_id: userId }),
      });
      const json = await res.json();
      if (json.success) {
        await loadData();
      } else {
        alert("Erreur : " + (json.error ?? "Inconnue"));
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSending(null);
    }
  }

  const filtered = users.filter((u) => {
    if (search) {
      const s = search.toLowerCase();
      if (
        !u.username?.toLowerCase().includes(s) &&
        !u.email?.toLowerCase().includes(s)
      ) return false;
    }

    switch (filter) {
      case "pending":
        return u.sequences.length === 0;
      case "active":
        return u.sequences.length > 0 && u.last_step_sent < 5;
      case "completed":
        return u.last_step_sent >= 5;
      default:
        return true;
    }
  });

  const stats = {
    total: users.length,
    noSequence: users.filter(u => u.sequences.length === 0).length,
    active: users.filter(u => u.sequences.length > 0 && u.last_step_sent < 5).length,
    completed: users.filter(u => u.last_step_sent >= 5).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Séquences emails</h1>
        <p className="mt-1 text-sm text-slate-400">Gérez les emails automatisés de la séquence onboarding</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total utilisateurs", value: stats.total, accent: "border-blue-400/20 bg-blue-500/10 text-blue-100" },
          { label: "Sans séquence", value: stats.noSequence, accent: "border-amber-400/20 bg-amber-500/10 text-amber-100" },
          { label: "Séquence active", value: stats.active, accent: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" },
          { label: "Séquence terminée", value: stats.completed, accent: "border-violet-400/20 bg-violet-500/10 text-violet-100" },
        ].map(({ label, value, accent }) => (
          <div key={label} className={`rounded-2xl border p-4 ${accent}`}>
            <p className="text-sm opacity-80">{label}</p>
            <p className="mt-1 text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400/30 w-full sm:w-64"
        />
        <div className="flex gap-1.5">
          {(["all", "pending", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filter === f
                  ? "bg-blue-500/15 border border-blue-400/20 text-blue-200"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {f === "all" ? "Tous" : f === "pending" ? "Sans séquence" : f === "active" ? "Actifs" : "Terminés"}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <div key={user.id} className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{user.username ?? "Sans nom"}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      user.role === 'premium' || user.role === 'elite' ? 'bg-amber-900/40 text-amber-400' :
                      user.role === 'admin' || user.role === 'super_admin' ? 'bg-blue-900/40 text-blue-400' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{user.email ?? "Pas d'email"}</p>
                  <p className="text-xs text-slate-500">Inscrit il y a {timeAgo(user.created_at)}</p>
                </div>

                <div className="flex items-center gap-2">
                  {user.sequences.length === 0 && (
                    <button
                      onClick={() => triggerSequence(user.id)}
                      disabled={sending === `seq-${user.id}`}
                      className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      {sending === `seq-${user.id}` ? "..." : "Déclencher séquence"}
                    </button>
                  )}
                </div>
              </div>

              {/* Étapes de la séquence */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {([1, 2, 3, 4, 5] as EmailStep[]).map((step) => {
                  const seq = user.sequences.find(s => s.step === step);
                  const isSending = sending === `${user.id}-${step}`;

                  return (
                    <div key={step} className="flex items-center gap-1.5">
                      <div className={`rounded-lg border px-2 py-1 text-[10px] ${
                        seq?.status === 'sent' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' :
                        seq?.status === 'pending' ? 'border-amber-400/20 bg-amber-500/10 text-amber-300' :
                        seq?.status === 'failed' ? 'border-red-400/20 bg-red-500/10 text-red-300' :
                        'border-white/10 bg-white/5 text-slate-500'
                      }`}>
                        <span className="font-bold">{STEP_LABELS[step].split(' — ')[0]}</span>
                        {seq && <span className="ml-1">({seq.status})</span>}
                      </div>
                      <button
                        onClick={() => sendEmail(user.id, step)}
                        disabled={isSending}
                        className="rounded-lg border border-white/10 bg-white/5 px-1.5 py-1 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        title={`Envoyer ${STEP_LABELS[step]}`}
                      >
                        {isSending ? "..." : "Envoyer"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}
