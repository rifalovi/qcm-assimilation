"use client";
// ─────────────────────────────────────────────────────────────────────────────
// src/components/QuotaBar.tsx
// Barre de crédits quiz restants — visible pour les comptes freemium.
//
// Couleurs :
//   > 50 % restants  → --cc-success (vert)
//   20–50 % restants → --cc-warning (orange)
//   < 20 % restants  → --cc-danger  (rouge)
//
// Usage :
//   <QuotaBar credits={quiz_credits} max={20} rechargeDate="24 juin" />
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";

export type QuotaBarProps = {
  /** Crédits quiz restants */
  credits: number;
  /** Maximum du quota (20 pour freemium) */
  max: number;
  /** Date de recharge formatée, ex : "24 juin" — null si crédits non épuisés */
  rechargeDate?: string | null;
  className?: string;
};

export default function QuotaBar({
  credits,
  max,
  rechargeDate = null,
  className = "",
}: QuotaBarProps) {
  const pct = max > 0 ? Math.round((credits / max) * 100) : 0;

  // Couleur dynamique selon le pourcentage restant
  const color =
    pct > 50
      ? "var(--cc-success)"
      : pct >= 20
      ? "var(--cc-warning)"
      : "var(--cc-danger)";

  const isExhausted = credits <= 0;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span style={{ color: "var(--cc-text-muted)" }}>
          Crédits quiz
        </span>
        <span
          className="font-semibold tabular-nums"
          style={{ color: isExhausted ? "var(--cc-danger)" : color }}
        >
          {isExhausted ? "Épuisés" : `${credits} / ${max}`}
        </span>
      </div>

      {/* Barre de progression */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--cc-border)" }}
        role="progressbar"
        aria-valuenow={credits}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${credits} crédits quiz restants sur ${max}`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(0, pct)}%`,
            background: color,
            opacity: isExhausted ? 0.35 : 1,
          }}
        />
      </div>

      {/* Message de recharge si épuisé */}
      {isExhausted && rechargeDate && (
        <p className="text-[11px]" style={{ color: "var(--cc-text-disabled)" }}>
          Recharge le{" "}
          <span className="font-medium" style={{ color: "var(--cc-text-muted)" }}>
            {rechargeDate}
          </span>
          {" "}— ou{" "}
          <a
            href="/pricing"
            className="underline underline-offset-2"
            style={{ color: "var(--cc-primary)" }}
          >
            continuer avec un Pass
          </a>
        </p>
      )}
    </div>
  );
}
