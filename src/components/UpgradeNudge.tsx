"use client";
// ─────────────────────────────────────────────────────────────────────────────
// src/components/UpgradeNudge.tsx
// Nudge de conversion — déclenché à épuisement ou à 80 % du quota consommé.
//
// Variantes :
//   inline  — bloc intégré dans la page (sous QuotaBar, entre des sections)
//   banner  — bandeau fixe en haut de page (sticky, z-index élevé)
//   modal   — overlay plein écran avec fond flouté
//
// Ton : bienveillant, jamais agressif. Pas de compte à rebours, pas de "offre
//       limitée", pas de pression. On informe et on propose.
//
// Usage :
//   <UpgradeNudge variant="banner" trigger="threshold" rechargeDate="24 juin" />
//   <UpgradeNudge variant="modal" trigger="exhausted" onDismiss={() => ...} />
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from "react";
import { X, Zap } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UpgradeNudgeVariant  = "inline" | "banner" | "modal";
export type UpgradeNudgeTrigger  = "threshold" | "exhausted";

export type UpgradeNudgeProps = {
  /** Variante d'affichage */
  variant?: UpgradeNudgeVariant;
  /** Contexte déclencheur — affecte le message */
  trigger?: UpgradeNudgeTrigger;
  /** Date de recharge formatée (ex : "24 juin") — affichée si crédits épuisés */
  rechargeDate?: string | null;
  /** Callback quand l'utilisateur ferme le nudge (banner et modal) */
  onDismiss?: () => void;
  /** Libellé du bouton secondaire du modal (défaut : "Continuer sans pass") */
  dismissLabel?: string;
  className?: string;
};

// ── Contenu selon le déclencheur ──────────────────────────────────────────────

function useNudgeContent(trigger: UpgradeNudgeTrigger, rechargeDate?: string | null) {
  if (trigger === "exhausted") {
    return {
      headline: "Vos crédits sont épuisés",
      body: rechargeDate
        ? `Votre quota mensuel se recharge le ${rechargeDate}. En attendant, un Pass vous donne un accès illimité.`
        : "Votre quota mensuel est atteint. Un Pass vous donne un accès illimité pour continuer à vous entraîner.",
      cta: "Voir les Passes",
    };
  }
  // threshold — proche de l'épuisement
  return {
    headline: "Il vous reste peu de crédits",
    body: "Continuez à vous entraîner sans limite avec un Pass. Accès complet à tous les niveaux, examens blancs et explications détaillées.",
    cta: "Découvrir les Passes",
  };
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function UpgradeNudge({
  variant = "inline",
  trigger = "threshold",
  rechargeDate = null,
  onDismiss,
  dismissLabel = "Continuer sans pass",
  className = "",
}: UpgradeNudgeProps) {
  const { headline, body, cta } = useNudgeContent(trigger, rechargeDate);
  const firstFocusRef = useRef<HTMLAnchorElement>(null);

  // Trap focus + Escape pour la variante modal
  useEffect(() => {
    if (variant !== "modal") return;
    firstFocusRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [variant, onDismiss]);

  // ── Variante INLINE ────────────────────────────────────────────────────────
  if (variant === "inline") {
    return (
      <div
        className={`rounded-xl border px-4 py-4 ${className}`}
        style={{
          borderColor: "var(--cc-primary)",
          background: "color-mix(in srgb, var(--cc-primary) 6%, var(--cc-surface))",
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icône */}
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "color-mix(in srgb, var(--cc-primary) 12%, var(--cc-surface))",
              color: "var(--cc-primary)",
            }}
          >
            <Zap size={16} />
          </span>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
              {headline}
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
              {body}
            </p>
          </div>
        </div>

        {/* CTA */}
        <a
          href="/pricing"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold no-underline transition hover:opacity-90"
          style={{
            background: "var(--cc-primary)",
            color: "white",
          }}
        >
          {cta} →
        </a>
      </div>
    );
  }

  // ── Variante BANNER ────────────────────────────────────────────────────────
  if (variant === "banner") {
    return (
      <div
        className={`sticky top-0 z-40 w-full px-4 py-2.5 ${className}`}
        style={{
          background: "color-mix(in srgb, var(--cc-primary) 10%, var(--cc-surface))",
          borderBottom: "1px solid var(--cc-primary)",
        }}
        role="alert"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Zap size={14} style={{ color: "var(--cc-primary)", flexShrink: 0 }} />
            <p className="truncate text-xs" style={{ color: "var(--cc-text)" }}>
              <span className="font-semibold">{headline}</span>
              {" — "}
              <a
                href="/pricing"
                className="underline underline-offset-2"
                style={{ color: "var(--cc-primary)" }}
              >
                {cta}
              </a>
            </p>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Fermer"
              className="shrink-0 rounded p-0.5 transition hover:opacity-70"
              style={{ color: "var(--cc-text-muted)", background: "none", border: "none" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Variante MODAL ─────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "color-mix(in srgb, var(--cc-text) 55%, transparent)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nudge-headline"
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss?.(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6"
        style={{
          background: "var(--cc-surface)",
          borderColor: "var(--cc-border)",
          boxShadow: "var(--cc-shadow-lg)",
        }}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "color-mix(in srgb, var(--cc-primary) 12%, var(--cc-surface))",
              color: "var(--cc-primary)",
            }}
          >
            <Zap size={20} />
          </span>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Fermer"
              className="rounded-lg p-1.5 transition hover:opacity-70"
              style={{ color: "var(--cc-text-muted)", background: "none", border: "none" }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Contenu */}
        <h2
          id="nudge-headline"
          className="mt-4 text-lg font-extrabold"
          style={{ color: "var(--cc-text)" }}
        >
          {headline}
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
          {body}
        </p>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-2">
          <a
            ref={firstFocusRef}
            href="/pricing"
            className="flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold no-underline transition hover:opacity-90"
            style={{ background: "var(--cc-primary)", color: "white" }}
          >
            {cta} →
          </a>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl px-4 py-2.5 text-sm transition hover:opacity-70"
              style={{
                background: "none",
                border: "1px solid var(--cc-border)",
                color: "var(--cc-text-muted)",
              }}
            >
              {dismissLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
