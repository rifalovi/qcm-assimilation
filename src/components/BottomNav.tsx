"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home, BookOpen, Headphones, Users, Info as InfoIcon,
  Layers, ClipboardCheck, GraduationCap, BarChart3,
  ListMusic, MessagesSquare, Mail, Star,
  Bot, FileText, CreditCard, MessageSquarePlus,
  type LucideIcon,
} from "lucide-react";
import { useUser } from "../../app/components/UserContext";
import FeedbackModal from "../../app/components/FeedbackModal";

type Tab = { label: string; tabIcon: LucideIcon };

const tabs: Tab[] = [
  { label: "Accueil",     tabIcon: Home },
  { label: "Préparation", tabIcon: BookOpen },
  { label: "Audio",       tabIcon: Headphones },
  { label: "Communauté",  tabIcon: Users },
  { label: "Info",        tabIcon: InfoIcon },
];

type MenuItem = { icon: LucideIcon; label: string; desc?: string; href?: string; action?: string };

const MENUS: Record<string, { title: string; items: MenuItem[] }> = {
  Préparation: {
    title: "Se préparer",
    items: [
      { icon: Layers,         label: "Révision par fiches", desc: "Flash-cards thématiques",  href: "/scroll" },
      { icon: ClipboardCheck, label: "Entraînement QCM",    desc: "Tests chronométrés",        href: "/quiz" },
      { icon: GraduationCap,  label: "Examen blanc",        desc: "Simulation officielle",     href: "/exam" },
      { icon: BarChart3,      label: "Mes résultats",       desc: "Entraînement et examens",   href: "/results" },
    ],
  },
  Audio: {
    title: "Bibliothèque audio",
    items: [
      { icon: Headphones, label: "Quiz audio guidé",   desc: "Questions d'intégration en voix",      href: "/audio/Quiz%20Audio/quiz_audio" },
      { icon: ListMusic,  label: "Séries thématiques", desc: "100 épisodes, format entretien réel",  href: "/audio" },
    ],
  },
  Communauté: {
    title: "Espace communauté",
    items: [
      { icon: Users,         label: "Hub communauté",  desc: "Actualités et entraide",    href: "/communaute" },
      { icon: Star,          label: "Témoignages",     desc: "Parcours de candidats",     href: "/communaute/temoignages" },
      { icon: MessagesSquare,label: "Forum",           desc: "Questions et discussions",  href: "/communaute/forum" },
      { icon: Mail,          label: "Messages privés", desc: "Échanges directs",          href: "/communaute/messages" },
    ],
  },
  Info: {
    title: "Informations",
    items: [
      { icon: Bot,                label: "Assistant IA démarches", desc: "Questions sur la naturalisation", href: "/assistant" },
      { icon: FileText,           label: "Ressources officielles", desc: "Documents et liens utiles",       href: "/resources" },
      { icon: InfoIcon,           label: "À propos de l'examen",   desc: "Comprendre l'entretien civique",  href: "/info" },
      { icon: CreditCard,         label: "Abonnements",            desc: "Plans et tarifs",                 href: "/pricing" },
      { icon: MessageSquarePlus,  label: "Évaluer le service",     desc: "Donnez votre avis",               action: "feedback" },
    ],
  },
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useUser();
  const [showFeedback, setShowFeedback] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

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
    else if (label === "Communauté" && !isPremium) router.push('/pricing');
    else setOpenMenu(label);
  }

  function handleItemPress(item: MenuItem) {
    setOpenMenu(null);
    if (item.action === "feedback") { setShowFeedback(true); return; }
    if (item.href) router.push(item.href);
  }

  const menu = openMenu ? MENUS[openMenu] : null;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--cc-border)] bg-[var(--cc-surface)] md:hidden"
        aria-label="Navigation principale mobile"
      >
        <div className="mx-auto flex max-w-lg">
          {tabs.map((tab) => {
            const active = isTabActive(tab.label);
            const TabIcon = tab.tabIcon;
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
                <TabIcon size={20} strokeWidth={2} aria-hidden="true" />
                <span>{tab.label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-[var(--cc-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom-sheet de fonctionnalités (modèle « icône pro + description ») */}
      {menu && (
        <div
          className="fixed inset-0 z-[70] flex items-end bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpenMenu(null)}
        >
          <div
            className="w-full rounded-t-3xl bg-[var(--cc-surface)] px-4 pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.25)]"
            style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full" style={{ background: "var(--cc-border-strong)" }} />
            <p className="mb-3 text-center text-base font-bold text-[var(--cc-text)]">{menu.title}</p>
            <div className="flex flex-col">
              {menu.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleItemPress(item)}
                    className="flex items-center gap-3.5 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-[var(--cc-surface-alt)] active:bg-[var(--cc-surface-alt)]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "var(--cc-surface-alt)", color: "var(--cc-text)" }}
                    >
                      <Icon size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-[var(--cc-text)]">{item.label}</span>
                      {item.desc && (
                        <span className="block text-[13px] leading-snug text-[var(--cc-text-muted)]">{item.desc}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}
