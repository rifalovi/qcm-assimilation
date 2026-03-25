"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "./UserContext";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { username, role, loading, isAuthenticated, logout, email } = useUser();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Fermer le dropdown à chaque changement de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  if (pathname === "/") return null;

  const roleLabel = role === "elite" ? "👑 Élite" : role === "premium" ? "🎯 Premium" : role === "freemium" ? "✨ Freemium" : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            🇫🇷 Cap Citoyen
          </span>
        </Link>

        <div className="flex items-center gap-3 text-xs text-slate-400">

          {/* Lien Tarifs — caché si déjà sur /pricing */}
          {pathname !== "/pricing" && (
            <Link
              href="/pricing"
              className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-amber-300 hover:bg-amber-500/20 transition font-medium"
            >
              👑 Tarifs
            </Link>
          )}

          {/* Bouton compte avec dropdown */}
          {!loading && (
            isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                {/* Bouton trigger */}
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 hover:bg-white/10 transition"
                >
                  <span className="text-slate-400">👤</span>
                  <span className="font-medium">{username}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="transition-transform duration-200"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {open && (
                  <div
                    className="absolute right-0 top-full mt-2 w-44 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.50)]"
                    style={{
                      background: "linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(10,15,26,0.98) 100%)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    {/* En-tête profil */}
                    <div className="border-b border-white/10 px-3 py-2">
                      <p className="text-sm font-semibold text-white">{username}</p>
                      {roleLabel && (
                        <p className="mt-0.5 text-xs text-slate-400">{roleLabel}</p>
                      )}
                    </div>

                    {/* Navigation */}
                    <div className="py-2">
                      {[
                        ...(username && ["rifalovi@gmail.com"].includes(email ?? "") ? [{ href: "/dashboard", label: "Dashboard", icon: "📊" }] : []),
                        { href: "/", label: "Accueil", icon: "🏠" },
                        { href: "/scroll", label: "Réviser", icon: "📚" },
                        { href: "/quiz", label: "S'entraîner", icon: "🎯" },
                        { href: "/exam", label: "Examen blanc", icon: "📝" },
                        { href: "/audio", label: "Audio", icon: "🎧" },
                        { href: "/results", label: "Résultats", icon: "📊" },
                        { href: "/account", label: "Mon compte", icon: "👤" },
                        { href: "/resources", label: "Ressources", icon: "🏛️" },
                        { href: "/info", label: "Infos", icon: "ℹ️" },
                        { href: "/pricing", label: "Tarifs", icon: "👑" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                          <span className="text-sm">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Déconnexion */}
                    <div className="border-t border-white/10 py-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        <span className="text-base">🚪</span>
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 hover:bg-white/10 transition"
              >
                Se connecter
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
