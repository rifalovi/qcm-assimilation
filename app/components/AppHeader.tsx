"use client";

import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  // ✅ Sur la home, on masque le header global (tu as déjà ton bandeau officiel)
  if (pathname === "/") return null;

  return (
    <header className="bg-white shadow-sm border-b">
  
    </header>
  );
}