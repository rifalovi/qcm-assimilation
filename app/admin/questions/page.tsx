"use client";

import { useEffect, useState } from "react";
import { parseCSV, toCSV, downloadCSV } from "@/lib/csv";

type Question = {
  id: string;
  external_id: string | null;
  level: number;
  theme: string;
  question: string;
  choice_a: string; choice_b: string; choice_c: string; choice_d: string;
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  status: "active" | "draft" | "archived";
  created_at: string;
};

const THEMES = ["Valeurs", "Institutions", "Histoire", "Société"];
const LEVELS = [1, 2, 3];
const STATUSES = ["active", "draft", "archived"];

function emptyQuestion(): Omit<Question, "id" | "created_at"> {
  return {
    external_id: null, level: 1, theme: "Valeurs", question: "",
    choice_a: "", choice_b: "", choice_c: "", choice_d: "",
    answer: "A", explanation: "", status: "active",
  };
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterTheme, setFilterTheme] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Question | Omit<Question, "id" | "created_at"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableCols, setAvailableCols] = useState<Set<string>>(new Set());
  const [levelCol, setLevelCol] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "level_asc" | "level_desc" | "theme">("newest");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort });
    if (filterLevel) params.set("level", filterLevel);
    if (filterTheme) params.set("theme", filterTheme);
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/questions?${params}`);
    const json = await res.json();
    if (json.availableCols) setAvailableCols(new Set(json.availableCols));
    if (json.levelCol !== undefined) setLevelCol(json.levelCol);
    if (!res.ok) { setError(json.error); setLoading(false); return; }
    setQuestions(json.questions);
    setTotal(json.total);
    setError(null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, filterLevel, filterTheme, filterStatus, sort]);
  useEffect(() => { const t = setTimeout(() => { setPage(0); load(); }, 400); return () => clearTimeout(t); }, [search]);

  async function save() {
    if (!editing) return;
    const isNew = !("id" in editing);
    const res = await fetch("/api/admin/questions", {
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
    await fetch("/api/admin/questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    load();
  }

  async function exportCSV() {
    const res = await fetch("/api/admin/questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export_csv" }),
    });
    const json = await res.json();
    const cols = ["external_id", "level", "theme", "question", "choice_a", "choice_b", "choice_c", "choice_d", "answer", "explanation", "status"];
    downloadCSV(`questions-${new Date().toISOString().slice(0,10)}.csv`, toCSV(json.rows, cols));
  }

  async function importCSV(file: File) {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) { alert("CSV vide ou invalide"); return; }
    const res = await fetch("/api/admin/questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import_csv", rows }),
    });
    const json = await res.json();
    alert(res.ok ? `${json.inserted} questions importées` : "Erreur : " + json.error);
    load();
  }

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Questions QCM</h1>
        <p className="mt-1 text-sm text-slate-400">Gestion de la base de questions ({total} total)</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <input placeholder="Rechercher (énoncé, choix, explication)..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none flex-1 min-w-[260px]" />
        {availableCols.has('level') && (
          <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(0); }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
            <option value="" className="bg-slate-800">Tous niveaux</option>
            {LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">Niveau {l}</option>)}
          </select>
        )}
        {availableCols.has('theme') && (
          <select value={filterTheme} onChange={e => { setFilterTheme(e.target.value); setPage(0); }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
            <option value="" className="bg-slate-800">Tous thèmes</option>
            {THEMES.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
          </select>
        )}
        {availableCols.has('status') && (
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
            <option value="" className="bg-slate-800">Tous statuts</option>
            {STATUSES.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
          </select>
        )}
        <select value={sort} onChange={e => { setSort(e.target.value as typeof sort); setPage(0); }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
          <option value="newest" className="bg-slate-800">Plus récent</option>
          {levelCol && <option value="level_asc" className="bg-slate-800">Niveau ↑</option>}
          {levelCol && <option value="level_desc" className="bg-slate-800">Niveau ↓</option>}
          {availableCols.has('theme') && <option value="theme" className="bg-slate-800">Par thème</option>}
        </select>
        <button onClick={() => setEditing(emptyQuestion())}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">+ Nouvelle</button>
        <button onClick={exportCSV}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:text-white">Export CSV</button>
        <label className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:text-white cursor-pointer">
          Import CSV
          <input type="file" accept=".csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importCSV(f); }} />
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Erreur : {error}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /></div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {levelCol && (q as unknown as Record<string, unknown>)[levelCol] != null && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300">N{String((q as unknown as Record<string, unknown>)[levelCol])}</span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{q.theme}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      q.status === 'active' ? 'bg-emerald-900/40 text-emerald-300' :
                      q.status === 'draft' ? 'bg-amber-900/40 text-amber-300' :
                      'bg-slate-700 text-slate-500'
                    }`}>{q.status}</span>
                    {q.external_id && <span className="text-[10px] text-slate-500 font-mono">{q.external_id}</span>}
                  </div>
                  <p className="text-sm text-white font-medium">{q.question}</p>
                  {q.answer && (
                    <p className="text-xs text-slate-400 mt-1">
                      Réponse : {q.answer}) {q[`choice_${q.answer.toLowerCase()}` as "choice_a"] ?? ""}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => setEditing(q)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white">Éditer</button>
                  <button onClick={() => del(q.id)} className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
          {questions.length === 0 && !error && (
            <p className="text-center text-sm text-slate-400 py-8">Aucune question trouvée</p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-30">← Précédent</button>
              <span className="text-xs text-slate-400">Page {page + 1} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-30">Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* Modal édition */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{("id" in editing) ? "Éditer" : "Nouvelle"} question</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Niveau</label>
                <select value={editing.level} onChange={e => setEditing({ ...editing, level: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
                  {LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">Niveau {l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Thème</label>
                <select value={editing.theme} onChange={e => setEditing({ ...editing, theme: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
                  {THEMES.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Statut</label>
                <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as Question["status"] })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
                  {STATUSES.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Énoncé</label>
              <textarea value={editing.question ?? ""} onChange={e => setEditing({ ...editing, question: e.target.value })}
                className="w-full min-h-[80px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            {(["a", "b", "c", "d"] as const).map(k => (
              <div key={k} className="flex gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">{k.toUpperCase()}</div>
                <input value={editing[`choice_${k}` as "choice_a"] ?? ""} onChange={e => setEditing({ ...editing, [`choice_${k}`]: e.target.value })}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" placeholder={`Option ${k.toUpperCase()}`} />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-400">Bonne réponse</label>
              <div className="flex gap-2">
                {(["A","B","C","D"] as const).map(k => (
                  <button key={k} onClick={() => setEditing({ ...editing, answer: k })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold ${editing.answer === k ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/5 text-slate-400"}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Explication</label>
              <textarea value={editing.explanation ?? ""} onChange={e => setEditing({ ...editing, explanation: e.target.value })}
                className="w-full min-h-[60px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Annuler</button>
              <button onClick={save} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
