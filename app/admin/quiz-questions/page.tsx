"use client";

import { useEffect, useState } from "react";
import { parseCSV, toCSV, downloadCSV } from "@/lib/csv";

type QuizQuestion = {
  id: string;
  external_id: string | null;
  level: 1 | 2 | 3;
  theme: string;
  question: string;
  choice_a: string; choice_b: string; choice_c: string; choice_d: string;
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  status: "active" | "draft" | "archived";
  created_at: string;
};

type Stats = { level1: number; level2: number; level3: number; active: number; draft: number };

const THEMES = ["Valeurs", "Institutions", "Histoire", "Société"];
const LEVELS = [1, 2, 3];
const STATUSES = ["active", "draft", "archived"];

function emptyQ(): Omit<QuizQuestion, "id" | "created_at"> {
  return {
    external_id: null, level: 1, theme: "Valeurs", question: "",
    choice_a: "", choice_b: "", choice_c: "", choice_d: "",
    answer: "A", explanation: "", status: "active",
  };
}

export default function AdminQuizQuestionsPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterTheme, setFilterTheme] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "level_asc" | "level_desc" | "theme" | "external_id">("external_id");
  const [editing, setEditing] = useState<QuizQuestion | Omit<QuizQuestion, "id" | "created_at"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort });
    if (filterLevel) params.set("level", filterLevel);
    if (filterTheme) params.set("theme", filterTheme);
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/quiz-questions?${params}`);
    const json = await res.json();
    if (!res.ok) { setError(json.error); setLoading(false); return; }
    setQuestions(json.questions);
    setTotal(json.total);
    setStats(json.stats);
    setError(null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, filterLevel, filterTheme, filterStatus, sort]);
  useEffect(() => { const t = setTimeout(() => { setPage(0); load(); }, 400); return () => clearTimeout(t); }, [search]);

  async function save() {
    if (!editing) return;
    const isNew = !("id" in editing);
    const res = await fetch("/api/admin/quiz-questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isNew ? "create" : "update", ...editing }),
    });
    const json = await res.json();
    if (!res.ok) { alert("Erreur : " + json.error); return; }
    setEditing(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("Supprimer cette question ?")) return;
    await fetch("/api/admin/quiz-questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    load();
  }

  async function migrateFromFiles() {
    if (!confirm("Importer les QCM depuis les fichiers statiques ? (upsert par external_id, pas de doublons)")) return;
    setMigrating(true);
    const res = await fetch("/api/admin/quiz-questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "migrate_from_files" }),
    });
    const json = await res.json();
    if (res.ok) {
      const dupMsg = json.duplicates_skipped > 0 ? ` (${json.duplicates_skipped} doublons d'ID ignorés)` : '';
      alert(`✓ ${json.migrated} QCM importés sur ${json.total_in_files}${dupMsg}`);
    } else alert("Erreur : " + json.error);
    setMigrating(false);
    load();
  }

  async function exportCSV() {
    const res = await fetch("/api/admin/quiz-questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export_csv" }),
    });
    const json = await res.json();
    downloadCSV(`quiz-questions-${new Date().toISOString().slice(0,10)}.csv`,
      toCSV(json.rows, ["external_id", "level", "theme", "question", "choice_a", "choice_b", "choice_c", "choice_d", "answer", "explanation", "status"]));
  }

  async function importCSV(file: File) {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) { alert("CSV vide"); return; }
    const res = await fetch("/api/admin/quiz-questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import_csv", rows }),
    });
    const json = await res.json();
    alert(res.ok ? `${json.inserted} QCM importés` : "Erreur : " + json.error);
    load();
  }

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="adm-title">QCM Tests & Examens</h1>
        <p className="adm-subtitle">{total} questions au total — sert les pages /quiz et /exam</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            { l: "Niveau 1", v: stats.level1, c: "border-blue-400/20 bg-blue-500/10 text-blue-100" },
            { l: "Niveau 2", v: stats.level2, c: "border-violet-400/20 bg-violet-500/10 text-violet-100" },
            { l: "Niveau 3", v: stats.level3, c: "border-amber-400/20 bg-amber-500/10 text-amber-100" },
            { l: "Actives", v: stats.active, c: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" },
            { l: "Brouillons", v: stats.draft, c: "adm-panel" },
          ].map(s => (
            <div key={s.l} className={`rounded-2xl border p-3 ${s.c}`}>
              <p className="text-xs opacity-80">{s.l}</p>
              <p className="text-xl font-extrabold mt-0.5">{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Import initial */}
      {total === 0 && !loading && (
        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-bold text-violet-200">Base vide — Importer les QCM existants</p>
            <p className="text-xs text-violet-300/70 mt-0.5">458 QCM sont définis dans les fichiers statiques. Cliquez pour les importer en base.</p>
          </div>
          <button onClick={migrateFromFiles} disabled={migrating}
            className="cc-btn cc-btn-primary cc-btn-sm disabled:opacity-50">
            {migrating ? "Import..." : "Importer depuis les fichiers"}
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <input placeholder="Rechercher (énoncé, choix, explication, ID)..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none flex-1 min-w-[260px]"
          style={{ color: 'var(--cc-text)' }} />
        <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(0); }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
          style={{ color: 'var(--cc-text)' }}>
          <option value="" style={{ background: 'var(--cc-surface-alt)' }}>Tous niveaux</option>
          {LEVELS.map(l => <option key={l} value={l} style={{ background: 'var(--cc-surface-alt)' }}>Niveau {l}</option>)}
        </select>
        <select value={filterTheme} onChange={e => { setFilterTheme(e.target.value); setPage(0); }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
          style={{ color: 'var(--cc-text)' }}>
          <option value="" style={{ background: 'var(--cc-surface-alt)' }}>Tous thèmes</option>
          {THEMES.map(t => <option key={t} value={t} style={{ background: 'var(--cc-surface-alt)' }}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
          style={{ color: 'var(--cc-text)' }}>
          <option value="" style={{ background: 'var(--cc-surface-alt)' }}>Tous statuts</option>
          {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--cc-surface-alt)' }}>{s}</option>)}
        </select>
        <select value={sort} onChange={e => { setSort(e.target.value as typeof sort); setPage(0); }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
          style={{ color: 'var(--cc-text)' }}>
          <option value="external_id" style={{ background: 'var(--cc-surface-alt)' }}>ID (v1-001...)</option>
          <option value="newest" style={{ background: 'var(--cc-surface-alt)' }}>Plus récent</option>
          <option value="level_asc" style={{ background: 'var(--cc-surface-alt)' }}>Niveau ↑</option>
          <option value="level_desc" style={{ background: 'var(--cc-surface-alt)' }}>Niveau ↓</option>
          <option value="theme" style={{ background: 'var(--cc-surface-alt)' }}>Par thème</option>
        </select>
        <button onClick={() => setEditing(emptyQ())}
          className="cc-btn cc-btn-primary cc-btn-sm">+ Nouvelle</button>
        <button onClick={exportCSV}
          className="cc-btn cc-btn-secondary cc-btn-sm">Export CSV</button>
        <label className="cc-btn cc-btn-secondary cc-btn-sm cursor-pointer">
          Import CSV
          <input type="file" accept=".csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importCSV(f); }} />
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Erreur : {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /></div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className="adm-panel p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="cc-badge cc-badge-sm cc-badge-info">N{q.level}</span>
                    <span className="cc-badge cc-badge-sm cc-badge-neutral">{q.theme}</span>
                    <span className={`cc-badge cc-badge-sm ${
                      q.status === 'active' ? 'cc-badge-success' :
                      q.status === 'draft' ? 'cc-badge-warning' :
                      'cc-badge-neutral'
                    }`}>{q.status}</span>
                    {q.external_id && <span className="text-[10px] font-mono" style={{ color: 'var(--cc-text-disabled)' }}>{q.external_id}</span>}
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--cc-text)' }}>{q.question}</p>
                  {q.answer && (
                    <p className="text-xs text-emerald-300 mt-1">
                      ✓ {q.answer}) {q[`choice_${q.answer.toLowerCase()}` as "choice_a"] ?? ""}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => setEditing(q)} className="adm-action">Éditer</button>
                  <button onClick={() => del(q.id)} className="adm-action adm-action-danger">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
          {questions.length === 0 && !error && (
            <p className="text-center text-sm py-8" style={{ color: 'var(--cc-text-muted)' }}>Aucune question trouvée</p>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="adm-action">← Précédent</button>
              <span className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Page {page + 1} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                className="adm-action">Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* Modal édition */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto adm-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--cc-text)' }}>{("id" in editing) ? `Éditer ${editing.external_id ?? ""}` : "Nouvelle question"}</h2>
              <button onClick={() => setEditing(null)} style={{ color: 'var(--cc-text-muted)' }}>✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Niveau</label>
                <select value={editing.level} onChange={e => setEditing({ ...editing, level: Number(e.target.value) as 1 | 2 | 3 })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
                  style={{ color: 'var(--cc-text)' }}>
                  {LEVELS.map(l => <option key={l} value={l} style={{ background: 'var(--cc-surface-alt)' }}>Niveau {l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Thème</label>
                <select value={editing.theme} onChange={e => setEditing({ ...editing, theme: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
                  style={{ color: 'var(--cc-text)' }}>
                  {THEMES.map(t => <option key={t} value={t} style={{ background: 'var(--cc-surface-alt)' }}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Statut</label>
                <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as QuizQuestion["status"] })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
                  style={{ color: 'var(--cc-text)' }}>
                  {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--cc-surface-alt)' }}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>ID externe (optionnel, ex: v1-001)</label>
              <input value={editing.external_id ?? ""} onChange={e => setEditing({ ...editing, external_id: e.target.value || null })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none font-mono"
                style={{ color: 'var(--cc-text)' }} />
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Énoncé</label>
              <textarea value={editing.question ?? ""} onChange={e => setEditing({ ...editing, question: e.target.value })}
                className="w-full min-h-[80px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
                style={{ color: 'var(--cc-text)' }} />
            </div>
            {(["a", "b", "c", "d"] as const).map(k => (
              <div key={k} className="flex gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-sm font-bold" style={{ color: 'var(--cc-text)' }}>{k.toUpperCase()}</div>
                <input value={editing[`choice_${k}` as "choice_a"] ?? ""} onChange={e => setEditing({ ...editing, [`choice_${k}`]: e.target.value })}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none" placeholder={`Option ${k.toUpperCase()}`}
                  style={{ color: 'var(--cc-text)' }} />
              </div>
            ))}
            <div>
              <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Bonne réponse</label>
              <div className="flex gap-2">
                {(["A","B","C","D"] as const).map(k => (
                  <button key={k} onClick={() => setEditing({ ...editing, answer: k })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold ${editing.answer === k ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/5"}`}
                    style={editing.answer === k ? undefined : { color: 'var(--cc-text-muted)' }}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Explication</label>
              <textarea value={editing.explanation ?? ""} onChange={e => setEditing({ ...editing, explanation: e.target.value })}
                className="w-full min-h-[60px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
                style={{ color: 'var(--cc-text)' }} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="cc-btn cc-btn-secondary cc-btn-sm">Annuler</button>
              <button onClick={save} className="cc-btn cc-btn-primary cc-btn-sm">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
