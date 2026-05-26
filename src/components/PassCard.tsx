"use client";
// ─────────────────────────────────────────────────────────────────────────────
// src/components/PassCard.tsx
// Carte Pass Express / Pass Sérénité avec CTA Stripe.
//
// Appelle POST /api/stripe/checkout et redirige vers Stripe Checkout.
// Gère l'état de chargement pendant la redirection.
//
// Usage :
//   <PassCard type="express" />
//   <PassCard type="serenite" highlighted />
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import PricingCard from "../../components/PricingCard";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PassType = "express" | "serenite";

export type PassCardProps = {
  type: PassType;
  /** Met en avant la carte (bordure + fond primary) */
  highlighted?: boolean;
  /** Si true, affiche le bouton comme "Pass actif" et le désactive */
  isActive?: boolean;
  className?: string;
};

// ── Config statique des passes ────────────────────────────────────────────────

const PASS_CONFIG = {
  express: {
    name:    "Pass Express",
    tagline: "Examen dans moins d'une semaine",
    badge:   undefined as string | undefined,
    price:   "4,99 €",
    period:  "/ 7 jours",
    mention: "Accès complet, sans engagement",
    features: [
      { label: "Questions illimitées",             included: true  },
      { label: "Tous les niveaux (1, 2, 3)",       included: true  },
      { label: "Examens blancs illimités",          included: true  },
      { label: "Explications après chaque réponse",included: true  },
      { label: "Statistiques par thème",           included: true  },
      { label: "Recharge automatique",             included: false },
    ],
  },
  serenite: {
    name:    "Pass Sérénité",
    tagline: "Préparez-vous à votre rythme",
    badge:   "Recommandé" as string | undefined,
    price:   "9,99 €",
    period:  "/ 30 jours",
    mention: "2× plus de temps pour 2× le prix",
    features: [
      { label: "Questions illimitées",             included: true  },
      { label: "Tous les niveaux (1, 2, 3)",       included: true  },
      { label: "Examens blancs illimités",          included: true  },
      { label: "Explications après chaque réponse",included: true  },
      { label: "Statistiques par thème",           included: true  },
      { label: "Recharge automatique",             included: false },
    ],
  },
} as const satisfies Record<PassType, {
  name: string;
  tagline: string;
  badge: string | undefined;
  price: string;
  period: string;
  mention: string;
  features: { label: string; included: boolean }[];
}>;

// ── Composant ─────────────────────────────────────────────────────────────────

export default function PassCard({
  type,
  highlighted = false,
  isActive = false,
  className = "",
}: PassCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const config = PASS_CONFIG[type];

  async function handleCta() {
    if (isActive || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const { url } = await res.json() as { url: string };
      // Redirection vers Stripe Checkout — le setLoading reste vrai pendant la nav
      window.location.href = url;
    } catch (err: unknown) {
      setLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue. Réessayez dans quelques instants."
      );
    }
  }

  return (
    <div className={className}>
      <PricingCard
        name={config.name}
        tagline={config.tagline}
        badge={config.badge}
        price={config.price}
        period={config.period}
        mention={config.mention}
        features={[...config.features]}
        highlighted={highlighted}
        ctaLabel={loading ? "Redirection…" : "Choisir ce pass"}
        ctaDisabled={isActive || loading}
        ctaDisabledLabel={isActive ? "Pass actif" : "Redirection…"}
        onCta={handleCta}
      />

      {/* Message d'erreur sous la carte */}
      {error && (
        <p
          className="mt-2 text-center text-xs"
          role="alert"
          style={{ color: "var(--cc-danger)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
