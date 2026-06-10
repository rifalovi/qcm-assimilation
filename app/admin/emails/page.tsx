"use client";

import { useEffect, useState } from "react";

type EmailStep = 1 | 2 | 3 | 4 | 5;
type TemplateInfo = { step: number; label: string; delay_days: number };
type StepInfo = { step: number; status: string | null; scheduled_at: string | null; sent_at: string | null };
type UserSeq = {
  id: string; username: string; email: string | null; role: string;
  created_at: string; steps: StepInfo[]; last_step_sent: number;
};
type Stats = {
  total_users: number; with_sequence: number; without_sequence: number;
  total_sent: number; total_pending: number; total_failed: number;
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

type Tab = "users" | "templates" | "bulk" | "capture" | "share";

export default function AdminEmailsPage() {
  const [users, setUsers] = useState<UserSeq[]>([]);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
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
  const [shareCampaign, setShareCampaign] = useState("whatsapp_group");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedStep, setSelectedStep] = useState<EmailStep>(1);
  const [sendMode, setSendMode] = useState<"template" | "custom">("template");
  const [aiTheme, setAiTheme] = useState("bienvenue");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState<{ subject: string; html: string } | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<{ id: string; theme: string; subject: string; html_content: string; created_at: string }[]>([]);

  const [apiError, setApiError] = useState<string | null>(null);

  async function loadData(p = page, q = searchDebounced) {
    setLoading(true);
    setApiError(null);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set('search', q);
      const res = await fetch(`/api/admin/email-sequences?${params}`);
      const json = await res.json();
      if (!res.ok) {
        setApiError(json.error ?? `Erreur ${res.status}`);
        return;
      }
      setUsers(json.users ?? []);
      setTemplates(json.templates ?? []);
      setStats(json.stats ?? null);
      setTotalUsers(json.pagination?.total ?? 0);
    } catch (e) {
      setApiError(`Erreur réseau: ${e}`);
    }
    finally { setLoading(false); }
  }

  async function loadSavedTemplates() {
    const res = await fetch("/api/admin/email-sequences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list_templates" }),
    });
    const json = await res.json();
    setSavedTemplates(json.templates ?? []);
  }

  async function loadCaptured() {
    const res = await fetch("/api/admin/email-sequences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_captured_emails" }),
    });
    const json = await res.json();
    setCapturedEmails(json.emails ?? []);
  }

  useEffect(() => { loadData(page, searchDebounced); }, [page, searchDebounced]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearchDebounced(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

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
    setBulkResult(`Envoyé : ${json.sent}/${json.total} — Échecs : ${json.failed}${json.firstError ? `\nErreur : ${json.firstError}` : ''}`);
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

  async function sendTemplateToSelected() {
    if (selectedUsers.size === 0) return;
    setSending("tpl-selected");
    let sent = 0, failed = 0;
    for (const uid of Array.from(selectedUsers)) {
      const res = await fetch("/api/admin/email-sequences", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_email", user_id: uid, step: selectedStep }),
      });
      const json = await res.json();
      if (json.success) sent++; else failed++;
    }
    alert(`Template J${[1,3,7,14,30][selectedStep-1]} envoyé : ${sent}/${selectedUsers.size} — Échecs : ${failed}`);
    setSending(null);
    await loadData();
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

  // Filtrage côté serveur via pagination — on affiche directement users
  const filtered = users;
  const totalPages = Math.ceil(totalUsers / 30);

  const STEP_LABELS: Record<number, string> = {
    1: "J1 — Bienvenue", 2: "J3 — Conseil", 3: "J7 — Progression",
    4: "J14 — Offre", 5: "J30 — Dernier message",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="adm-title">CRM — Emails</h1>
        <p className="adm-subtitle">Séquences, envoi groupé, capture et modération</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { l: "Utilisateurs", v: stats.total_users, c: "border-[var(--cc-primary)] bg-[var(--cc-info-soft)] text-[var(--cc-primary)]" },
            { l: "Avec séquence", v: stats.with_sequence, c: "border-[var(--cc-success)] bg-[var(--cc-success-soft)] text-[var(--cc-success)]" },
            { l: "Sans séquence", v: stats.without_sequence, c: "border-[var(--cc-warning)] bg-[var(--cc-warning-soft)] text-[var(--cc-warning)]" },
            { l: "Emails envoyés", v: stats.total_sent, c: "border-[var(--cc-primary)] bg-[var(--cc-info-soft)] text-[var(--cc-primary)]" },
            { l: "En attente", v: stats.total_pending, c: "border-[var(--cc-border)] bg-[var(--cc-surface-alt)] text-[var(--cc-text)]" },
            { l: "Échoués", v: stats.total_failed, c: "border-[var(--cc-danger)] bg-[var(--cc-danger-soft)] text-[var(--cc-danger)]" },
          ].map(s => (
            <div key={s.l} className={`rounded-2xl border p-3 ${s.c}`}>
              <p className="text-xs opacity-80">{s.l}</p>
              <p className="text-xl font-extrabold mt-0.5">{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1.5 border-b border-[var(--cc-border)] pb-2">
        {([
          { id: "users" as Tab, label: "Utilisateurs" },
          { id: "templates" as Tab, label: "Templates" },
          { id: "bulk" as Tab, label: "Envoi groupé" },
          { id: "capture" as Tab, label: "Capture emails" },
          { id: "share" as Tab, label: "Lien de partage" },
        ]).map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "capture") loadCaptured(); if (t.id === "templates") loadSavedTemplates(); }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${tab === t.id ? "bg-[var(--cc-info-soft)] border border-[var(--cc-primary)] text-[var(--cc-primary)]" : "text-[var(--cc-text-muted)] hover:text-[var(--cc-text)]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: UTILISATEURS ── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-[var(--cc-primary)]" style={{ color: 'var(--cc-text)' }} />
            <button onClick={() => {
              if (selectedUsers.size === filtered.length) setSelectedUsers(new Set());
              else setSelectedUsers(new Set(filtered.map(u => u.id)));
            }} className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-1.5 text-xs hover:text-[var(--cc-text)] transition" style={{ color: 'var(--cc-text-muted)' }}>
              {selectedUsers.size === filtered.length && filtered.length > 0 ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
            <div className="flex gap-1.5">
              {(["all", "no_sequence", "active", "completed"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-[var(--cc-info-soft)] border border-[var(--cc-primary)] text-[var(--cc-primary)]" : "border border-[var(--cc-border)] bg-[var(--cc-surface)] text-[var(--cc-text-muted)] hover:text-[var(--cc-text)]"}`}>
                  {f === "all" ? "Tous" : f === "no_sequence" ? "Sans séquence" : f === "active" ? "Actifs" : "Terminés"}
                </button>
              ))}
            </div>
          </div>

          {apiError && (
            <div className="rounded-xl border border-[var(--cc-danger)] bg-[var(--cc-danger-soft)] px-4 py-3 text-sm text-[var(--cc-danger)]">
              Erreur API : {apiError}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--cc-primary)] border-t-transparent" /></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(user => (
                <div key={user.id} className="adm-panel p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedUsers.has(user.id)}
                          onChange={e => { const s = new Set(selectedUsers); e.target.checked ? s.add(user.id) : s.delete(user.id); setSelectedUsers(s); }}
                          className="rounded border-[var(--cc-border-strong)] bg-[var(--cc-surface)]" />
                        <p className="text-sm font-semibold" style={{ color: 'var(--cc-text)' }}>{user.username ?? "—"}</p>
                        <span className={`cc-badge cc-badge-sm ${user.role === 'premium' || user.role === 'elite' ? 'cc-badge-warning' : 'cc-badge-neutral'}`}>{user.role}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>{user.email ?? "—"} · inscrit il y a {timeAgo(user.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {user.steps.every(s => !s.status) && (
                        <button onClick={() => triggerSequence(user.id)} disabled={sending === `seq-${user.id}`}
                          className="rounded-xl border border-[var(--cc-primary)] bg-[var(--cc-info-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--cc-primary)] hover:bg-[var(--cc-info-soft)] disabled:opacity-50">
                          {sending === `seq-${user.id}` ? "..." : "Lancer séquence"}
                        </button>
                      )}
                      <select
                        onChange={e => { const step = Number(e.target.value) as EmailStep; if (step) sendEmail(user.id, step); e.target.value = ""; }}
                        className="rounded-xl border border-[var(--cc-success)] bg-[var(--cc-success-soft)] px-2 py-1.5 text-xs font-semibold text-[var(--cc-success)] focus:outline-none cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled style={{ background: 'var(--cc-surface-alt)' }}>Envoyer ▾</option>
                        {([1,2,3,4,5] as EmailStep[]).map(s => (
                          <option key={s} value={s} style={{ background: 'var(--cc-surface-alt)' }}>{STEP_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Étapes */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {user.steps.map(s => {
                      const isSending = sending === `${user.id}-${s.step}`;
                      return (
                        <div key={s.step} className="flex items-center gap-1">
                          <div className={`rounded-lg border px-2 py-1 text-[10px] ${
                            s.status === 'sent' ? 'border-[var(--cc-success)] bg-[var(--cc-success-soft)] text-[var(--cc-success)]' :
                            s.status === 'pending' ? 'border-[var(--cc-warning)] bg-[var(--cc-warning-soft)] text-[var(--cc-warning)]' :
                            s.status === 'failed' ? 'border-[var(--cc-danger)] bg-[var(--cc-danger-soft)] text-[var(--cc-danger)]' :
                            'border-[var(--cc-border)] bg-[var(--cc-surface)] text-[var(--cc-text-disabled)]'
                          }`}>
                            <span className="font-bold">J{[1,3,7,14,30][s.step-1]}</span>
                            {s.status === 'sent' && <span className="ml-1">✓</span>}
                            {s.status === 'pending' && s.scheduled_at && (
                              <span className="ml-1 opacity-70">{new Date(s.scheduled_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                            )}
                          </div>
                          <button onClick={() => sendEmail(user.id, s.step as EmailStep)} disabled={isSending}
                            className="rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-1.5 py-1 text-[10px] text-[var(--cc-text-muted)] hover:bg-[var(--cc-surface-raised)] hover:text-[var(--cc-text)] disabled:opacity-50"
                            title={`Envoyer ${STEP_LABELS[s.step]}`}>
                            {isSending ? "..." : "→"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm py-8" style={{ color: 'var(--cc-text-muted)' }}>Aucun utilisateur trouvé</p>
              )}
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                    className="rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-1.5 text-xs text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] disabled:opacity-30">← Précédent</button>
                  <span className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Page {page + 1} / {totalPages}</span>
                  <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                    className="rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-1.5 text-xs text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] disabled:opacity-30">Suivant →</button>
                </div>
              )}
            </div>
          )}

          {/* Barre d'action — sélection */}
          {selectedUsers.size > 0 && (
            <div className="rounded-2xl border border-[var(--cc-primary)] bg-[var(--cc-info-soft)] p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-bold text-[var(--cc-primary)]">{selectedUsers.size} utilisateur(s) sélectionné(s)</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setSendMode("template")}
                    className={`adm-chip ${sendMode === "template" ? "adm-chip-active" : ""}`}>
                    Envoyer un template
                  </button>
                  <button onClick={() => setSendMode("custom")}
                    className={`adm-chip ${sendMode === "custom" ? "adm-chip-active" : ""}`}>
                    Email personnalisé
                  </button>
                </div>
              </div>

              {sendMode === "template" ? (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs mb-1 block" style={{ color: 'var(--cc-text-muted)' }}>Template</label>
                    <select value={selectedStep} onChange={e => setSelectedStep(Number(e.target.value) as EmailStep)}
                      className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }}>
                      {([1,2,3,4,5] as EmailStep[]).map(s => (
                        <option key={s} value={s} style={{ background: 'var(--cc-surface-alt)' }}>{STEP_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={sendTemplateToSelected} disabled={sending === "tpl-selected"}
                    className="cc-btn cc-btn-primary cc-btn-sm">
                    {sending === "tpl-selected" ? "Envoi..." : `Envoyer J${[1,3,7,14,30][selectedStep-1]} →`}
                  </button>
                </div>
              ) : (
                <>
                  <input type="text" placeholder="Objet de l'email..." value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                    className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }} />
                  <textarea placeholder="Contenu HTML de l'email..." value={customContent} onChange={e => setCustomContent(e.target.value)}
                    className="w-full min-h-[80px] rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ resize: 'vertical', color: 'var(--cc-text)' }} />
                  <button onClick={sendCustomEmail} disabled={!customSubject.trim() || !customContent.trim() || sending === "custom"}
                    className="cc-btn cc-btn-primary cc-btn-sm">
                    {sending === "custom" ? "Envoi..." : "Envoyer l'email personnalisé →"}
                  </button>
                </>
              )}

              <button onClick={() => setSelectedUsers(new Set())}
                className="text-xs transition hover:text-[var(--cc-text)]" style={{ color: 'var(--cc-text-disabled)' }}>
                Tout désélectionner
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: TEMPLATES ── */}
      {tab === "templates" && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--cc-text-muted)' }}>Cliquez sur un template pour voir son contenu. Les templates sont codés dans <code style={{ color: 'var(--cc-text)' }}>src/lib/emailTemplates.ts</code>.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map(t => (
              <button key={t.step} onClick={() => previewTemplate(t.step as EmailStep)}
                className="adm-panel p-4 text-left hover:border-[var(--cc-primary)] transition">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                    t.step <= 2 ? 'bg-[var(--cc-info-soft)] text-[var(--cc-primary)]' : t.step <= 4 ? 'bg-[var(--cc-warning-soft)] text-[var(--cc-warning)]' : 'bg-[var(--cc-success-soft)] text-[var(--cc-success)]'
                  }`}>{t.step}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--cc-text)' }}>{t.label}</p>
                    <p className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Envoyé J+{t.delay_days} après inscription</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Preview */}
          {previewHtml && (
            <div className="adm-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color: 'var(--cc-text)' }}>Aperçu : {previewSubject}</p>
                <button onClick={() => setPreviewHtml(null)} className="text-xs hover:text-[var(--cc-text)]" style={{ color: 'var(--cc-text-muted)' }}>✕ Fermer</button>
              </div>
              <div className="rounded-xl border border-[var(--cc-border)] bg-white overflow-hidden">
                <iframe srcDoc={previewHtml} sandbox="" className="w-full h-[500px] border-0" title="Preview" />
              </div>
            </div>
          )}

          {/* Générer un template avec IA */}
          <div className="rounded-2xl border border-[var(--cc-primary)] bg-[var(--cc-primary-soft)] p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--cc-primary)]">Générer un template avec IA</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs mb-1 block" style={{ color: 'var(--cc-text-muted)' }}>Thème</label>
                <select value={aiTheme} onChange={e => setAiTheme(e.target.value)}
                  className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }}>
                  <option value="bienvenue" style={{ background: 'var(--cc-surface-alt)' }}>Bienvenue / Onboarding</option>
                  <option value="relance" style={{ background: 'var(--cc-surface-alt)' }}>Relance utilisateur inactif</option>
                  <option value="promotion" style={{ background: 'var(--cc-surface-alt)' }}>Promotion Premium</option>
                  <option value="conseil" style={{ background: 'var(--cc-surface-alt)' }}>Conseil du jour</option>
                  <option value="nouveaute" style={{ background: 'var(--cc-surface-alt)' }}>Nouvelle fonctionnalité</option>
                </select>
              </div>
              <button
                onClick={async () => {
                  setAiGenerating(true); setAiGenerated(null);
                  try {
                    const res = await fetch("/api/ai", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        mode: "assistant",
                        category: "Génération email",
                        userQuestion: `Génère un email marketing pour Cap Citoyen sur le thème "${aiTheme}". L'email doit être engageant, utiliser un ton chaleureux, mentionner les fonctionnalités IA (Coach IA, Assistant démarches, Explications IA). Retourne le résultat avec summary = objet de l'email, what_to_do = contenu HTML complet de l'email (avec balises HTML inline style, fond sombre #0f172a, texte clair). what_it_means et watch_out peuvent être vides.`,
                      }),
                    });
                    const json = await res.json();
                    const d = json.data;
                    setAiGenerated({ subject: d?.summary ?? "Email généré", html: d?.what_to_do ?? "<p>Contenu généré</p>" });
                  } catch { alert("Erreur de génération"); }
                  finally { setAiGenerating(false); }
                }}
                disabled={aiGenerating}
                className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold hover:bg-violet-500 disabled:opacity-50" style={{ color: '#fff' }}>
                {aiGenerating ? "Génération..." : "Générer avec IA"}
              </button>
            </div>

            {aiGenerated && (
              <div className="space-y-2 mt-3">
                <p className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Objet : <span className="font-medium" style={{ color: 'var(--cc-text)' }}>{aiGenerated.subject}</span></p>
                <div className="rounded-xl border border-[var(--cc-border)] bg-white overflow-hidden">
                  <iframe srcDoc={aiGenerated.html} sandbox="" className="w-full h-[350px] border-0" title="AI Preview" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={async () => {
                    await fetch("/api/admin/email-sequences", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "save_template", theme: aiTheme, subject: aiGenerated.subject, html_content: aiGenerated.html }),
                    });
                    loadSavedTemplates();
                  }} className="cc-btn cc-btn-primary cc-btn-sm">
                    Sauvegarder
                  </button>
                  <button onClick={() => { setCustomSubject(aiGenerated.subject); setCustomContent(aiGenerated.html); setTab("users"); setSendMode("custom"); }}
                    className="rounded-xl border border-[var(--cc-primary)] bg-[var(--cc-primary-soft)] px-4 py-2 text-xs font-semibold text-[var(--cc-primary)] hover:bg-[var(--cc-primary-soft)]">
                    Utiliser comme email →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Templates sauvegardés */}
          {savedTemplates.length > 0 && (
            <div className="adm-panel p-5 space-y-3">
              <h2 className="text-sm font-bold" style={{ color: 'var(--cc-text)' }}>Templates IA sauvegardés ({savedTemplates.length})</h2>
              <div className="space-y-2">
                {savedTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--cc-text)' }}>{t.subject}</p>
                      <p className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>{t.theme} · {new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => { setPreviewSubject(t.subject); setPreviewHtml(t.html_content); }}
                        className="rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-2.5 py-1 text-[10px] hover:text-[var(--cc-text)]" style={{ color: 'var(--cc-text-muted)' }}>Voir</button>
                      <button onClick={() => { setCustomSubject(t.subject); setCustomContent(t.html_content); setTab("users"); setSendMode("custom"); }}
                        className="rounded-lg border border-[var(--cc-primary)] bg-[var(--cc-info-soft)] px-2.5 py-1 text-[10px] text-[var(--cc-primary)]">Utiliser</button>
                      <button onClick={async () => {
                        if (!confirm("Supprimer ce template ?")) return;
                        await fetch("/api/admin/email-sequences", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "delete_template", template_id: t.id }),
                        });
                        loadSavedTemplates();
                      }} className="rounded-lg border border-[var(--cc-danger)] bg-[var(--cc-danger-soft)] px-2.5 py-1 text-[10px] text-[var(--cc-danger)]">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ENVOI GROUPÉ ── */}
      {tab === "bulk" && (
        <div className="space-y-4">
          <div className="adm-panel p-5 space-y-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--cc-text)' }}>Envoyer un email de séquence en masse</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--cc-text-muted)' }}>Email à envoyer</label>
                <select value={bulkStep} onChange={e => setBulkStep(Number(e.target.value) as EmailStep)}
                  className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }}>
                  {([1,2,3,4,5] as EmailStep[]).map(s => (
                    <option key={s} value={s} style={{ background: 'var(--cc-surface-alt)' }}>{STEP_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--cc-text-muted)' }}>Cible</label>
                <select value={bulkTarget} onChange={e => setBulkTarget(e.target.value as typeof bulkTarget)}
                  className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }}>
                  <option value="no_sequence" style={{ background: 'var(--cc-surface-alt)' }}>Sans cette étape</option>
                  <option value="all" style={{ background: 'var(--cc-surface-alt)' }}>Tous les utilisateurs</option>
                  <option value="freemium" style={{ background: 'var(--cc-surface-alt)' }}>Freemium uniquement</option>
                  <option value="premium" style={{ background: 'var(--cc-surface-alt)' }}>Premium / Élite</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={sendBulk} disabled={sending === "bulk"}
                className="cc-btn cc-btn-primary cc-btn-sm">
                {sending === "bulk" ? "Envoi en cours..." : "Lancer l'envoi groupé"}
              </button>
              <button onClick={() => previewTemplate(bulkStep)}
                className="cc-btn cc-btn-secondary cc-btn-sm">
                Prévisualiser
              </button>
            </div>

            {bulkResult && (
              <div className="rounded-xl border border-[var(--cc-success)] bg-[var(--cc-success-soft)] px-4 py-3 text-sm text-[var(--cc-success)]">
                {bulkResult}
              </div>
            )}
          </div>

          {/* Preview inline */}
          {previewHtml && (
            <div className="adm-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color: 'var(--cc-text)' }}>{previewSubject}</p>
                <button onClick={() => setPreviewHtml(null)} className="text-xs hover:text-[var(--cc-text)]" style={{ color: 'var(--cc-text-muted)' }}>✕</button>
              </div>
              <div className="rounded-xl border border-[var(--cc-border)] bg-white overflow-hidden">
                <iframe srcDoc={previewHtml} sandbox="" className="w-full h-[400px] border-0" title="Preview" />
              </div>
            </div>
          )}

          {/* Lien d'invitation à partager */}
          <div className="adm-panel p-5 space-y-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--cc-text)' }}>Lien d'invitation à partager</h2>
            <p className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Copiez ce lien et partagez-le dans vos groupes pour inviter des candidats à tester Cap Citoyen.</p>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value="https://cap-citoyen.fr/?utm_source=email&utm_campaign=invite"
                className="flex-1 rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }} />
              <button onClick={() => navigator.clipboard.writeText("https://cap-citoyen.fr/?utm_source=email&utm_campaign=invite")}
                className="cc-btn cc-btn-primary cc-btn-sm shrink-0">
                Copier
              </button>
            </div>
            <div className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-3">
              <p className="text-xs mb-1" style={{ color: 'var(--cc-text-muted)' }}>Message prêt à coller (WhatsApp / Facebook)</p>
              <p className="text-sm whitespace-pre-line" style={{ color: 'var(--cc-text)' }}>{"🇫🇷 Tu prépares ton examen civique ou ta naturalisation ?\n\nTeste Cap Citoyen gratuitement : quiz, audio, assistant IA démarches.\n\n👉 https://cap-citoyen.fr/?utm_source=email&utm_campaign=invite"}</p>
              <button onClick={() => navigator.clipboard.writeText("🇫🇷 Tu prépares ton examen civique ou ta naturalisation ?\n\nTeste Cap Citoyen gratuitement : quiz, audio, assistant IA démarches.\n\n👉 https://cap-citoyen.fr/?utm_source=email&utm_campaign=invite")}
                className="mt-2 text-xs text-[var(--cc-primary)] hover:text-[var(--cc-primary-hover)]">Copier ce message</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CAPTURE EMAILS ── */}
      {tab === "capture" && (
        <div className="space-y-4">
          <div className="adm-panel p-5 space-y-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--cc-text)' }}>Capturer un email</h2>
            <p className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Ajoutez des emails récupérés sur les forums, réseaux sociaux ou événements.</p>
            <div className="flex flex-wrap gap-3">
              <input type="email" placeholder="email@exemple.com" value={captureEmail} onChange={e => setCaptureEmail(e.target.value)}
                className="flex-1 min-w-[200px] rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }} />
              <select value={captureSource} onChange={e => setCaptureSource(e.target.value)}
                className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }}>
                <option value="forum" style={{ background: 'var(--cc-surface-alt)' }}>Forum</option>
                <option value="facebook" style={{ background: 'var(--cc-surface-alt)' }}>Facebook</option>
                <option value="whatsapp" style={{ background: 'var(--cc-surface-alt)' }}>WhatsApp</option>
                <option value="event" style={{ background: 'var(--cc-surface-alt)' }}>Événement</option>
                <option value="other" style={{ background: 'var(--cc-surface-alt)' }}>Autre</option>
              </select>
              <button onClick={handleCapture} disabled={!captureEmail.trim()}
                className="cc-btn cc-btn-primary cc-btn-sm">
                Ajouter
              </button>
            </div>
          </div>

          {/* Liste des emails capturés */}
          {capturedEmails.length > 0 && (
            <div className="adm-panel p-4">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--cc-text)' }}>Emails capturés ({capturedEmails.length})</h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {capturedEmails.map((e, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2">
                    <div>
                      <p className="text-sm" style={{ color: 'var(--cc-text)' }}>{e.email}</p>
                      <p className="text-xs" style={{ color: 'var(--cc-text-disabled)' }}>{e.source} · {timeAgo(e.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: LIEN DE PARTAGE ── */}
      {tab === "share" && (
        <div className="space-y-4">
          <div className="adm-panel p-5 space-y-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--cc-text)' }}>Générer un lien d'invitation</h2>
            <p className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Créez un lien avec UTM tracking à partager dans les groupes WhatsApp, Facebook, forums, etc.</p>

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--cc-text-muted)' }}>Campagne / Source</label>
              <select value={shareCampaign} onChange={e => setShareCampaign(e.target.value)}
                className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }}>
                <option value="whatsapp_group" style={{ background: 'var(--cc-surface-alt)' }}>Groupe WhatsApp</option>
                <option value="facebook_group" style={{ background: 'var(--cc-surface-alt)' }}>Groupe Facebook</option>
                <option value="forum_immigration" style={{ background: 'var(--cc-surface-alt)' }}>Forum immigration</option>
                <option value="telegram" style={{ background: 'var(--cc-surface-alt)' }}>Telegram</option>
                <option value="flyer_event" style={{ background: 'var(--cc-surface-alt)' }}>Flyer / Événement</option>
                <option value="email_signature" style={{ background: 'var(--cc-surface-alt)' }}>Signature email</option>
                <option value="custom" style={{ background: 'var(--cc-surface-alt)' }}>Personnalisé</option>
              </select>
              {shareCampaign === "custom" && (
                <input type="text" placeholder="Nom de la campagne..." value={shareCampaign} onChange={e => setShareCampaign(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }} />
              )}
            </div>

            <button
              onClick={() => {
                const link = `https://cap-citoyen.fr/?utm_source=referral&utm_campaign=${shareCampaign}&utm_medium=social`;
                setShareLink(link);
              }}
              className="cc-btn cc-btn-primary cc-btn-sm">
              Générer le lien
            </button>
          </div>

          {shareLink && (
            <div className="rounded-2xl border border-[var(--cc-success)] bg-[var(--cc-success-soft)] p-5 space-y-4">
              <p className="text-xs font-bold text-[var(--cc-success)] uppercase tracking-wider">Lien généré</p>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={shareLink}
                  className="flex-1 rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none" style={{ color: 'var(--cc-text)' }} />
                <button onClick={() => { navigator.clipboard.writeText(shareLink); }}
                  className="cc-btn cc-btn-primary cc-btn-sm">
                  Copier
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold" style={{ color: 'var(--cc-text)' }}>Messages prêts à copier :</p>

                <div className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-3">
                  <p className="text-xs mb-1" style={{ color: 'var(--cc-text-muted)' }}>WhatsApp / Telegram</p>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'var(--cc-text)' }}>{"🇫🇷 Tu prépares ton examen civique ou ta naturalisation ?\n\nJ'ai trouvé une super app gratuite — Cap Citoyen.\n800+ questions, audio guidé, examen blanc, et un assistant IA qui répond à tes questions sur les démarches.\n\n👉 " + shareLink}</p>
                  <button onClick={() => navigator.clipboard.writeText("🇫🇷 Tu prépares ton examen civique ou ta naturalisation ?\n\nJ'ai trouvé une super app gratuite — Cap Citoyen.\n800+ questions, audio guidé, examen blanc, et un assistant IA qui répond à tes questions sur les démarches.\n\n👉 " + shareLink)}
                    className="mt-2 text-xs text-[var(--cc-primary)] hover:text-[var(--cc-primary-hover)]">Copier ce message</button>
                </div>

                <div className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-3">
                  <p className="text-xs mb-1" style={{ color: 'var(--cc-text-muted)' }}>Facebook</p>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'var(--cc-text)' }}>{"Vous préparez votre entretien civique pour la naturalisation ? 🇫🇷\n\nCap Citoyen est une plateforme gratuite avec :\n✅ Quiz et examen blanc\n✅ 100 épisodes audio\n✅ Assistant IA pour vos démarches\n✅ Coach IA personnalisé\n\nTestez gratuitement → " + shareLink}</p>
                  <button onClick={() => navigator.clipboard.writeText("Vous préparez votre entretien civique pour la naturalisation ? 🇫🇷\n\nCap Citoyen est une plateforme gratuite avec :\n✅ Quiz et examen blanc\n✅ 100 épisodes audio\n✅ Assistant IA pour vos démarches\n✅ Coach IA personnalisé\n\nTestez gratuitement → " + shareLink)}
                    className="mt-2 text-xs text-[var(--cc-primary)] hover:text-[var(--cc-primary-hover)]">Copier ce message</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
