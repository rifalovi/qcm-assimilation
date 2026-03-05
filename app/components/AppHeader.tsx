"use client";

import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  // ✅ Sur la home, on masque le header global (tu as déjà ton bandeau officiel)
  if (pathname === "/") return null;

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">

    </header>
  );
}
