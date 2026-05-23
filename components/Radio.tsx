import React from "react";

type RadioProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
  hint?: string;
};

export default function Radio({ label, hint, className = "", id, ...props }: RadioProps) {
  const inputId = id ?? `radio-${Math.random().toString(36).slice(2)}`;

  return (
    <div>
      <label className={`cc-radio ${className}`} htmlFor={inputId}>
        <input type="radio" id={inputId} {...props} />
        <span className="cc-radio-label">{label}</span>
      </label>
      {hint && <p className="cc-hint mt-0.5 ml-7">{hint}</p>}
    </div>
  );
}

/* ─── Groupe Radio ─────────────────────────────────────────────── */
type RadioGroupProps = {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function RadioGroup({ label, hint, error, children, className = "" }: RadioGroupProps) {
  return (
    <fieldset className={`cc-field border-0 p-0 m-0 ${className}`}>
      {label && <legend className="cc-label mb-2">{label}</legend>}
      <div className="space-y-2">{children}</div>
      {hint  && !error && <p className="cc-hint mt-1">{hint}</p>}
      {error            && <p className="cc-error-msg mt-1" role="alert">{error}</p>}
    </fieldset>
  );
}
