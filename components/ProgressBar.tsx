type ProgressBarVariant = "primary" | "success" | "warning" | "danger";
type ProgressBarSize = "sm" | "md" | "lg";

type ProgressBarProps = {
  /** Valeur courante (0 à total) */
  value: number;
  /** Valeur maximale (défaut 100) */
  total?: number;
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  /** Afficher le pourcentage à droite du label */
  showLabel?: boolean;
  label?: string;
  className?: string;
};

export default function ProgressBar({
  value,
  total = 100,
  variant = "primary",
  size = "md",
  showLabel = false,
  label,
  className = "",
}: ProgressBarProps) {
  const percent = total <= 0 ? 0 : Math.min(100, Math.max(0, (value / total) * 100));

  const sizeClass = { sm: "cc-progress-sm", md: "", lg: "cc-progress-lg" }[size];

  return (
    <div className={className}>
      {(label || showLabel) && (
        <div className="mb-1 flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium" style={{ color: "var(--cc-text-muted)" }}>
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--cc-text-muted)" }}>
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}
      <div className={`cc-progress ${sizeClass}`}>
        <div
          className={`cc-progress-fill cc-progress-${variant}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
