import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400/40";

  const styles = {
    primary:
      "border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_16px_35px_rgba(37,99,235,0.34)] active:translate-y-0",

    secondary:
      "border border-white/10 bg-slate-800/80 text-slate-100 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:border-blue-400/25 hover:bg-slate-700/85 hover:shadow-[0_0_0_1px_rgba(96,165,250,0.06),0_12px_30px_rgba(2,8,23,0.25)] active:translate-y-0",

    danger:
      "border border-red-400/20 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_10px_30px_rgba(220,38,38,0.22)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_16px_35px_rgba(220,38,38,0.3)] active:translate-y-0",
  };

  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}