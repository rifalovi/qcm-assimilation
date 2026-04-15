"use client";

import { useEffect, useState } from "react";
import { parseCSV, toCSV, downloadCSV } from "@/lib/csv";

type MCQVariant = {
  title: string;
  prompt?: string;
  options: string[];
  correct: number;
  explanation: string;
};

type Question = {
  id: number;
  theme: string;
  question: string;
  best_answer: string;
  mcq_variants: MCQVariant[];
};

function emptyVariant(): MCQVariant {
  return { title: "", prompt: "", options: ["", "", "", ""], correct: 0, explanation: "" };
}

function emptyQuestion(): Omit<Question, "id"> {
  return { theme: "", question: "", best_answer: "", mcq_variants: [emptyVariant(), emptyVariant(), emptyVariant()] };
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterTheme, setFilterTheme] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"id_asc" | "id_desc" | "theme">("id_asc");
  const [distinctThemes, setDistinctThemes] = useState<string[]>([]);
  const [editing, setEditing] = useState<Question | Omit<Question, "id"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort });
    if (filterTheme) params.set("theme", filterTheme);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/questions?${params}`);
    const json = await res.json();
    if (!res.ok) { setError(json.error); setLoading(false); return; }
    setQuestions(json.questions);
    setTotal(json.total);
    setDistinctThemes(json.distinctThemes ?? []);
    setError(null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, filterTheme, sort]);
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

  async function del(id: number) {
    if (!confirm("Supprimer cette flashcard et ses variantes QCM ?")) return;
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
    const rows = (json.rows ?? []).map((r: Question) => ({
      id: r.id, theme: r.theme, question: r.question, best_answer: r.best_answer,
      mcq_variants: JSON.stringify(r.mcq_variants ?? []),
    }));
    downloadCSV(`questions-${new Date().toISOString().slice(0,10)}.csv`,
      toCSV(rows, ["id", "theme", "question", "best_answer", "mcq_variants"]));
  }

  async function importCSV(file: File) {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) { alert("CSV vide"); return; }
    const res = await fetch("/api/admin/questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import_csv", rows }),
    });
    const json = await res.json();
    alert(res.ok ? `${json.inserted} entrées importées` : "Erreur : " + json.error);
    load();
  }

  const totalPages = Math.ceil(total / 30);

  function updateVariant(idx: number, key: keyof MCQVariant, value: unknown) {
    if (!editing) return;
    const variants = [...(editing.mcq_variants ?? [])];
    variants[idx] = { ...variants[idx], [key]: value };
    setEditing({ ...editing, mcq_variants: variants });
  }

  function updateVariantOption(vIdx: number, oIdx: number, value: string) {
    if (!editing) return;
    const variants = [...(editing.mcq_variants ?? [])];
    const opts = [...(variants[vIdx].options ?? ["", "", "", ""])];
    opts[oIdx] = value;
    variants[vIdx] = { ...variants[vIdx], options: opts };
    setEditing({ ...editing, mcq_variants: variants });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Flashcards & QCM</h1>
        <p className="mt-1 text-sm text-slate-400">{total} flashcards, chacune avec jusqu&apos;à 3 variantes QCM</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input placeholder="Rechercher (énoncé, réponse)..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none flex-1 min-w-[260px]" />
        {distinctThemes.length > 0 && (
          <select value={filterTheme} onChange={e => { setFilterTheme(e.target.value); setPage(0); }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none max-w-[260px]">
            <option value="" className="bg-slate-800">Tous thèmes</option>
            {distinctThemes.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
          </select>
        )}
        <select value={sort} onChange={e => { setSort(e.target.value as typeof sort); setPage(0); }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
          <option value="id_asc" className="bg-slate-800">ID ↑</option>
          <option value="id_desc" className="bg-slate-800">ID ↓</option>
          <option value="theme" className="bg-slate-800">Par thème</option>
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

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /></div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 font-mono">#{q.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{q.theme}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300">
                      {(q.mcq_variants ?? []).length} variante{((q.mcq_variants ?? []).length) > 1 ? "s" : ""} QCM
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium">{q.question}</p>
                  {q.best_answer && <p className="text-xs text-slate-400 mt-1 line-clamp-2">💡 {q.best_answer}</p>}
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-slate-900 py-2">
              <h2 className="text-lg font-bold text-white">{("id" in editing) ? `Éditer #${editing.id}` : "Nouvelle flashcard"}</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-xs text-slate-400">Thème</label>
              <input value={editing.theme ?? ""} onChange={e => setEditing({ ...editing, theme: e.target.value })}
                list="themes-list"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
              <datalist id="themes-list">
                {distinctThemes.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div>
              <label className="text-xs text-slate-400">Question / Recto</label>
              <textarea value={editing.question ?? ""} onChange={e => setEditing({ ...editing, question: e.target.value })}
                className="w-full min-h-[70px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            </div>

            <div>
              <label className="text-xs text-slate-400">Meilleure réponse / Verso</label>
              <textarea value={editing.best_answer ?? ""} onChange={e => setEditing({ ...editing, best_answer: e.target.value })}
                className="w-full min-h-[100px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            </div>

            {/* Variantes QCM */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">Variantes QCM ({(editing.mcq_variants ?? []).length})</p>
                <button onClick={() => setEditing({ ...editing, mcq_variants: [...(editing.mcq_variants ?? []), emptyVariant()] })}
                  className="text-xs text-violet-300 hover:text-violet-200">+ Ajouter variante</button>
              </div>
              {(editing.mcq_variants ?? []).map((v, vIdx) => (
                <div key={vIdx} className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-200">QCM {vIdx + 1}</span>
                    <button onClick={() => {
                      const variants = [...(editing.mcq_variants ?? [])];
                      variants.splice(vIdx, 1);
                      setEditing({ ...editing, mcq_variants: variants });
                    }} className="text-xs text-red-300 hover:text-red-200">Supprimer</button>
                  </div>
                  <input placeholder="Titre" value={v.title ?? ""} onChange={e => updateVariant(vIdx, "title", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none" />
                  <textarea placeholder="Énoncé de la question" value={v.prompt ?? ""} onChange={e => updateVariant(vIdx, "prompt", e.target.value)}
                    className="w-full min-h-[50px] rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none" />
                  {[0, 1, 2, 3].map(oIdx => (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <button onClick={() => updateVariant(vIdx, "correct", oIdx)}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${v.correct === oIdx ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-200" : "bg-white/5 border border-white/10 text-slate-400"}`}>
                        {String.fromCharCode(65 + oIdx)}
                      </button>
                      <input value={(v.options ?? [])[oIdx] ?? ""} onChange={e => updateVariantOption(vIdx, oIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                  ))}
                  <textarea placeholder="Explication" value={v.explanation ?? ""} onChange={e => updateVariant(vIdx, "explanation", e.target.value)}
                    className="w-full min-h-[50px] rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none" />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 sticky bottom-0 bg-slate-900 pt-3 border-t border-white/10">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Annuler</button>
              <button onClick={save} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
