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
        <h1 className="adm-title">Flashcards & QCM</h1>
        <p className="adm-subtitle">{total} flashcards, chacune avec jusqu&apos;à 3 variantes QCM</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input placeholder="Rechercher (énoncé, réponse)..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none flex-1 min-w-[260px]"
          style={{ color: 'var(--cc-text)' }} />
        {distinctThemes.length > 0 && (
          <select value={filterTheme} onChange={e => { setFilterTheme(e.target.value); setPage(0); }}
            className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none max-w-[260px]"
            style={{ color: 'var(--cc-text)' }}>
            <option value="" style={{ background: 'var(--cc-surface-alt)' }}>Tous thèmes</option>
            {distinctThemes.map(t => <option key={t} value={t} style={{ background: 'var(--cc-surface-alt)' }}>{t}</option>)}
          </select>
        )}
        <select value={sort} onChange={e => { setSort(e.target.value as typeof sort); setPage(0); }}
          className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
          style={{ color: 'var(--cc-text)' }}>
          <option value="id_asc" style={{ background: 'var(--cc-surface-alt)' }}>ID ↑</option>
          <option value="id_desc" style={{ background: 'var(--cc-surface-alt)' }}>ID ↓</option>
          <option value="theme" style={{ background: 'var(--cc-surface-alt)' }}>Par thème</option>
        </select>
        <button onClick={() => setEditing(emptyQuestion())}
          className="cc-btn cc-btn-primary cc-btn-sm">+ Nouvelle</button>
        <button onClick={exportCSV}
          className="cc-btn cc-btn-secondary cc-btn-sm">Export CSV</button>
        <label className="cc-btn cc-btn-secondary cc-btn-sm cursor-pointer">
          Import CSV
          <input type="file" accept=".csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importCSV(f); }} />
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--cc-danger)] bg-[var(--cc-danger-soft)] px-4 py-3 text-sm text-[var(--cc-danger)]">
          Erreur : {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--cc-primary)] border-t-transparent" /></div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className="adm-panel p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="cc-badge cc-badge-sm cc-badge-neutral font-mono">#{q.id}</span>
                    <span className="cc-badge cc-badge-sm cc-badge-neutral">{q.theme}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--cc-primary-soft)] text-[var(--cc-primary)]">
                      {(q.mcq_variants ?? []).length} variante{((q.mcq_variants ?? []).length) > 1 ? "s" : ""} QCM
                    </span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--cc-text)' }}>{q.question}</p>
                  {q.best_answer && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--cc-text-muted)' }}>💡 {q.best_answer}</p>}
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto adm-panel p-6 space-y-4">
            <div className="flex items-center justify-between sticky top-0 py-2" style={{ background: 'var(--cc-surface)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--cc-text)' }}>{("id" in editing) ? `Éditer #${editing.id}` : "Nouvelle flashcard"}</h2>
              <button onClick={() => setEditing(null)} style={{ color: 'var(--cc-text-muted)' }}>✕</button>
            </div>

            <div>
              <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Thème</label>
              <input value={editing.theme ?? ""} onChange={e => setEditing({ ...editing, theme: e.target.value })}
                list="themes-list"
                className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
                style={{ color: 'var(--cc-text)' }} />
              <datalist id="themes-list">
                {distinctThemes.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div>
              <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Question / Recto</label>
              <textarea value={editing.question ?? ""} onChange={e => setEditing({ ...editing, question: e.target.value })}
                className="w-full min-h-[70px] rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
                style={{ color: 'var(--cc-text)' }} />
            </div>

            <div>
              <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Meilleure réponse / Verso</label>
              <textarea value={editing.best_answer ?? ""} onChange={e => setEditing({ ...editing, best_answer: e.target.value })}
                className="w-full min-h-[100px] rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
                style={{ color: 'var(--cc-text)' }} />
            </div>

            {/* Variantes QCM */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--cc-primary)] uppercase tracking-wider">Variantes QCM ({(editing.mcq_variants ?? []).length})</p>
                <button onClick={() => setEditing({ ...editing, mcq_variants: [...(editing.mcq_variants ?? []), emptyVariant()] })}
                  className="text-xs text-[var(--cc-primary)] hover:text-[var(--cc-primary-hover)]">+ Ajouter variante</button>
              </div>
              {(editing.mcq_variants ?? []).map((v, vIdx) => (
                <div key={vIdx} className="rounded-xl border border-[var(--cc-primary)] bg-[var(--cc-primary-soft)] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--cc-primary)]">QCM {vIdx + 1}</span>
                    <button onClick={() => {
                      const variants = [...(editing.mcq_variants ?? [])];
                      variants.splice(vIdx, 1);
                      setEditing({ ...editing, mcq_variants: variants });
                    }} className="text-xs text-[var(--cc-danger)] hover:text-[var(--cc-danger)]">Supprimer</button>
                  </div>
                  <input placeholder="Titre" value={v.title ?? ""} onChange={e => updateVariant(vIdx, "title", e.target.value)}
                    className="w-full rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-1.5 text-xs focus:outline-none"
                    style={{ color: 'var(--cc-text)' }} />
                  <textarea placeholder="Énoncé de la question" value={v.prompt ?? ""} onChange={e => updateVariant(vIdx, "prompt", e.target.value)}
                    className="w-full min-h-[50px] rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-1.5 text-xs focus:outline-none"
                    style={{ color: 'var(--cc-text)' }} />
                  {[0, 1, 2, 3].map(oIdx => (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <button onClick={() => updateVariant(vIdx, "correct", oIdx)}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${v.correct === oIdx ? "bg-[var(--cc-success-soft)] border border-[var(--cc-success)] text-[var(--cc-success)]" : "bg-[var(--cc-surface)] border border-[var(--cc-border)]"}`}
                        style={v.correct === oIdx ? undefined : { color: 'var(--cc-text-muted)' }}>
                        {String.fromCharCode(65 + oIdx)}
                      </button>
                      <input value={(v.options ?? [])[oIdx] ?? ""} onChange={e => updateVariantOption(vIdx, oIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1 rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-1.5 text-xs focus:outline-none"
                        style={{ color: 'var(--cc-text)' }} />
                    </div>
                  ))}
                  <textarea placeholder="Explication" value={v.explanation ?? ""} onChange={e => updateVariant(vIdx, "explanation", e.target.value)}
                    className="w-full min-h-[50px] rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-1.5 text-xs focus:outline-none"
                    style={{ color: 'var(--cc-text)' }} />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 sticky bottom-0 pt-3 border-t border-[var(--cc-border)]" style={{ background: 'var(--cc-surface)' }}>
              <button onClick={() => setEditing(null)} className="cc-btn cc-btn-secondary cc-btn-sm">Annuler</button>
              <button onClick={save} className="cc-btn cc-btn-primary cc-btn-sm">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
