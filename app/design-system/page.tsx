"use client";
import { useEffect, useState } from "react";

/* ────────────────────────────────────────────────────────────
   /design-system — Page de démonstration des tokens & composants
   Cap Citoyen Design System — Étape 1
   ──────────────────────────────────────────────────────────── */

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("cc-theme", next); } catch {}
    setTheme(next);
  }

  return { theme, toggle };
}

/* ── Helpers UI ─────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--cc-text-muted)" }}>
        {title}
      </h2>
      <div style={{ borderBottom: "1px solid var(--cc-border)", marginBottom: "1.25rem" }} />
      {children}
    </section>
  );
}

function Swatch({ name, varName, hex }: { name: string; varName: string; hex?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 rounded-lg border"
        style={{
          background: `var(${varName})`,
          borderColor: "var(--cc-border)",
        }}
      />
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--cc-text)" }}>{name}</p>
        <p className="text-[11px] font-mono" style={{ color: "var(--cc-text-muted)" }}>{varName}</p>
        {hex && <p className="text-[11px] font-mono" style={{ color: "var(--cc-text-disabled)" }}>{hex}</p>}
      </div>
    </div>
  );
}

function RadiusSwatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-16 w-16 border-2"
        style={{
          borderRadius: `var(${value})`,
          borderColor: "var(--cc-primary)",
          background: "var(--cc-primary-soft)",
        }}
      />
      <div className="text-center">
        <p className="text-xs font-semibold" style={{ color: "var(--cc-text)" }}>{label}</p>
        <p className="text-[11px] font-mono" style={{ color: "var(--cc-text-muted)" }}>{value}</p>
      </div>
    </div>
  );
}

function ShadowSwatch({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex h-20 items-center justify-center rounded-xl border px-4"
      style={{
        boxShadow: `var(${value})`,
        borderColor: "var(--cc-border)",
        background: "var(--cc-surface)",
      }}
    >
      <span className="text-xs font-mono" style={{ color: "var(--cc-text-muted)" }}>{value}</span>
    </div>
  );
}

export default function DesignSystemPage() {
  const { theme, toggle } = useTheme();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--cc-surface)", color: "var(--cc-text)" }}
    >
      {/* ── Barre de titre ───────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 border-b px-6 py-3"
        style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <span className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>
              Cap Citoyen — Design System
            </span>
            <span
              className="ml-2 rounded px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: "var(--cc-primary-soft)", color: "var(--cc-primary)" }}
            >
              Étape 1
            </span>
          </div>
          <button
            onClick={toggle}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: "var(--cc-surface-alt)",
              borderColor: "var(--cc-border)",
              color: "var(--cc-text)",
            }}
          >
            {theme === "light" ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
                Mode nuit
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                Mode jour
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* ══ PALETTE ══════════════════════════════════════════ */}
        <Section title="Palette — Couleur principale">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
            <Swatch name="Primary"      varName="--cc-primary"       hex="#1B5299 / dark: #5B9BD5" />
            <Swatch name="Primary hover" varName="--cc-primary-hover" hex="#15407A / dark: #7AB1DF" />
            <Swatch name="Primary soft" varName="--cc-primary-soft"  hex="#E8EFF7 / dark: #1A2A3E" />
          </div>
        </Section>

        <Section title="Palette — Statuts">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <Swatch name="Success"      varName="--cc-success"      hex="#2E7D4F" />
            <Swatch name="Success soft" varName="--cc-success-soft" hex="#E6F2EB" />
            <Swatch name="Danger"       varName="--cc-danger"       hex="#C0392B" />
            <Swatch name="Danger soft"  varName="--cc-danger-soft"  hex="#FDECEA" />
            <Swatch name="Warning"      varName="--cc-warning"      hex="#B8730E" />
            <Swatch name="Warning soft" varName="--cc-warning-soft" hex="#FEF3E2" />
          </div>
        </Section>

        <Section title="Palette — Textes">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
            <Swatch name="Text"          varName="--cc-text"          hex="#1A1D24 / dark: #E8EAED" />
            <Swatch name="Text muted"    varName="--cc-text-muted"    hex="#5B6472 / dark: #9AA1AD" />
            <Swatch name="Text disabled" varName="--cc-text-disabled" hex="#9AA1AD / dark: #5B6472" />
          </div>
        </Section>

        <Section title="Palette — Surfaces & Bordures">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Swatch name="Surface"        varName="--cc-surface"        hex="#FFFFFF / dark: #15181E" />
            <Swatch name="Surface alt"    varName="--cc-surface-alt"    hex="#F5F6F8 / dark: #1E222B" />
            <Swatch name="Surface raised" varName="--cc-surface-raised" hex="#ECEEF1 / dark: #252A35" />
            <Swatch name="Border"         varName="--cc-border"         hex="#E0E3E8 / dark: #2C313B" />
            <Swatch name="Border strong"  varName="--cc-border-strong"  hex="#C4C9D2 / dark: #3E4554" />
          </div>
        </Section>

        <Section title="Palette — Drapeau (invariant)">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Swatch name="Flag blue" varName="--cc-flag-blue" hex="#002395 (invariant)" />
            <Swatch name="Flag red"  varName="--cc-flag-red"  hex="#ED2939 (invariant)" />
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--cc-text-muted)" }}>
            Ces couleurs représentent le drapeau français — elles ne changent pas en mode nuit.
          </p>
        </Section>

        {/* ══ TYPOGRAPHIE ══════════════════════════════════════ */}
        <Section title="Typographie — Inter">
          <div className="space-y-5">
            <div>
              <span className="mb-1 block text-[11px] font-mono" style={{ color: "var(--cc-text-disabled)" }}>h1 — clamp(1.75rem → 2.25rem) / 700 / -0.02em</span>
              <h1 style={{ marginBottom: 0 }}>Préparez votre examen civique</h1>
            </div>
            <div>
              <span className="mb-1 block text-[11px] font-mono" style={{ color: "var(--cc-text-disabled)" }}>h2 — clamp(1.25rem → 1.625rem) / 700 / -0.01em</span>
              <h2 style={{ marginBottom: 0 }}>Votre progression cette semaine</h2>
            </div>
            <div>
              <span className="mb-1 block text-[11px] font-mono" style={{ color: "var(--cc-text-disabled)" }}>h3 — 1.125rem / 600</span>
              <h3 style={{ marginBottom: 0 }}>Thème : Valeurs de la République</h3>
            </div>
            <div>
              <span className="mb-1 block text-[11px] font-mono" style={{ color: "var(--cc-text-disabled)" }}>h4 — 1rem / 600</span>
              <h4 style={{ marginBottom: 0 }}>Questions de niveau 2</h4>
            </div>
            <div>
              <span className="mb-1 block text-[11px] font-mono" style={{ color: "var(--cc-text-disabled)" }}>body — 1rem / 400</span>
              <p style={{ marginBottom: 0, color: "var(--cc-text)" }}>
                L'examen civique comprend 40 questions à choix multiple. Le candidat dispose de 45 minutes
                pour répondre et doit obtenir au moins 32 bonnes réponses pour valider l'épreuve.
              </p>
            </div>
            <div>
              <span className="mb-1 block text-[11px] font-mono" style={{ color: "var(--cc-text-disabled)" }}>small / muted — 0.875rem</span>
              <p className="text-sm" style={{ color: "var(--cc-text-muted)", marginBottom: 0 }}>
                Chaque passage raté coûte entre 70 et 90 €. Une bonne préparation fait la différence.
              </p>
            </div>
          </div>
        </Section>

        {/* ══ MISE EN FORME ════════════════════════════════════ */}
        <Section title="Rayons (border-radius)">
          <div className="flex flex-wrap gap-8">
            <RadiusSwatch label="Radius"    value="--cc-radius" />
            <RadiusSwatch label="Radius lg" value="--cc-radius-lg" />
            <RadiusSwatch label="Radius xl" value="--cc-radius-xl" />
            <RadiusSwatch label="Full"      value="--cc-radius-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono sm:grid-cols-4" style={{ color: "var(--cc-text-muted)" }}>
            <span>--cc-radius: 8px</span>
            <span>--cc-radius-lg: 12px</span>
            <span>--cc-radius-xl: 16px</span>
            <span>--cc-radius-full: 9999px</span>
          </div>
        </Section>

        <Section title="Ombres">
          <div className="grid gap-4 sm:grid-cols-3">
            <ShadowSwatch label="sm" value="--cc-shadow-sm" />
            <ShadowSwatch label="md" value="--cc-shadow" />
            <ShadowSwatch label="lg" value="--cc-shadow-lg" />
          </div>
        </Section>

        {/* ══ COMPOSANTS ═══════════════════════════════════════ */}
        <Section title="Composants — .cc-btn">
          <div className="flex flex-wrap gap-3">
            <button className="cc-btn cc-btn-primary">Commencer l'entraînement</button>
            <button className="cc-btn cc-btn-secondary">Voir mes résultats</button>
            <button className="cc-btn cc-btn-tertiary">En savoir plus</button>
            <button className="cc-btn cc-btn-danger">Réinitialiser</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="cc-btn cc-btn-primary" disabled>Désactivé (primary)</button>
            <button className="cc-btn cc-btn-secondary" disabled>Désactivé (secondary)</button>
          </div>
          <div className="mt-4 text-xs font-mono" style={{ color: "var(--cc-text-muted)" }}>
            Tailles : ajouter <code className="rounded px-1" style={{ background: "var(--cc-surface-alt)" }}>px-3 py-1.5 text-sm</code> (sm)
            &nbsp;|&nbsp;<code className="rounded px-1" style={{ background: "var(--cc-surface-alt)" }}>px-4 py-2.5 text-sm</code> (md)
            &nbsp;|&nbsp;<code className="rounded px-1" style={{ background: "var(--cc-surface-alt)" }}>px-6 py-3 text-base</code> (lg)
          </div>
        </Section>

        <Section title="Composants — .cc-card">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="cc-card">
              <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Quiz interactif</p>
              <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>
                40 questions, niveaux 1 à 3, chronométré.
              </p>
            </div>
            <div className="cc-card">
              <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Score moyen</p>
              <p className="mt-1 text-3xl font-bold" style={{ color: "var(--cc-primary)" }}>78%</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--cc-text-muted)" }}>Sur vos 12 derniers examens blancs</p>
            </div>
            <div className="cc-card">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Progression</p>
                <span className="cc-badge cc-badge-success">+12 pts</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--cc-border)" }}>
                <div className="h-full rounded-full" style={{ width: "62%", background: "var(--cc-success)" }} />
              </div>
              <p className="mt-1.5 text-xs" style={{ color: "var(--cc-text-muted)" }}>62 questions maîtrisées / 100</p>
            </div>
          </div>
        </Section>

        <Section title="Composants — .cc-badge">
          <div className="flex flex-wrap gap-3">
            <span className="cc-badge cc-badge-info">En cours</span>
            <span className="cc-badge cc-badge-success">Réussi</span>
            <span className="cc-badge cc-badge-warning">À retravailler</span>
            <span className="cc-badge cc-badge-danger">Erreur</span>
            <span className="cc-badge cc-badge-neutral">Neutre</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <span className="cc-badge cc-badge-info">Pass Sérénité</span>
            <span className="cc-badge cc-badge-success">Recommandé</span>
            <span className="cc-badge cc-badge-warning">Expire dans 3 jours</span>
            <span className="cc-badge cc-badge-neutral">Découverte</span>
          </div>
        </Section>

        <Section title="Composants — .cc-notice">
          <div className="space-y-3">
            <div className="cc-notice">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Information</p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--cc-text-muted)" }}>
                  Ce contenu est conforme au programme officiel de l'examen civique 2026.
                </p>
              </div>
            </div>
            <div className="cc-notice cc-notice-success">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Bonne réponse</p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--cc-text-muted)" }}>
                  La laïcité garantit la liberté de conscience et de culte pour tous les citoyens.
                </p>
              </div>
            </div>
            <div className="cc-notice cc-notice-warning">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Réponse indicative IA</p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--cc-text-muted)" }}>
                  Réponse générée par l'IA — vérifiez sur service-public.fr pour toute démarche officielle.
                </p>
              </div>
            </div>
            <div className="cc-notice cc-notice-danger">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Mauvaise réponse</p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--cc-text-muted)" }}>
                  Le droit de vote aux élections locales n'est pas accordé aux résidents étrangers (hors UE).
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Composants — Formulaires">
          <div className="max-w-sm space-y-4">
            <div>
              <label htmlFor="ds-email" className="mb-1 block text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
                Adresse email
              </label>
              <input id="ds-email" type="email" placeholder="votre@email.com" className="w-full" />
            </div>
            <div>
              <label htmlFor="ds-select" className="mb-1 block text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
                Niveau de préparation
              </label>
              <select id="ds-select" className="w-full">
                <option>Débutant — moins de 2 semaines</option>
                <option>Intermédiaire — 1 à 2 mois</option>
                <option>Avancé — plus de 2 mois</option>
              </select>
            </div>
          </div>
        </Section>

        {/* ══ TRICOLORE ════════════════════════════════════════ */}
        <Section title="Motif tricolore (--cc-flag-*)">
          <div className="space-y-3">
            <div className="flex h-2 w-full overflow-hidden rounded-full">
              <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
              <div className="flex-1 bg-white border-x" style={{ borderColor: "var(--cc-border)" }} />
              <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-9 overflow-hidden rounded-sm border" style={{ borderColor: "var(--cc-border)" }}>
                <span className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
                <span className="flex-1 bg-white" />
                <span className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>Cap Citoyen</span>
            </div>
            <p className="text-xs" style={{ color: "var(--cc-text-muted)" }}>
              Les couleurs du drapeau utilisent <code className="rounded px-1" style={{ background: "var(--cc-surface-alt)" }}>var(--cc-flag-blue)</code> et <code className="rounded px-1" style={{ background: "var(--cc-surface-alt)" }}>var(--cc-flag-red)</code> — invariantes en mode nuit.
            </p>
          </div>
        </Section>

        {/* ══ FOCUS ════════════════════════════════════════════ */}
        <Section title="Accessibilité — Focus visible">
          <div className="flex flex-wrap gap-4">
            <button
              className="cc-btn cc-btn-primary"
              style={{ outline: "2px solid var(--cc-primary)", outlineOffset: "2px",
                       boxShadow: "0 0 0 2px var(--cc-surface), 0 0 0 4px var(--cc-primary)" }}
            >
              Simulation focus
            </button>
            <p className="self-center text-sm" style={{ color: "var(--cc-text-muted)" }}>
              Double anneau : 2px surface + 4px primary — visible sur fond clair ET foncé.
            </p>
          </div>
        </Section>

      </div>

      {/* ── Footer de la page ────────────────────────────────── */}
      <div
        className="border-t px-6 py-4 text-center"
        style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
      >
        <p className="text-xs" style={{ color: "var(--cc-text-muted)" }}>
          Cap Citoyen Design System — Étape 1 · Tokens & fondations ·{" "}
          <span className="font-mono">Inter · #1B5299 · r8/12px</span>
        </p>
      </div>
    </div>
  );
}
