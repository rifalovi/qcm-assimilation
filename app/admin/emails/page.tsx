"use client";

import { useEffect, useState } from "react";

type EmailStep = 1 | 2 | 3 | 4 | 5;
type TemplateInfo = { step: number; label: string; delay_days: number };
type UserSeq = {
  id: string; username: string; email: string | null; role: string;
  created_at: string; sequences: { step: number; status: string; scheduled_at: string; sent_at: string | null }[];
  last_step_sent: number;
};
type Stats = {
  total_users: number; with_sequence: number; without_sequence: number;
  completed: number; total_sent: number; total_pending: number; total_failed: number;
};
type CapturedEmail = { email: string; source: string; created_at: string };

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

type Tab = "users" | "templates" | "bulk" | "capture";

export default function AdminEmailsPage() {
  const [users, setUsers] = useState<UserSeq[]>([]);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "no_sequence" | "active" | "completed">("all");
  const [tab, setTab] = useState<Tab>("users");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState("");
  const [bulkStep, setBulkStep] = useState<EmailStep>(1);
  const [bulkTarget, setBulkTarget] = useState<"all" | "no_sequence" | "freemium" | "premium">("no_sequence");
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [captureEmail, setCaptureEmail] = useState("");
  const [captureSource, setCaptureSource] = useState("forum");
  const [capturedEmails, setCapturedEmails] = useState<CapturedEmail[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-sequences");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setUsers(json.users ?? []);
      setTemplates(json.templates ?? []);
      setStats(json.stats ?? null);
    } catch { }
    finally { setLoading(false); }
  }

  async function loadCaptured() {
    const res = await fetch("/api/admin/email-sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_captured_emails" }),
    });
    const json = await res.json();
    setCapturedEmails(json.emails ?? []);
  }

  useEffect(() => { loadData(); }, []);

  async function sendEmail(userId: string, step: EmailStep) {
    setSending(`${userId}-${step}`);
    const res = await fetch("/api/admin/email-sequences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_email", user_id: userId, step }),
    });
    const json = await res.json();
    if (!json.success) alert("Erreur : " + (json.error ?? "Inconnue"));
    await loadData();
    setSending(null);
  }

  async function triggerSequence(userId: string) {
    setSending(`seq-${userId}`);
    await fetch("/api/admin/email-sequences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "trigger_sequence", user_id: userId }),
    });
    await loadData();
    setSending(null);
  }

  async function previewTemplate(step: EmailStep) {
    const res = await fetch("/api/admin/email-sequences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "preview_template", step }),
    });
    const json = await res.json();
    setPreviewSubject(json.subject ?? "");
    setPreviewHtml(json.html ?? "");
  }

  async function sendBulk() {
    setSending("bulk");
    setBulkResult(null);
    const res = await fetch("/api/admin/email-sequences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk_send", step: bulkStep, target: bulkTarget }),
    });
    const json = await res.json();
    setBulkResult(`Envoyé : ${json.sent}/${json.total} — Échecs : ${json.failed}`);
    await loadData();
    setSending(null);
  }

  async function handleCapture() {
    if (!captureEmail.trim()) return;
    await fetch("/api/admin/email-sequences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "capture_email", email: captureEmail.trim(), source: captureSource }),
    });
    setCaptureEmail("");
    loadCaptured();
  }

  async function sendCustomEmail() {
    if (!customSubject.trim() || !customContent.trim() || selectedUsers.size === 0) return;
    setSending("custom");
    const res = await fetch("/api/admin/email-sequences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_custom", user_ids: Array.from(selectedUsers),
        subject: customSubject, html_content: customContent,
      }),
    });
    const json = await res.json();
    alert(`Envoyé : ${json.sent}/${json.total}`);
    setSending(null);
    setSelectedUsers(new Set());
  }

  const filtered = users.filter(u => {
    if (search) {
      const s = search.toLowerCase();
      if (!u.username?.toLowerCase().includes(s) && !u.email?.toLowerCase().includes(s)) return false;
    }
    if (filter === "no_sequence") return u.sequences.length === 0;
    if (filter === "active") return u.sequences.length > 0 && u.last_step_sent < 5;
    if (filter === "completed") return u.last_step_sent >= 5;
    return true;
  });

  const STEP_LABELS: Record<number, string> = {
    1: "J1 — Bienvenue", 2: "J3 — Conseil", 3: "J7 — Progression",
    4: "J14 — Offre", 5: "J30 — Dernier message",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">CRM — Emails</h1>
        <p className="mt-1 text-sm text-slate-400">Séquences, envoi groupé, capture et modération</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { l: "Utilisateurs", v: stats.total_users, c: "border-blue-400/20 bg-blue-500/10 text-blue-100" },
            { l: "Sans séquence", v: stats.without_sequence, c: "border-amber-400/20 bg-amber-500/10 text-amber-100" },
            { l: "Séquence active", v: stats.with_sequence - stats.completed, c: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" },
            { l: "Terminées", v: stats.completed, c: "border-violet-400/20 bg-violet-500/10 text-violet-100" },
            { l: "Emails envoyés", v: stats.total_sent, c: "border-sky-400/20 bg-sky-500/10 text-sky-100" },
            { l: "En attente", v: stats.total_pending, c: "border-slate-400/20 bg-slate-500/10 text-slate-100" },
            { l: "Échoués", v: stats.total_failed, c: "border-red-400/20 bg-red-500/10 text-red-100" },
          ].map(s => (
            <div key={s.l} className={`rounded-2xl border p-3 ${s.c}`}>
              <p className="text-xs opacity-80">{s.l}</p>
              <p className="text-xl font-extrabold mt-0.5">{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1.5 border-b border-white/10 pb-2">
        {([
          { id: "users" as Tab, label: "Utilisateurs" },
          { id: "templates" as Tab, label: "Templates" },
          { id: "bulk" as Tab, label: "Envoi groupé" },
          { id: "capture" as Tab, label: "Capture emails" },
        ]).map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "capture") loadCaptured(); }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${tab === t.id ? "bg-blue-500/15 border border-blue-400/20 text-blue-200" : "text-slate-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: UTILISATEURS ── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 w-full sm:w-64 focus:outline-none focus:border-blue-400/30" />
            <div className="flex gap-1.5">
              {(["all", "no_sequence", "active", "completed"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-blue-500/15 border border-blue-400/20 text-blue-200" : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
                  {f === "all" ? "Tous" : f === "no_sequence" ? "Sans séquence" : f === "active" ? "Actifs" : "Terminés"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /></div>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map(user => (
                <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedUsers.has(user.id)}
                          onChange={e => { const s = new Set(selectedUsers); e.target.checked ? s.add(user.id) : s.delete(user.id); setSelectedUsers(s); }}
                          className="rounded border-white/20 bg-white/5" />
                        <p className="text-sm font-semibold text-white">{user.username ?? "—"}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${user.role === 'premium' || user.role === 'elite' ? 'bg-amber-900/40 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>{user.role}</span>
                      </div>
                      <p className="text-xs text-slate-400">{user.email ?? "—"} · inscrit il y a {timeAgo(user.created_at)}</p>
                    </div>
                    {user.sequences.length === 0 && (
                      <button onClick={() => triggerSequence(user.id)} disabled={sending === `seq-${user.id}`}
                        className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/20 disabled:opacity-50">
                        {sending === `seq-${user.id}` ? "..." : "Lancer séquence"}
                      </button>
                    )}
                  </div>

                  {/* Étapes */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {([1, 2, 3, 4, 5] as EmailStep[]).map(step => {
                      const seq = user.sequences.find(s => s.step === step);
                      const isSending = sending === `${user.id}-${step}`;
                      return (
                        <div key={step} className="flex items-center gap-1">
                          <div className={`rounded-lg border px-2 py-1 text-[10px] ${
                            seq?.status === 'sent' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' :
                            seq?.status === 'pending' ? 'border-amber-400/20 bg-amber-500/10 text-amber-300' :
                            seq?.status === 'failed' ? 'border-red-400/20 bg-red-500/10 text-red-300' :
                            'border-white/10 bg-white/5 text-slate-500'
                          }`}>
                            <span className="font-bold">J{[1,3,7,14,30][step-1]}</span>
                            {seq?.status === 'sent' && <span className="ml-1">✓</span>}
                            {seq?.status === 'pending' && seq.scheduled_at && (
                              <span className="ml-1 opacity-70">{new Date(seq.scheduled_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                            )}
                          </div>
                          <button onClick={() => sendEmail(user.id, step)} disabled={isSending}
                            className="rounded-lg border border-white/10 bg-white/5 px-1.5 py-1 text-[10px] text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
                            title={`Envoyer ${STEP_LABELS[step]}`}>
                            {isSending ? "..." : "→"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">Aucun utilisateur trouvé</p>
              )}
              {filtered.length > 50 && (
                <p className="text-center text-xs text-slate-500">Affichage limité à 50 — utilisez la recherche</p>
              )}
            </div>
          )}

          {/* Envoi personnalisé aux sélectionnés */}
          {selectedUsers.size > 0 && (
            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 space-y-3">
              <p className="text-sm font-bold text-blue-200">{selectedUsers.size} utilisateur(s) sélectionné(s)</p>
              <input type="text" placeholder="Objet de l'email..." value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none" />
              <textarea placeholder="Contenu HTML de l'email..." value={customContent} onChange={e => setCustomContent(e.target.value)}
                className="w-full min-h-[100px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none" style={{ resize: 'vertical' }} />
              <div className="flex gap-2">
                <button onClick={sendCustomEmail} disabled={!customSubject.trim() || !customContent.trim() || sending === "custom"}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">
                  {sending === "custom" ? "Envoi..." : "Envoyer aux sélectionnés"}
                </button>
                <button onClick={() => setSelectedUsers(new Set())} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 hover:text-white">
                  Tout désélectionner
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: TEMPLATES ── */}
      {tab === "templates" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Cliquez sur un template pour voir son contenu. Les templates sont codés dans <code className="text-slate-300">src/lib/emailTemplates.ts</code>.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map(t => (
              <button key={t.step} onClick={() => previewTemplate(t.step as EmailStep)}
                className="rounded-2xl border border-white/10 bg-slate-800/60 p-4 text-left hover:border-blue-400/20 hover:bg-slate-800/80 transition">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                    t.step <= 2 ? 'bg-blue-900/40 text-blue-300' : t.step <= 4 ? 'bg-amber-900/40 text-amber-300' : 'bg-emerald-900/40 text-emerald-300'
                  }`}>{t.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.label}</p>
                    <p className="text-xs text-slate-400">Envoyé J+{t.delay_days} après inscription</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Preview */}
          {previewHtml && (
            <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Aperçu : {previewSubject}</p>
                <button onClick={() => setPreviewHtml(null)} className="text-slate-400 hover:text-white text-xs">✕ Fermer</button>
              </div>
              <div className="rounded-xl border border-white/10 bg-white overflow-hidden">
                <iframe srcDoc={previewHtml} className="w-full h-[500px] border-0" title="Preview" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ENVOI GROUPÉ ── */}
      {tab === "bulk" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">Envoyer un email de séquence en masse</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email à envoyer</label>
                <select value={bulkStep} onChange={e => setBulkStep(Number(e.target.value) as EmailStep)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
                  {([1,2,3,4,5] as EmailStep[]).map(s => (
                    <option key={s} value={s} className="bg-slate-800">{STEP_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Cible</label>
                <select value={bulkTarget} onChange={e => setBulkTarget(e.target.value as typeof bulkTarget)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
                  <option value="no_sequence" className="bg-slate-800">Sans cette étape</option>
                  <option value="all" className="bg-slate-800">Tous les utilisateurs</option>
                  <option value="freemium" className="bg-slate-800">Freemium uniquement</option>
                  <option value="premium" className="bg-slate-800">Premium / Élite</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={sendBulk} disabled={sending === "bulk"}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">
                {sending === "bulk" ? "Envoi en cours..." : "Lancer l'envoi groupé"}
              </button>
              <button onClick={() => previewTemplate(bulkStep)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:text-white">
                Prévisualiser
              </button>
            </div>

            {bulkResult && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {bulkResult}
              </div>
            )}
          </div>

          {/* Preview inline */}
          {previewHtml && (
            <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">{previewSubject}</p>
                <button onClick={() => setPreviewHtml(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>
              <div className="rounded-xl border border-white/10 bg-white overflow-hidden">
                <iframe srcDoc={previewHtml} className="w-full h-[400px] border-0" title="Preview" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CAPTURE EMAILS ── */}
      {tab === "capture" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">Capturer un email</h2>
            <p className="text-xs text-slate-400">Ajoutez des emails récupérés sur les forums, réseaux sociaux ou événements.</p>
            <div className="flex flex-wrap gap-3">
              <input type="email" placeholder="email@exemple.com" value={captureEmail} onChange={e => setCaptureEmail(e.target.value)}
                className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none" />
              <select value={captureSource} onChange={e => setCaptureSource(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
                <option value="forum" className="bg-slate-800">Forum</option>
                <option value="facebook" className="bg-slate-800">Facebook</option>
                <option value="whatsapp" className="bg-slate-800">WhatsApp</option>
                <option value="event" className="bg-slate-800">Événement</option>
                <option value="other" className="bg-slate-800">Autre</option>
              </select>
              <button onClick={handleCapture} disabled={!captureEmail.trim()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                Ajouter
              </button>
            </div>
          </div>

          {/* Liste des emails capturés */}
          {capturedEmails.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
              <h3 className="text-sm font-bold text-white mb-3">Emails capturés ({capturedEmails.length})</h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {capturedEmails.map((e, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                    <div>
                      <p className="text-sm text-white">{e.email}</p>
                      <p className="text-xs text-slate-500">{e.source} · {timeAgo(e.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
