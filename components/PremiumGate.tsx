"use client";

import React from "react";

type PremiumGateProps = {
  /** Le contenu à afficher (flouté si locked) */
  children: React.ReactNode;
  /** Si true, affiche le flou + overlay */
  locked?: boolean;
  /** Titre de l'overlay */
  title?: string;
  /** Description sous le titre */
  description?: string;
  /** CTA du bouton */
  ctaLabel?: string;
  /** Action au clic sur le CTA */
  onUnlock?: () => void;
  className?: string;
};

export default function PremiumGate({
  children,
  locked = true,
  title = "Contenu Premium",
  description = "Passez en Premium pour accéder à ce contenu.",
  ctaLabel = "Débloquer →",
  onUnlock,
  className = "",
}: PremiumGateProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className={`cc-premium-gate ${className}`}>
      {/* Contenu flouté */}
      <div className="cc-premium-gate-blur" aria-hidden="true">
        {children}
      </div>

      {/* Overlay */}
      <div className="cc-premium-gate-overlay">
        <div
          className="cc-premium-gate-icon"
          aria-hidden="true"
        >
          🔒
        </div>
        <p className="cc-premium-gate-title">{title}</p>
        <p className="cc-premium-gate-desc">{description}</p>
        <button
          onClick={onUnlock}
          className="cc-btn cc-btn-primary mt-4 px-5 py-2.5 text-sm"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
