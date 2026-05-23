import React from "react";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
  hint?: string;
  error?: string;
};

export default function Checkbox({
  label,
  hint,
  error,
  className = "",
  id,
  ...props
}: CheckboxProps) {
  const inputId = id ?? `checkbox-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="cc-field">
      <label className={`cc-checkbox ${className}`} htmlFor={inputId}>
        <input type="checkbox" id={inputId} {...props} />
        <span className="cc-checkbox-label">{label}</span>
      </label>
      {hint  && !error && <p className="cc-hint">{hint}</p>}
      {error            && <p className="cc-error-msg" role="alert">{error}</p>}
    </div>
  );
}
