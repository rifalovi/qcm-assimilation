"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "../../app/components/UserContext";
import FeedbackModal from "../../app/components/FeedbackModal";

const tabs = [
  { label: "Accueil",      href: "/" },
  { label: "Préparation",  href: null },
  { label: "Audio",        href: null },
  { label: "Communauté",   href: null },
  { label: "Info",         href: null },
];

function NavIcon({ name }: { name: string }) {
  if (name === "Accueil") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
  if (name === "Préparation") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  );
  if (name === "Audio") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  );
  if (name === "Communauté") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useUser();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTrainMenu, setShowTrainMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showCommunityMenu, setShowCommunityMenu] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);

  if (pathname.startsWith('/admin')) return null;
  if (['/login', '/register', '/reset-password'].includes(pathname)) return null;
  if (pathname.match(/^\/communaute\/messages\/.+/)) return null;

  const isPremium = ['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(role ?? '');

  function isTabActive(label: string) {
    if (label === "Accueil") return pathname === "/";
    if (label === "Préparation") return ["/quiz", "/scroll", "/exam", "/results"].some(p => pathname.startsWith(p));
    if (label === "Audio") return pathname.startsWith("/audio");
    if (label === "Communauté") return pathname.startsWith("/communaute");
    if (label === "Info") return ["/leaderboard", "/resources", "/info", "/assistant"].some(p => pathname.startsWith(p));
    return false;
  }

  function handleTabPress(label: string) {
    if (label === "Accueil") router.push("/");
    else if (label === "Préparation") setShowTrainMenu(true);
    else if (label === "Audio") setShowAudioMenu(true);
    else if (label === "Communauté") isPremium ? setShowCommunityMenu(true) : router.push('/pricing');
    else if (label === "Info") setShowInfoMenu(true);
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--cc-border)] bg-[var(--cc-surface)] md:hidden"
        aria-label="Navigation principale mobile"
      >
        <div className="mx-auto flex max-w-lg">
          {tabs.map((tab) => {
            const active = isTabActive(tab.label);
            return (
              <button
                key={tab.label}
                onClick={() => handleTabPress(tab.label)}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-[var(--cc-primary)]" : "text-[var(--cc-text-muted)] hover:text-[var(--cc-text)]"
                }`}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
              >
                <NavIcon name={tab.label} />
                <span>{tab.label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-[var(--cc-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Popup Préparation */}
      {showTrainMenu && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowTrainMenu(false)}>
          <div className="w-full rounded-t border-t border-[var(--cc-border)] bg-[var(--cc-surface)] p-5 pb-8 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--cc-text)]">Se préparer</p>
              <button onClick={() => setShowTrainMenu(false)} className="text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] text-lg leading-none" aria-label="Fermer">×</button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Révision par fiches",   desc: "Flash-cards thématiques", href: "/scroll" },
                { label: "Entraînement QCM",       desc: "Tests chronométrés",       href: "/quiz" },
                { label: "Examen blanc",           desc: "Simulation officielle",    href: "/exam" },
                { label: "Mes résultats",          desc: "Entraînement et examens",  href: "/results" },
              ].map(({ label, desc, href }) => (
                <button key={href} onClick={() => { router.push(href); setShowTrainMenu(false); }}
                  className="flex items-start gap-3 rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3 text-left hover:border-[var(--cc-primary)] hover:bg-[var(--cc-primary-soft)] transition-colors">
                  <div>
                    <p className="text-sm font-bold text-[var(--cc-text)]">{label}</p>
                    <p className="text-xs text-[var(--cc-text-muted)]">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popup Audio */}
      {showAudioMenu && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowAudioMenu(false)}>
          <div className="w-full rounded-t border-t border-[var(--cc-border)] bg-[var(--cc-surface)] p-5 pb-8 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--cc-text)]">Bibliothèque audio</p>
              <button onClick={() => setShowAudioMenu(false)} className="text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] text-lg leading-none" aria-label="Fermer">×</button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Quiz audio guidé",    desc: "Questions d'intégration en voix",   href: "/audio/Quiz%20Audio/quiz_audio" },
                { label: "Séries thématiques",  desc: "100 épisodes, format entretien réel", href: "/audio" },
              ].map(({ label, desc, href }) => (
                <button key={href} onClick={() => { router.push(href); setShowAudioMenu(false); }}
                  className="flex items-start gap-3 rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3 text-left hover:border-[var(--cc-primary)] hover:bg-[var(--cc-primary-soft)] transition-colors">
                  <div>
                    <p className="text-sm font-bold text-[var(--cc-text)]">{label}</p>
                    <p className="text-xs text-[var(--cc-text-muted)]">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popup Communauté */}
      {showCommunityMenu && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowCommunityMenu(false)}>
          <div className="w-full rounded-t border-t border-[var(--cc-border)] bg-[var(--cc-surface)] p-5 pb-8 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--cc-text)]">Espace communauté</p>
              <button onClick={() => setShowCommunityMenu(false)} className="text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] text-lg leading-none" aria-label="Fermer">×</button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Hub communauté",       href: "/communaute" },
                { label: "Témoignages",          href: "/communaute/temoignages" },
                { label: "Forum",                href: "/communaute/forum" },
                { label: "Messages privés",      href: "/communaute/messages" },
              ].map(({ label, href }) => (
                <button key={href} onClick={() => { router.push(href); setShowCommunityMenu(false); }}
                  className="rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3 text-left text-sm font-bold text-[var(--cc-text)] hover:border-[var(--cc-primary)] hover:bg-[var(--cc-primary-soft)] transition-colors">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popup Info */}
      {showInfoMenu && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowInfoMenu(false)}>
          <div className="w-full rounded-t border-t border-[var(--cc-border)] bg-[var(--cc-surface)] p-5 pb-8 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--cc-text)]">Informations</p>
              <button onClick={() => setShowInfoMenu(false)} className="text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] text-lg leading-none" aria-label="Fermer">×</button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Assistant IA démarches", desc: "Questions sur la naturalisation", href: "/assistant" },
                { label: "Ressources officielles", desc: "Documents et liens utiles",       href: "/resources" },
                { label: "À propos de l'examen",   desc: "Comprendre l'entretien civique", href: "/info" },
                { label: "Abonnements",             desc: "Plans et tarifs",                href: "/pricing" },
              ].map(({ label, desc, href }) => (
                <button key={href} onClick={() => { router.push(href); setShowInfoMenu(false); }}
                  className="flex items-start gap-3 rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3 text-left hover:border-[var(--cc-primary)] hover:bg-[var(--cc-primary-soft)] transition-colors">
                  <div>
                    <p className="text-sm font-bold text-[var(--cc-text)]">{label}</p>
                    <p className="text-xs text-[var(--cc-text-muted)]">{desc}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setShowInfoMenu(false); setShowFeedback(true); }}
                className="rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3 text-left text-sm text-[var(--cc-text-muted)] hover:border-[var(--cc-primary)] hover:bg-[var(--cc-primary-soft)] transition-colors"
              >
                Évaluer le service
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}
