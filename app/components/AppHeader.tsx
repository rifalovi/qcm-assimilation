"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "./UserContext";
import FeedbackModal from "./FeedbackModal";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { username, role, loading, isAuthenticated, logout, email } = useUser();
  const [open, setOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { setOpen(false); }, [pathname]);

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  if (pathname === "/" || pathname === "/design-system" || pathname.startsWith("/admin") || pathname.match(/^\/communaute\/messages\/.+/)) return null;

  const roleLabel =
    role === "elite"   ? "Élite" :
    role === "premium" ? "Premium" :
    role === "freemium"? "Freemium" : null;

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full border-b border-[var(--cc-border)] bg-[var(--cc-surface)]"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">

        {/* Marque */}
        <Link
          href="/"
          className="flex items-center gap-3 no-underline"
          aria-label="Cap Citoyen — Accueil"
        >
          {/* Drapeau symbolique sobre */}
          <span className="flex h-6 w-9 overflow-hidden rounded-sm border border-[var(--cc-border)]" aria-hidden="true">
            <span className="flex-1 bg-[var(--cc-primary)]" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-[var(--cc-danger)]" />
          </span>
          <span className="text-sm font-bold tracking-wide text-[var(--cc-primary)]">
            Cap Citoyen
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm" aria-label="Navigation principale">

          {/* Assistant IA */}
          {pathname !== "/assistant" && (
            <Link
              href="/assistant"
              className="hidden sm:inline-flex items-center rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--cc-text)] no-underline hover:border-[var(--cc-primary)] hover:text-[var(--cc-primary)] transition-colors"
            >
              Assistant IA
            </Link>
          )}

          {/* Centre agréé */}
          <a
            href="https://www.cci.fr/formation/cci-formez-vous-avec-le-test-dintegration-republicaine"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--cc-text)] no-underline hover:border-[var(--cc-primary)] hover:text-[var(--cc-primary)] transition-colors"
          >
            Centre agréé
          </a>

          {/* Tarifs */}
          {pathname !== "/pricing" && (
            <Link
              href="/pricing"
              className="inline-flex items-center rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--cc-text)] no-underline hover:border-[var(--cc-primary)] hover:text-[var(--cc-primary)] transition-colors"
            >
              Abonnements
            </Link>
          )}

          {/* Compte */}
          {!loading && (
            isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                  className="flex items-center gap-2 rounded border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-1.5 text-xs font-medium text-[var(--cc-text)] hover:border-[var(--cc-primary)] hover:text-[var(--cc-primary)] transition-colors"
                  aria-expanded={open}
                  aria-haspopup="true"
                >
                  <span className="font-semibold">{username}</span>
                  {roleLabel && (
                    <span className="rounded bg-[var(--cc-primary-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--cc-primary)]">
                      {roleLabel}
                    </span>
                  )}
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {open && (
                  <div
                    className="absolute right-0 top-full mt-1 w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded border border-[var(--cc-border)] bg-[var(--cc-surface)] shadow-md"
                    role="menu"
                    aria-label="Menu utilisateur"
                  >
                    {/* Profil */}
                    <div className="border-b border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3">
                      <p className="text-sm font-bold text-[var(--cc-text)]">{username}</p>
                      {email && <p className="text-xs text-[var(--cc-text-muted)]">{email}</p>}
                      {roleLabel && (
                        <span className="mt-1 inline-block rounded bg-[var(--cc-primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--cc-primary)]">
                          {roleLabel}
                        </span>
                      )}
                    </div>

                    {/* Administration */}
                    {['super_admin','admin','moderator'].includes(role ?? '') && (
                      <div className="border-b border-[var(--cc-border)] p-2">
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 rounded px-2 py-2 text-xs font-medium text-[var(--cc-danger)] no-underline hover:bg-[var(--cc-danger-soft)] transition-colors"
                          role="menuitem"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
                          Administration
                        </Link>
                      </div>
                    )}

                    {/* Apprendre */}
                    <div className="p-2">
                      <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--cc-text-disabled)]">Se préparer</p>
                      {[
                        { href: "/scroll", label: "Révision par fiches" },
                        { href: "/quiz",   label: "Entraînement QCM" },
                        { href: "/exam",   label: "Examen blanc" },
                        { href: "/audio",  label: "Bibliothèque audio" },
                      ].map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-2 rounded px-2 py-2 text-sm text-[var(--cc-text)] no-underline hover:bg-[var(--cc-surface-alt)] transition-colors"
                          role="menuitem"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>

                    {/* Communauté */}
                    {['premium','elite','moderator','admin','super_admin'].includes(role ?? '') && (
                      <div className="border-t border-[var(--cc-border)] p-2">
                        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--cc-text-disabled)]">Communauté</p>
                        {[
                          { href: "/communaute/temoignages", label: "Témoignages" },
                          { href: "/communaute/forum",       label: "Forum" },
                          { href: "/communaute/messages",    label: "Messages privés" },
                        ].map(({ href, label }) => (
                          <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-2 rounded px-2 py-2 text-sm text-[var(--cc-text)] no-underline hover:bg-[var(--cc-surface-alt)] transition-colors"
                            role="menuitem"
                          >
                            {label}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Autres */}
                    <div className="border-t border-[var(--cc-border)] p-2">
                      {[
                        { href: "/results",   label: "Mes résultats" },
                        { href: "/assistant", label: "Assistant IA" },
                        { href: "/account",   label: "Mon compte" },
                        { href: "/resources", label: "Ressources" },
                        { href: "/pricing",   label: "Abonnements" },
                      ].map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-2 rounded px-2 py-2 text-sm text-[var(--cc-text)] no-underline hover:bg-[var(--cc-surface-alt)] transition-colors"
                          role="menuitem"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>

                    {/* Feedback & Déconnexion */}
                    <div className="border-t border-[var(--cc-border)] p-2">
                      <button
                        onClick={() => { setOpen(false); setShowFeedback(true); }}
                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[var(--cc-text-muted)] hover:bg-[var(--cc-surface-alt)] transition-colors"
                        role="menuitem"
                      >
                        Évaluer le service
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[var(--cc-danger)] hover:bg-[var(--cc-danger-soft)] transition-colors"
                        role="menuitem"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center rounded border px-3 py-1.5 text-xs font-bold no-underline transition hover:opacity-90"
                style={{
                  borderColor: "var(--cc-primary)",
                  background: "var(--cc-primary)",
                  color: "white",
                }}
              >
                Se connecter
              </Link>
            )
          )}
        </nav>
      </div>

      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />
    </header>
  );
}
