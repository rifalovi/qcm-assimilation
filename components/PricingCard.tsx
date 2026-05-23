"use client";

import React from "react";

/* ── Icônes ────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, color: "var(--cc-success)" }}
    >
      <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.12" />
      <path
        d="M4.5 8l2.5 2.5L11.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, color: "var(--cc-text-disabled)" }}
    >
      <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.08" />
      <path
        d="M5.5 5.5l5 5M10.5 5.5l-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Types ─────────────────────────────────────────────────── */
export type PricingFeature = {
  label: string;
  included: boolean;
};

export type PricingCardProps = {
  /** Nom du plan */
  name: string;
  /** Sous-titre court (ex: "Examen imminent") */
  tagline?: string;
  /** Badge affiché en tête de carte (ex: "Recommandé") */
  badge?: string;
  /** Prix affiché (ex: "9,99 €", "Offert") */
  price: string;
  /** Période (ex: "/ 7 jours", "/ 30 jours") */
  period?: string;
  /** Callout mis en valeur sous le prix (ex: "4× plus de temps pour 2× le prix") */
  mention?: string;
  /** Liste de fonctionnalités */
  features: PricingFeature[];
  /** Label du CTA */
  ctaLabel?: string;
  /** Action du CTA */
  onCta?: () => void;
  /** Mise en avant (border primary + fond teinté) */
  highlighted?: boolean;
  /** Désactiver le CTA (ex: plan actuel) */
  ctaDisabled?: boolean;
  /** Label alternatif si ctaDisabled */
  ctaDisabledLabel?: string;
  className?: string;
};

export default function PricingCard({
  name,
  tagline,
  badge,
  price,
  period,
  mention,
  features,
  ctaLabel = "Choisir ce pass",
  onCta,
  highlighted = false,
  ctaDisabled = false,
  ctaDisabledLabel,
  className = "",
}: PricingCardProps) {
  return (
    <div
      className={`cc-pricing-card ${highlighted ? "cc-pricing-card-highlighted" : ""} ${className}`}
    >
      {/* Badge */}
      {badge && (
        <div className="cc-pricing-card-badge-row">
          <span className={`cc-badge ${highlighted ? "cc-badge-info" : "cc-badge-neutral"}`}>
            {badge}
          </span>
        </div>
      )}

      {/* En-tête plan */}
      <div className="cc-pricing-card-header">
        <p className="cc-pricing-card-name">{name}</p>
        {tagline && <p className="cc-pricing-card-tagline">{tagline}</p>}
      </div>

      {/* Prix */}
      <div className="cc-pricing-card-price-block">
        <span className="cc-pricing-card-price">{price}</span>
        {period && <span className="cc-pricing-card-period">{period}</span>}
      </div>

      {/* Callout mention */}
      {mention && (
        <p className="cc-pricing-card-mention">{mention}</p>
      )}

      {/* CTA */}
      <button
        onClick={onCta}
        disabled={ctaDisabled}
        className={`cc-btn w-full ${highlighted ? "cc-btn-primary" : "cc-btn-secondary"} mt-5`}
      >
        {ctaDisabled && ctaDisabledLabel ? ctaDisabledLabel : ctaLabel}
      </button>

      {/* Séparateur */}
      <div
        className="my-5"
        style={{ borderTop: "1px solid var(--cc-border)" }}
      />

      {/* Fonctionnalités */}
      <ul className="cc-pricing-card-features">
        {features.map((f, i) => (
          <li key={i} className="cc-pricing-card-feature">
            {f.included ? <CheckIcon /> : <CrossIcon />}
            <span
              style={{
                color: f.included ? "var(--cc-text)" : "var(--cc-text-disabled)",
              }}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
