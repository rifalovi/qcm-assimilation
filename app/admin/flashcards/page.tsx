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
  const [levelCol, setLevelCol] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "level_asc" | "level_desc" | "theme">("newest");
  const [distinctThemes, setDistinctThemes] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort });
    if (filterLevel) params.set("level", filterLevel);
    if (filterTheme) params.set("theme", filterTheme);
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/flashcards?${params}`);
    const json = await res.json();
    if (json.availableCols) setAvailableCols(new Set(json.availableCols));
    if (json.levelCol !== undefined) setLevelCol(json.levelCol);
    if (Array.isArray(json.distinctThemes)) setDistinctThemes(json.distinctThemes);
    if (!res.ok) { setError(json.error); setLoading(false); return; }
    setCards(json.flashcards);
    setTotal(json.total);
    setError(null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, filterLevel, filterTheme, filterStatus, sort]);
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
        <h1 className="adm-title">Flashcards</h1>
        <p className="adm-subtitle">Gestion des flashcards ({total} total)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input placeholder="Rechercher (recto, verso)..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none flex-1 min-w-[240px]"
          style={{ color: 'var(--cc-text)' }} />
        {availableCols.has('level') && (
          <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(0); }}
            className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
            style={{ color: 'var(--cc-text)' }}>
            <option value="" style={{ background: 'var(--cc-surface-alt)' }}>Tous niveaux</option>
            {LEVELS.map(l => <option key={l} value={l} style={{ background: 'var(--cc-surface-alt)' }}>Niveau {l}</option>)}
          </select>
        )}
        {availableCols.has('theme') && distinctThemes.length > 0 && (
          <select value={filterTheme} onChange={e => { setFilterTheme(e.target.value); setPage(0); }}
            className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none max-w-[240px]"
            style={{ color: 'var(--cc-text)' }}>
            <option value="" style={{ background: 'var(--cc-surface-alt)' }}>Tous thèmes</option>
            {distinctThemes.map(t => <option key={t} value={t} style={{ background: 'var(--cc-surface-alt)' }}>{t}</option>)}
          </select>
        )}
        {availableCols.has('status') && (
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
            className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
            style={{ color: 'var(--cc-text)' }}>
            <option value="" style={{ background: 'var(--cc-surface-alt)' }}>Tous statuts</option>
            {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--cc-surface-alt)' }}>{s}</option>)}
          </select>
        )}
        <select value={sort} onChange={e => { setSort(e.target.value as typeof sort); setPage(0); }}
          className="rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
          style={{ color: 'var(--cc-text)' }}>
          <option value="newest" style={{ background: 'var(--cc-surface-alt)' }}>Plus récent</option>
          {levelCol && <option value="level_asc" style={{ background: 'var(--cc-surface-alt)' }}>Niveau ↑</option>}
          {levelCol && <option value="level_desc" style={{ background: 'var(--cc-surface-alt)' }}>Niveau ↓</option>}
          {availableCols.has('theme') && <option value="theme" style={{ background: 'var(--cc-surface-alt)' }}>Par thème</option>}
        </select>
        <button onClick={() => setEditing(empty())}
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
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map(c => (
            <div key={c.id} className="adm-panel p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {levelCol && (c as unknown as Record<string, unknown>)[levelCol] != null && (
                  <span className="cc-badge cc-badge-sm cc-badge-info">N{String((c as unknown as Record<string, unknown>)[levelCol])}</span>
                )}
                <span className="cc-badge cc-badge-sm cc-badge-neutral">{c.theme}</span>
                <span className={`cc-badge cc-badge-sm ${
                  c.status === 'active' ? 'cc-badge-success' :
                  c.status === 'draft' ? 'cc-badge-warning' :
                  'cc-badge-neutral'
                }`}>{c.status}</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--cc-text)' }}>{c.recto}</p>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--cc-text-muted)' }}>{c.verso}</p>
              <div className="mt-3 flex gap-1.5">
                <button onClick={() => setEditing(c)} className="adm-action">Éditer</button>
                <button onClick={() => del(c.id)} className="adm-action adm-action-danger">Supprimer</button>
              </div>
            </div>
          ))}
          {cards.length === 0 && !error && (
            <p className="col-span-full text-center text-sm py-8" style={{ color: 'var(--cc-text-muted)' }}>Aucune flashcard trouvée</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="adm-action">← Précédent</button>
          <span className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
            className="adm-action">Suivant →</button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto adm-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--cc-text)' }}>{("id" in editing) ? "Éditer" : "Nouvelle"} flashcard</h2>
              <button onClick={() => setEditing(null)} style={{ color: 'var(--cc-text-muted)' }}>✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Niveau</label>
                <select value={editing.level} onChange={e => setEditing({ ...editing, level: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
                  style={{ color: 'var(--cc-text)' }}>
                  {LEVELS.map(l => <option key={l} value={l} style={{ background: 'var(--cc-surface-alt)' }}>Niveau {l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Thème</label>
                <select value={editing.theme} onChange={e => setEditing({ ...editing, theme: e.target.value })}
                  className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
                  style={{ color: 'var(--cc-text)' }}>
                  {THEMES.map(t => <option key={t} value={t} style={{ background: 'var(--cc-surface-alt)' }}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Statut</label>
                <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as Flashcard["status"] })}
                  className="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
                  style={{ color: 'var(--cc-text)' }}>
                  {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--cc-surface-alt)' }}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Recto (question / terme)</label>
              <textarea value={editing.recto ?? ""} onChange={e => setEditing({ ...editing, recto: e.target.value })}
                className="w-full min-h-[70px] rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
                style={{ color: 'var(--cc-text)' }} />
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>Verso (réponse / définition)</label>
              <textarea value={editing.verso ?? ""} onChange={e => setEditing({ ...editing, verso: e.target.value })}
                className="w-full min-h-[100px] rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm focus:outline-none"
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
