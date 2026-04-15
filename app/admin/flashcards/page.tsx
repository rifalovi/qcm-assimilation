"use client";

import { useEffect, useState } from "react";
import { parseCSV, toCSV, downloadCSV } from "@/lib/csv";

type Flashcard = {
  id: string;
  recto: string; verso: string;
  theme: string; level: number;
  status: "active" | "draft" | "archived";
  created_at: string;
};

const THEMES = ["Valeurs", "Institutions", "Histoire", "Société"];
const LEVELS = [1, 2, 3];
const STATUSES = ["active", "draft", "archived"];

function empty(): Omit<Flashcard, "id" | "created_at"> {
  return { recto: "", verso: "", theme: "Valeurs", level: 1, status: "active" };
}

export default function AdminFlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterTheme, setFilterTheme] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Flashcard | Omit<Flashcard, "id" | "created_at"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableCols, setAvailableCols] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filterLevel) params.set("level", filterLevel);
    if (filterTheme) params.set("theme", filterTheme);
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/flashcards?${params}`);
    const json = await res.json();
    if (json.availableCols) setAvailableCols(new Set(json.availableCols));
    if (!res.ok) { setError(json.error); setLoading(false); return; }
    setCards(json.flashcards);
    setTotal(json.total);
    setError(null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, filterLevel, filterTheme, filterStatus]);
  useEffect(() => { const t = setTimeout(() => { setPage(0); load(); }, 400); return () => clearTimeout(t); }, [search]);

  async function save() {
    if (!editing) return;
    const isNew = !("id" in editing);
    const res = await fetch("/api/admin/flashcards", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isNew ? "create" : "update", ...editing }),
    });
    const json = await res.json();
    if (!res.ok) { alert("Erreur : " + json.error); return; }
    setEditing(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("Supprimer cette flashcard ?")) return;
    await fetch("/api/admin/flashcards", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    load();
  }

  async function exportCSV() {
    const res = await fetch("/api/admin/flashcards", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export_csv" }),
    });
    const json = await res.json();
    downloadCSV(`flashcards-${new Date().toISOString().slice(0,10)}.csv`,
      toCSV(json.rows, ["recto", "verso", "theme", "level", "status"]));
  }

  async function importCSV(file: File) {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) { alert("CSV vide ou invalide"); return; }
    const res = await fetch("/api/admin/flashcards", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import_csv", rows }),
    });
    const json = await res.json();
    alert(res.ok ? `${json.inserted} flashcards importées` : "Erreur : " + json.error);
    load();
  }

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Flashcards</h1>
        <p className="mt-1 text-sm text-slate-400">Gestion des flashcards ({total} total)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input placeholder="Rechercher (recto, verso)..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none flex-1 min-w-[240px]" />
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
        <button onClick={() => setEditing(empty())}
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
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map(c => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300">N{c.level}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{c.theme}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  c.status === 'active' ? 'bg-emerald-900/40 text-emerald-300' :
                  c.status === 'draft' ? 'bg-amber-900/40 text-amber-300' :
                  'bg-slate-700 text-slate-500'
                }`}>{c.status}</span>
              </div>
              <p className="text-sm font-semibold text-white">{c.recto}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.verso}</p>
              <div className="mt-3 flex gap-1.5">
                <button onClick={() => setEditing(c)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:text-white">Éditer</button>
                <button onClick={() => del(c.id)} className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs text-red-300">Supprimer</button>
              </div>
            </div>
          ))}
          {cards.length === 0 && !error && (
            <p className="col-span-full text-center text-sm text-slate-400 py-8">Aucune flashcard trouvée</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-30">← Précédent</button>
          <span className="text-xs text-slate-400">Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-30">Suivant →</button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{("id" in editing) ? "Éditer" : "Nouvelle"} flashcard</h2>
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
                <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as Flashcard["status"] })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
                  {STATUSES.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Recto (question / terme)</label>
              <textarea value={editing.recto ?? ""} onChange={e => setEditing({ ...editing, recto: e.target.value })}
                className="w-full min-h-[70px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Verso (réponse / définition)</label>
              <textarea value={editing.verso ?? ""} onChange={e => setEditing({ ...editing, verso: e.target.value })}
                className="w-full min-h-[100px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
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
