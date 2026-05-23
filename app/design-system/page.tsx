"use client";
import { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import Checkbox from "@/components/Checkbox";
import Footer from "@/components/Footer";
import Input from "@/components/Input";
import PremiumGate from "@/components/PremiumGate";
import PricingCard from "@/components/PricingCard";
import ProgressBar from "@/components/ProgressBar";
import Radio, { RadioGroup } from "@/components/Radio";
import Select from "@/components/Select";

/* ────────────────────────────────────────────────────────────
   /design-system — Page de démonstration des tokens & composants
   Cap Citoyen Design System — Étape 2
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
    <section className="mb-14">
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
        style={{ background: `var(${varName})`, borderColor: "var(--cc-border)" }}
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
        style={{ borderRadius: `var(${value})`, borderColor: "var(--cc-primary)", background: "var(--cc-primary-soft)" }}
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
      style={{ boxShadow: `var(${value})`, borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}
    >
      <span className="text-xs font-mono" style={{ color: "var(--cc-text-muted)" }}>{value}</span>
    </div>
  );
}

/* ── Données PricingCard ────────────────────────────────────── */
const PRICING_PLANS = [
  {
    name: "Découverte",
    tagline: "Pour commencer à votre rythme",
    price: "Gratuit",
    period: "pour toujours",
    features: [
      { label: "10 questions par jour", included: true },
      { label: "Niveau 1 uniquement", included: true },
      { label: "5 cartes Scroll par session", included: true },
      { label: "3 questions IA par jour", included: true },
      { label: "Tous les niveaux (1, 2, 3)", included: false },
      { label: "Examen blanc illimité", included: false },
      { label: "Podcasts thématiques", included: false },
      { label: "Espace communauté", included: false },
    ],
    ctaLabel: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Premium",
    tagline: "La préparation complète et sérieuse",
    badge: "Recommandé",
    price: "19,99 €",
    period: "pour 3 mois",
    priceNote: "soit 6,66 €/mois — sans engagement",
    features: [
      { label: "40 questions par session", included: true },
      { label: "Tous les niveaux (1, 2, 3)", included: true },
      { label: "400 cartes Scroll illimitées", included: true },
      { label: "IA illimitée (coach personnalisé)", included: true },
      { label: "Examen blanc illimité + corrections", included: true },
      { label: "Podcasts thématiques", included: true },
      { label: "Espace communauté membres", included: true },
      { label: "Contenu expert exclusif", included: false },
    ],
    ctaLabel: "Choisir Premium",
    highlighted: true,
  },
  {
    name: "Élite",
    tagline: "L'accès complet, une seule fois",
    price: "49,99 €",
    period: "accès à vie",
    priceNote: "paiement unique — mises à jour incluses",
    features: [
      { label: "Tout ce qu'inclut Premium", included: true },
      { label: "Contenu expert exclusif", included: true },
      { label: "Mises à jour à vie incluses", included: true },
      { label: "Support prioritaire", included: true },
      { label: "Badge Élite dans la communauté", included: true },
      { label: "Accès anticipé aux nouvelles fonctions", included: true },
      { label: "Sessions live mensuelles (à venir)", included: true },
    ],
    ctaLabel: "Choisir Élite",
    highlighted: false,
  },
] as const;

export default function DesignSystemPage() {
  const { theme, toggle } = useTheme();
  const [inputVal, setInputVal] = useState("");
  const [radioVal, setRadioVal] = useState("b");
  const [checked1, setChecked1] = useState(true);
  const [checked2, setChecked2] = useState(false);

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
              Étape 2
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
            <Swatch name="Primary"       varName="--cc-primary"       hex="#1B5299 / dark: #5B9BD5" />
            <Swatch name="Primary hover" varName="--cc-primary-hover" hex="#15407A / dark: #7AB1DF" />
            <Swatch name="Primary soft"  varName="--cc-primary-soft"  hex="#E8EFF7 / dark: #1A2A3E" />
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

        <Section title="Palette — Textes & Surfaces">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <Swatch name="Text"           varName="--cc-text"           hex="#1A1D24" />
            <Swatch name="Text muted"     varName="--cc-text-muted"     hex="#5B6472" />
            <Swatch name="Text disabled"  varName="--cc-text-disabled"  hex="#9AA1AD" />
            <Swatch name="Surface"        varName="--cc-surface"        hex="#FFFFFF" />
            <Swatch name="Surface alt"    varName="--cc-surface-alt"    hex="#F5F6F8" />
            <Swatch name="Surface raised" varName="--cc-surface-raised" hex="#ECEEF1" />
          </div>
        </Section>

        <Section title="Rayons & Ombres">
          <div className="flex flex-wrap gap-8 mb-6">
            <RadiusSwatch label="Radius"    value="--cc-radius" />
            <RadiusSwatch label="Radius lg" value="--cc-radius-lg" />
            <RadiusSwatch label="Radius xl" value="--cc-radius-xl" />
            <RadiusSwatch label="Full"      value="--cc-radius-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <ShadowSwatch label="sm" value="--cc-shadow-sm" />
            <ShadowSwatch label="md" value="--cc-shadow" />
            <ShadowSwatch label="lg" value="--cc-shadow-lg" />
          </div>
        </Section>

        <Section title="Typographie — Inter">
          <div className="space-y-5">
            {[
              { label: "h1 — clamp(1.75rem → 2.25rem) / 700", el: <h1 style={{ marginBottom: 0 }}>Préparez votre examen civique</h1> },
              { label: "h2 — clamp(1.25rem → 1.625rem) / 700", el: <h2 style={{ marginBottom: 0 }}>Votre progression cette semaine</h2> },
              { label: "h3 — 1.125rem / 600", el: <h3 style={{ marginBottom: 0 }}>Thème : Valeurs de la République</h3> },
              { label: "h4 — 1rem / 600", el: <h4 style={{ marginBottom: 0 }}>Questions de niveau 2</h4> },
            ].map(({ label, el }) => (
              <div key={label}>
                <span className="mb-1 block text-[11px] font-mono" style={{ color: "var(--cc-text-disabled)" }}>{label}</span>
                {el}
              </div>
            ))}
          </div>
        </Section>

        {/* ══ BOUTONS ══════════════════════════════════════════ */}
        <Section title="Composants — Button (.cc-btn)">
          {/* Variantes */}
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Variantes</p>
          <div className="flex flex-wrap gap-3 mb-5">
            <button className="cc-btn cc-btn-primary">Commencer</button>
            <button className="cc-btn cc-btn-secondary">Voir les résultats</button>
            <button className="cc-btn cc-btn-tertiary">En savoir plus</button>
            <button className="cc-btn cc-btn-danger">Réinitialiser</button>
          </div>

          {/* Tailles */}
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Tailles (.cc-btn-sm / défaut / .cc-btn-lg)</p>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <button className="cc-btn cc-btn-primary cc-btn-sm">Petit</button>
            <button className="cc-btn cc-btn-primary">Moyen</button>
            <button className="cc-btn cc-btn-primary cc-btn-lg">Grand</button>
          </div>

          {/* Icône */}
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Avec icône / icon-only (.cc-btn-icon)</p>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <button className="cc-btn cc-btn-primary flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>
              Valider
            </button>
            <button className="cc-btn cc-btn-secondary flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger
            </button>
            <button className="cc-btn cc-btn-secondary cc-btn-icon" aria-label="Rechercher">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
          </div>

          {/* État chargement */}
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>État chargement / désactivé</p>
          <div className="flex flex-wrap gap-3">
            <button className="cc-btn cc-btn-primary flex items-center gap-2" disabled>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Chargement…
            </button>
            <button className="cc-btn cc-btn-secondary" disabled>Désactivé</button>
          </div>
        </Section>

        {/* ══ FORMULAIRES ══════════════════════════════════════ */}
        <Section title="Composants — Formulaires">
          <div className="grid gap-8 sm:grid-cols-2">

            {/* Input states */}
            <div className="space-y-4">
              <p className="text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Input — états</p>
              <Input
                label="Adresse email"
                type="email"
                placeholder="votre@email.com"
                hint="Utilisée pour votre compte et vos notifications."
                required
              />
              <Input
                label="Prénom"
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Ex : Marie"
              />
              <Input
                label="Code invalide"
                type="text"
                defaultValue="XXXXX"
                error="Ce code de parrainage est introuvable."
              />
              <Input
                label="Email vérifié"
                type="email"
                defaultValue="marie@exemple.fr"
                className="is-success"
                disabled
              />
            </div>

            <div className="space-y-4">
              {/* Select */}
              <p className="text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Select & Textarea</p>
              <Select
                label="Niveau de préparation"
                hint="Nous adaptons votre parcours à votre niveau."
              >
                <option value="">Choisir…</option>
                <option>Débutant — moins de 2 semaines</option>
                <option>Intermédiaire — 1 à 2 mois</option>
                <option>Avancé — plus de 2 mois</option>
              </Select>

              <Select
                label="Pays de naissance"
                error="Veuillez sélectionner votre pays de naissance."
              >
                <option value="">Choisir…</option>
              </Select>

              {/* Textarea (via input HTML natif) */}
              <div className="cc-field">
                <label className="cc-label" htmlFor="ds-textarea">Votre message</label>
                <textarea
                  id="ds-textarea"
                  rows={3}
                  placeholder="Décrivez votre situation…"
                  className="cc-input"
                  style={{ resize: "vertical" }}
                />
                <p className="cc-hint">Maximum 500 caractères.</p>
              </div>
            </div>
          </div>

          {/* Checkbox & Radio */}
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Checkbox</p>
              <div className="space-y-3">
                <Checkbox
                  label="Recevoir les rappels hebdomadaires"
                  checked={checked1}
                  onChange={e => setChecked1(e.target.checked)}
                />
                <Checkbox
                  label="Activer les notifications push"
                  checked={checked2}
                  onChange={e => setChecked2(e.target.checked)}
                  hint="Requiert l'autorisation dans les paramètres."
                />
                <Checkbox
                  label="Option désactivée"
                  disabled
                  checked={false}
                  onChange={() => {}}
                />
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Radio Group</p>
              <RadioGroup label="Fréquence d'entraînement" hint="Vous pouvez modifier cela à tout moment.">
                {["a", "b", "c"].map((v, i) => (
                  <Radio
                    key={v}
                    label={["Chaque jour (recommandé)", "3 fois par semaine", "Occasionnellement"][i]}
                    name="frequency"
                    value={v}
                    checked={radioVal === v}
                    onChange={() => setRadioVal(v)}
                  />
                ))}
              </RadioGroup>
            </div>
          </div>
        </Section>

        {/* ══ CARDS ════════════════════════════════════════════ */}
        <Section title="Composants — Card (.cc-card)">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Default */}
            <div className="cc-card">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--cc-text-muted)" }}>Défaut</p>
              <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Quiz interactif</p>
              <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>40 questions, niveaux 1-3.</p>
            </div>
            {/* Elevated */}
            <div className="cc-card cc-card-elevated">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--cc-text-muted)" }}>Elevated</p>
              <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Score moyen</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--cc-primary)" }}>78%</p>
            </div>
            {/* Interactive */}
            <div className="cc-card cc-card-interactive">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--cc-text-muted)" }}>Interactive (hover)</p>
              <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Commencer le quiz</p>
              <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>↑ Survole-moi</p>
            </div>
            {/* Featured */}
            <div className="cc-card cc-card-featured">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--cc-text-muted)" }}>Featured</p>
              <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Barre bleue en haut</p>
              <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>Mise en avant éditoriale</p>
            </div>
          </div>
        </Section>

        {/* ══ BADGES ═══════════════════════════════════════════ */}
        <Section title="Composants — Badge (.cc-badge)">
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Filled (défaut)</p>
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="cc-badge cc-badge-info">En cours</span>
            <span className="cc-badge cc-badge-success">Réussi</span>
            <span className="cc-badge cc-badge-warning">À retravailler</span>
            <span className="cc-badge cc-badge-danger">Erreur</span>
            <span className="cc-badge cc-badge-neutral">Neutre</span>
          </div>

          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Outline (.cc-badge-outline-*)</p>
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="cc-badge cc-badge-outline-info">Info</span>
            <span className="cc-badge cc-badge-outline-success">Succès</span>
            <span className="cc-badge cc-badge-outline-warning">Avertissement</span>
            <span className="cc-badge cc-badge-outline-danger">Danger</span>
            <span className="cc-badge cc-badge-outline-neutral">Neutre</span>
          </div>

          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Tailles (.cc-badge-sm / défaut / .cc-badge-lg)</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="cc-badge cc-badge-info cc-badge-sm">Petit</span>
            <span className="cc-badge cc-badge-info">Moyen</span>
            <span className="cc-badge cc-badge-info cc-badge-lg">Grand</span>
          </div>
        </Section>

        {/* ══ ALERTS ═══════════════════════════════════════════ */}
        <Section title="Composants — Alert">
          <div className="space-y-3">
            <Alert variant="info" title="Mise à jour du programme">
              Le programme officiel 2026 est désormais en vigueur. Vos questions ont été mises à jour.
            </Alert>
            <Alert variant="success" title="Bravo ! Examen blanc réussi">
              Vous avez obtenu 36/40 — au-dessus du seuil requis. Continuez à réviser pour être sûr(e).
            </Alert>
            <Alert variant="warning" title="Session expirée">
              Votre session a expiré après 30 minutes d'inactivité. Vos progrès ont été sauvegardés.
            </Alert>
            <Alert variant="danger" title="Paiement refusé">
              Votre carte bancaire a été refusée. Vérifiez vos informations ou contactez votre banque.
            </Alert>
            <Alert variant="info" dismissible>
              Astuce : activez les notifications pour ne pas manquer votre entraînement quotidien.
            </Alert>
            <Alert variant="success" noIcon>
              Sans icône — pour les messages simples et discrets.
            </Alert>
          </div>
        </Section>

        {/* ══ PROGRESS BAR ═════════════════════════════════════ */}
        <Section title="Composants — ProgressBar">
          <div className="space-y-5 max-w-lg">
            <ProgressBar value={72} label="Progression globale" showLabel variant="primary" />
            <ProgressBar value={88} label="Valeurs de la République" showLabel variant="success" />
            <ProgressBar value={41} label="Histoire de France" showLabel variant="warning" />
            <ProgressBar value={18} label="Institutions européennes" showLabel variant="danger" />

            <div className="pt-2">
              <p className="mb-3 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Tailles (sm / md / lg)</p>
              <div className="space-y-3">
                <ProgressBar value={60} size="sm" variant="primary" label="Petite" />
                <ProgressBar value={60} size="md" variant="primary" label="Moyenne" />
                <ProgressBar value={60} size="lg" variant="primary" label="Grande" />
              </div>
            </div>
          </div>
        </Section>

        {/* ══ NOTICE ═══════════════════════════════════════════ */}
        <Section title="Composants — Notice (.cc-notice)">
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
                <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Bonne réponse ✓</p>
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
                <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>Mauvaise réponse ✗</p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--cc-text-muted)" }}>
                  Le droit de vote aux élections locales n'est pas accordé aux résidents étrangers hors UE.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ══ PREMIUM GATE ═════════════════════════════════════ */}
        <Section title="Composants — PremiumGate">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Locked */}
            <div>
              <p className="mb-2 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>État verrouillé (locked)</p>
              <PremiumGate
                locked
                title="Contenu Premium"
                description="Passez en Premium pour accéder aux 400 cartes Scroll et à l'IA illimitée."
                ctaLabel="Débloquer Premium →"
                onUnlock={() => alert("→ /pricing")}
              >
                <div className="cc-card space-y-3">
                  <p className="font-semibold" style={{ color: "var(--cc-text)" }}>Flash-card Premium</p>
                  <p className="text-sm" style={{ color: "var(--cc-text-muted)" }}>La Marseillaise, hymne national français, a été composée en 1792 par Rouget de Lisle à Strasbourg pendant la Révolution française.</p>
                  <div className="flex gap-2">
                    <span className="cc-badge cc-badge-info">Histoire</span>
                    <span className="cc-badge cc-badge-neutral">Niveau 2</span>
                  </div>
                </div>
              </PremiumGate>
            </div>

            {/* Unlocked */}
            <div>
              <p className="mb-2 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>État déverrouillé (locked=false)</p>
              <PremiumGate locked={false}>
                <div className="cc-card space-y-3">
                  <p className="font-semibold" style={{ color: "var(--cc-text)" }}>Flash-card accessible</p>
                  <p className="text-sm" style={{ color: "var(--cc-text-muted)" }}>La Marseillaise, hymne national français, a été composée en 1792 par Rouget de Lisle à Strasbourg pendant la Révolution française.</p>
                  <div className="flex gap-2">
                    <span className="cc-badge cc-badge-info">Histoire</span>
                    <span className="cc-badge cc-badge-neutral">Niveau 2</span>
                  </div>
                </div>
              </PremiumGate>
            </div>
          </div>
        </Section>

        {/* ══ HEADER / NAV ═════════════════════════════════════ */}
        <Section title="Composants — Header / Navigation">
          {/* Aperçu simplifié de la navbar */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--cc-border)" }}
          >
            {/* Barre de nav simulée */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)" }}
            >
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-7 overflow-hidden rounded-sm border" style={{ borderColor: "var(--cc-border)" }}>
                  <span className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
                  <span className="flex-1 bg-white" />
                  <span className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
                </span>
                <span className="font-bold text-sm" style={{ color: "var(--cc-text)" }}>Cap Citoyen</span>
              </div>
              {/* Nav links */}
              <div className="hidden sm:flex items-center gap-5 text-sm">
                {["Quiz", "Flash-cards", "Podcasts", "Ressources"].map(link => (
                  <span
                    key={link}
                    className="cursor-pointer hover:underline"
                    style={{ color: "var(--cc-text-muted)" }}
                  >
                    {link}
                  </span>
                ))}
              </div>
              {/* CTA */}
              <button className="cc-btn cc-btn-primary cc-btn-sm">S'abonner</button>
            </div>
            <div
              className="px-5 py-3 text-xs"
              style={{ background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
            >
              ↑ Header composant — sticky, fond <code className="font-mono">--cc-surface</code>, bordure <code className="font-mono">--cc-border</code>. Logo tricolore + liens + CTA.
            </div>
          </div>
        </Section>

        {/* ══ FOOTER ═══════════════════════════════════════════ */}
        <Section title="Composants — Footer">
          <p className="mb-4 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Version compacte (compact=true) — pages intérieures</p>
          <div className="rounded-xl border overflow-hidden mb-8" style={{ borderColor: "var(--cc-border)" }}>
            <Footer compact />
          </div>

          <p className="mb-4 text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Version complète — page d'accueil / landing</p>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--cc-border)" }}>
            <Footer />
          </div>
        </Section>

        {/* ══ PRICING CARDS ════════════════════════════════════ */}
        <Section title="Composants — PricingCard">
          <div className="grid gap-5 sm:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <PricingCard
                key={plan.name}
                name={plan.name}
                tagline={plan.tagline}
                badge={"badge" in plan ? plan.badge : undefined}
                price={plan.price}
                period={plan.period}
                priceNote={"priceNote" in plan ? plan.priceNote : undefined}
                features={[...plan.features]}
                ctaLabel={plan.ctaLabel}
                highlighted={plan.highlighted}
                onCta={() => {}}
              />
            ))}
          </div>
        </Section>

        {/* ══ ACCESSIBILITÉ ════════════════════════════════════ */}
        <Section title="Accessibilité — Focus visible">
          <div className="flex flex-wrap gap-4">
            <button
              className="cc-btn cc-btn-primary"
              style={{
                outline: "2px solid var(--cc-primary)",
                outlineOffset: "2px",
                boxShadow: "0 0 0 2px var(--cc-surface), 0 0 0 4px var(--cc-primary)",
              }}
            >
              Simulation focus
            </button>
            <p className="self-center text-sm" style={{ color: "var(--cc-text-muted)" }}>
              Double anneau : 2px surface + 4px primary — visible sur fond clair ET foncé.
            </p>
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
            <p className="text-xs" style={{ color: "var(--cc-text-muted)" }}>
              <code className="rounded px-1" style={{ background: "var(--cc-surface-alt)" }}>var(--cc-flag-blue)</code> et{" "}
              <code className="rounded px-1" style={{ background: "var(--cc-surface-alt)" }}>var(--cc-flag-red)</code> — invariantes en mode nuit.
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
          Cap Citoyen Design System — Étape 2 · Composants de base ·{" "}
          <span className="font-mono">Button · Input · Select · Checkbox · Radio · Card · Badge · Alert · ProgressBar · Header · Footer · PremiumGate · PricingCard</span>
        </p>
      </div>
    </div>
  );
}
