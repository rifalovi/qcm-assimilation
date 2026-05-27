import React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
};

export default function Select({
  label,
  hint,
  error,
  required,
  placeholder,
  children,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="cc-field">
      {label && (
        <label htmlFor={selectId} className={`cc-label ${required ? "cc-label-required" : ""}`}>
          {label}
        </label>
      )}

      <select
        id={selectId}
        className={`cc-input w-full ${error ? "is-error" : ""} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>

      {hint && !error && <p className="cc-hint">{hint}</p>}
      {error           && <p className="cc-error-msg" role="alert">{error}</p>}
    </div>
  );
}
