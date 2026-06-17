"use client";

// Indicateur de chargement réutilisable (thème clair/sombre via tokens cc).
// Remplace les « Chargement… » en texte brut par un vrai spinner + label.
export default function Spinner({
  label = "Chargement…",
  fullScreen = false,
  className = "",
}: {
  label?: string | null;
  fullScreen?: boolean;
  className?: string;
}) {
  const inner = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className="h-9 w-9 animate-spin rounded-full border-[3px]"
        style={{ borderColor: "var(--cc-primary)", borderTopColor: "transparent" }}
      />
      {label && (
        <p className="text-sm" style={{ color: "var(--cc-text-muted)" }}>
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--cc-surface)" }}>
        {inner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-10">{inner}</div>;
}
