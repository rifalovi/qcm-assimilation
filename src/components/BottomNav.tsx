"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "../../app/components/UserContext";

const tabs = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: null, label: "Préparation", icon: "📚" },
  { href: "/exam", label: "Examen", icon: "🎯" },
  { href: null, label: "Communauté", icon: "👥" },
  { href: null, label: "Info", icon: "ℹ️" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useUser();
  const [showStatsMenu, setShowStatsMenu] = useState(false);
  const [showTrainMenu, setShowTrainMenu] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [showCommunityMenu, setShowCommunityMenu] = useState(false);

  const isPremium = ['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(role ?? '')

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-900/95 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg relative">
          {tabs.map((tab) => {
            const active = tab.href
              ? pathname === tab.href
              : tab.label === "Préparation"
              ? pathname === "/quiz" || pathname === "/scroll" || pathname === "/audio"
              : tab.label === "Communauté"
              ? pathname.startsWith("/communaute")
              : tab.label === "Info"
              ? pathname === "/resources" || pathname === "/info"
              : false;

            if (tab.label === "Préparation") {
              return (
                <button key="train" onClick={() => setShowTrainMenu(true)}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition relative ${active ? "text-blue-400" : "text-slate-400 hover:text-slate-200"}`}>
                  <span className="text-xl">{tab.icon}</span>
                  <span className={active ? "font-semibold" : ""}>{tab.label}</span>
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-blue-400" />}
                </button>
              );
            }

            if (tab.label === "Communauté") {
              return (
                <button key="community" onClick={() => isPremium ? setShowCommunityMenu(true) : router.push('/pricing')}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition relative ${active ? "text-teal-400" : "text-slate-400 hover:text-slate-200"}`}>
                  <span className="text-xl">{tab.icon}</span>
                  <span className={active ? "font-semibold" : ""}>{tab.label}</span>
                  {!isPremium && <span className="absolute top-1.5 right-3 text-[8px] bg-amber-500 text-black px-1 rounded-full font-bold">PRO</span>}
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-teal-400" />}
                </button>
              );
            }

            if (tab.label === "Info") {
              return (
                <button key="info" onClick={() => setShowInfoMenu(true)}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition relative ${active ? "text-blue-400" : "text-slate-400 hover:text-slate-200"}`}>
                  <span className="text-xl">{tab.icon}</span>
                  <span className={active ? "font-semibold" : ""}>{tab.label}</span>
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-blue-400" />}
                </button>
              );
            }

            return (
              <Link key={tab.href} href={tab.href!}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition relative ${active ? "text-blue-400" : "text-slate-400 hover:text-slate-200"}`}>
                <span className="text-xl">{tab.icon}</span>
                <span className={active ? "font-semibold" : ""}>{tab.label}</span>
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-blue-400" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Popup Préparation */}
      {showTrainMenu && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowTrainMenu(false)}>
          <div className="w-full rounded-t-[2rem] border border-white/10 bg-slate-900/98 p-5 pb-8 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Préparation</p>
              <button onClick={() => setShowTrainMenu(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: "📱", label: "Réviser les cartes", desc: "Flash-cards thématiques", href: "/scroll", color: "border-amber-400/20 bg-amber-500/10 text-amber-200" },
                { icon: "🎧", label: "Bibliothèque Audio", desc: "100 épisodes guidés", href: "/audio", color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" },
                { icon: "🎯", label: "Passer un test", desc: "QCM chronométré", href: "/quiz", color: "border-blue-400/20 bg-blue-500/10 text-blue-200" },
              ].map(({ icon, label, desc, href, color }) => (
                <button key={href} onClick={() => { router.push(href); setShowTrainMenu(false); }}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition hover:opacity-90 ${color}`}>
                  <span className="text-xl">{icon}</span>
                  <div className="text-left">
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
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
          <div className="w-full rounded-t-[2rem] border border-white/10 bg-slate-900/98 p-5 pb-8 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Communauté</p>
              <button onClick={() => setShowCommunityMenu(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: "🏠", label: "Espace communauté", desc: "Hub & statistiques", href: "/communaute", color: "border-teal-400/20 bg-teal-500/10 text-teal-200" },
                { icon: "💬", label: "Retours d'expériences", desc: "Témoignages de candidats", href: "/communaute/temoignages", color: "border-teal-400/20 bg-teal-500/10 text-teal-200" },
                { icon: "🗣️", label: "Forum", desc: "Questions & conseils", href: "/communaute/forum", color: "border-orange-400/20 bg-orange-500/10 text-orange-200" },
                { icon: "✉️", label: "Messages privés", desc: "Échangez en privé", href: "/communaute/messages", color: "border-blue-400/20 bg-blue-500/10 text-blue-200" },
              ].map(({ icon, label, desc, href, color }) => (
                <button key={href} onClick={() => { router.push(href); setShowCommunityMenu(false); }}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition hover:opacity-90 ${color}`}>
                  <span className="text-xl">{icon}</span>
                  <div className="text-left">
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popup Info */}
      {showInfoMenu && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowInfoMenu(false)}>
          <div className="w-full rounded-t-[2rem] border border-white/10 bg-slate-900/98 p-5 pb-8 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Point info</p>
              <button onClick={() => setShowInfoMenu(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: "📈", label: "Mes résultats", desc: "Entraînement & Examen", href: "/results", color: "border-blue-400/20 bg-blue-500/10 text-blue-200" },
                { icon: "🏆", label: "Classement", desc: "Comparez vos scores", href: "/leaderboard", color: "border-amber-400/20 bg-amber-500/10 text-amber-200" },
                { icon: "🏛️", label: "Ressources", desc: "Documents officiels", href: "/resources", color: "border-blue-400/20 bg-blue-500/10 text-blue-200" },
                { icon: "📖", label: "À propos du QCM", desc: "Comprendre l'examen", href: "/info", color: "border-violet-400/20 bg-violet-500/10 text-violet-200" },
                { icon: "👑", label: "Tarifs & Abonnements", desc: "Voir les plans", href: "/pricing", color: "border-amber-400/20 bg-amber-500/10 text-amber-200" },
              ].map(({ icon, label, desc, href, color }) => (
                <button key={href} onClick={() => { router.push(href); setShowInfoMenu(false); }}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition hover:opacity-90 ${color}`}>
                  <span className="text-xl">{icon}</span>
                  <div className="text-left">
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
