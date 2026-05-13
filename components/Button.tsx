import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "sm" | "md" | "lg";
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClass = {
    primary:   "cc-btn cc-btn-primary",
    secondary: "cc-btn cc-btn-secondary",
    tertiary:  "cc-btn cc-btn-tertiary",
    danger:    "cc-btn cc-btn-danger",
  }[variant];

  return (
    <button
      className={`${variantClass} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
