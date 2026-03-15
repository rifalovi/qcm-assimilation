"use client";

import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            🇫🇷 QCM Assimilation
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="hidden sm:block">Plateforme d'entraînement</span>
        </div>
      </div>
    </header>
  );
}