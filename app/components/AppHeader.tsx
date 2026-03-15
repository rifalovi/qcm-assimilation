"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "./UserContext";

export default function AppHeader() {
  const pathname = usePathname();
  const { username, loading } = useUser();

  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            🇫🇷 QCM Assimilation
          </span>
        </Link>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          {!loading && (
            username ? (
              <Link href="/account"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 hover:bg-white/10 transition">
                <span className="text-slate-400">👤</span>
                <span className="font-medium">{username}</span>
              </Link>
            ) : (
              <Link href="/login"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 hover:bg-white/10 transition">
                Se connecter
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
