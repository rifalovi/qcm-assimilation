import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Icône à gauche (élément JSX, ex : une SVG 16×16) */
  prefixIcon?: React.ReactNode;
  /** Icône à droite */
  suffixIcon?: React.ReactNode;
};

export default function Input({
  label,
  hint,
  error,
  required,
  prefixIcon,
  suffixIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="cc-field">
      {label && (
        <label htmlFor={inputId} className={`cc-label ${required ? "cc-label-required" : ""}`}>
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {prefixIcon && (
          <span
            className="pointer-events-none absolute left-3 flex items-center"
            style={{ color: "var(--cc-text-disabled)" }}
          >
            {prefixIcon}
          </span>
        )}
        <input
          id={inputId}
          className={`cc-input ${error ? "is-error" : ""} ${prefixIcon ? "pl-9" : ""} ${suffixIcon ? "pr-9" : ""} ${className}`}
          {...props}
        />
        {suffixIcon && (
          <span
            className="pointer-events-none absolute right-3 flex items-center"
            style={{ color: "var(--cc-text-disabled)" }}
          >
            {suffixIcon}
          </span>
        )}
      </div>

      {hint && !error && <p className="cc-hint">{hint}</p>}
      {error           && <p className="cc-error-msg" role="alert">{error}</p>}
    </div>
  );
}
