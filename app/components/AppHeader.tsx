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

  if (pathname === "/" || pathname.startsWith("/admin")) return null;

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
                    className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.50)]"
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

                    {/* Admin */}
                    {['super_admin','admin','moderator'].includes(role ?? '') && (
                      <div className="px-2 pt-2">
                        <Link href="/admin" className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 transition">
                          <span className="w-7 h-7 rounded-lg bg-red-900/40 flex items-center justify-center text-sm flex-shrink-0">⚙️</span>
                          <div><p className="text-xs font-medium text-red-300">Administration</p><p className="text-xs text-slate-500">Dashboard & modération</p></div>
                        </Link>
                        <div className="my-2 h-px bg-white/6" />
                      </div>
                    )}

                    {/* Apprendre */}
                    <div className="px-2 pt-1">
                      <p className="text-xs text-slate-500 uppercase tracking-wider px-2 mb-1">Apprendre</p>
                      <div className="grid grid-cols-2 gap-0.5">
                        {[
                          { href: "/scroll", icon: "📱", label: "Réviser", sub: "Flash-cards" },
                          { href: "/quiz", icon: "🎯", label: "S'entraîner", sub: "QCM" },
                          { href: "/exam", icon: "📝", label: "Examen", sub: "Blanc" },
                          { href: "/audio", icon: "🎧", label: "Audio", sub: "100 épisodes" },
                        ].map(({ href, icon, label, sub }) => (
                          <Link key={href} href={href} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition">
                            <span className="w-8 h-8 rounded-lg bg-blue-900/40 flex items-center justify-center text-sm flex-shrink-0">{icon}</span>
                            <div><p className="text-sm text-slate-300">{label}</p><p className="text-xs text-slate-500">{sub}</p></div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Communauté */}
                    {['premium','elite','moderator','admin','super_admin'].includes(role ?? '') && (
                      <div className="px-2 pt-2">
                        <div className="my-1 h-px bg-white/6" />
                        <p className="text-xs text-slate-500 uppercase tracking-wider px-2 mb-1">Communauté</p>
                        <div className="grid grid-cols-2 gap-0.5">
                          {[
                            { href: "/communaute/temoignages", icon: "💬", label: "Témoignages", sub: "Retours" },
                            { href: "/communaute/forum", icon: "🗣️", label: "Forum", sub: "Discussions" },
                            { href: "/communaute/messages", icon: "✉️", label: "Messages", sub: "Privés" },
                            { href: "/communaute", icon: "👥", label: "Hub", sub: "Communauté" },
                          ].map(({ href, icon, label, sub }) => (
                            <Link key={href} href={href} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition">
                              <span className="w-8 h-8 rounded-lg bg-teal-900/40 flex items-center justify-center text-sm flex-shrink-0">{icon}</span>
                              <div><p className="text-sm text-slate-300">{label}</p><p className="text-xs text-slate-500">{sub}</p></div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Autres */}
                    <div className="px-2 pt-2">
                      <div className="my-1 h-px bg-white/6" />
                      <div className="grid grid-cols-2 gap-0.5">
                        {[
                          { href: "/results", icon: "📊", label: "Résultats" },
                          { href: "/account", icon: "👤", label: "Mon compte" },
                          { href: "/resources", icon: "🏛️", label: "Ressources" },
                          { href: "/pricing", icon: "👑", label: "Tarifs" },
                        ].map(({ href, icon, label }) => (
                          <Link key={href} href={href} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition">
                            <span className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-sm flex-shrink-0">{icon}</span>
                            <p className="text-sm text-slate-300">{label}</p>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Déconnexion */}
                    <div className="border-t border-white/10 px-2 py-2 mt-1">
                      <button onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-2 py-2 rounded-xl text-xs text-red-400 transition hover:bg-red-500/10">
                        <span>🚪</span>Déconnexion
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
