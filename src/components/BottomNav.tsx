"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const tabs = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: null, label: "Entraîner", icon: "📝" },
  { href: "/exam", label: "Examen", icon: "🎯" },
  { href: null, label: "Stats", icon: "📊" },
  { href: "/account", label: "Compte", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showStatsMenu, setShowStatsMenu] = useState(false);
  const [showTrainMenu, setShowTrainMenu] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-900/95 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg relative">
          {tabs.map((tab) => {
            const active = tab.href
              ? pathname === tab.href
              : tab.label === "Stats"
              ? pathname === "/results" || pathname === "/leaderboard"
              : tab.label === "Entraîner"
              ? pathname === "/quiz" || pathname === "/scroll"
              : false;

            if (tab.label === "Entraîner") {
              return (
                <button
                  key="train"
                  onClick={() => setShowTrainMenu(true)}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition relative ${
                    active ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className={active ? "font-semibold" : ""}>{tab.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            }

            if (tab.label === "Stats") {
              return (
                <button
                  key="stats"
                  onClick={() => setShowStatsMenu(true)}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition relative ${
                    active ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className={active ? "font-semibold" : ""}>{tab.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href!}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition relative ${
                  active ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className={active ? "font-semibold" : ""}>{tab.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-blue-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Popup Entraîner */}
      {showTrainMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end md:hidden"
          onClick={() => setShowTrainMenu(false)}
        >
          <div
            className="w-full rounded-t-[2rem] border border-white/10 bg-slate-900/98 p-5 pb-8 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Mode d'apprentissage</p>
              <button onClick={() => setShowTrainMenu(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { router.push("/scroll"); setShowTrainMenu(false); }}
                className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
              >
                <span className="text-xl">🚀</span>
                <div className="text-left">
                  <p className="font-semibold">Réviser</p>
                  <p className="text-xs text-slate-400">Flash-cards thématiques</p>
                </div>
              </button>
              <button
                onClick={() => { router.push("/quiz"); setShowTrainMenu(false); }}
                className="flex items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3.5 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20"
              >
                <span className="text-xl">✏️</span>
                <div className="text-left">
                  <p className="font-semibold">S'entraîner</p>
                  <p className="text-xs text-slate-400">QCM chronométré</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Stats */}
      {showStatsMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end md:hidden"
          onClick={() => setShowStatsMenu(false)}
        >
          <div
            className="w-full rounded-t-[2rem] border border-white/10 bg-slate-900/98 p-5 pb-8 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Statistiques</p>
              <button onClick={() => setShowStatsMenu(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { router.push("/results"); setShowStatsMenu(false); }}
                className="flex items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3.5 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20"
              >
                <span className="text-xl">📈</span>
                <div className="text-left">
                  <p className="font-semibold">Mes résultats</p>
                  <p className="text-xs text-slate-400">Entraînement & Examen</p>
                </div>
              </button>
              <button
                onClick={() => { router.push("/leaderboard"); setShowStatsMenu(false); }}
                className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
              >
                <span className="text-xl">🏆</span>
                <div className="text-left">
                  <p className="font-semibold">Classement</p>
                  <p className="text-xs text-slate-400">Comparez vos scores</p>
                </div>
              </button>
              <button
  onClick={() => { router.push("/pricing"); setShowStatsMenu(false); }}
  className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
>
  <span className="text-xl">👑</span>
  <div className="text-left">
    <p className="font-semibold">Tarifs & Abonnements</p>
    <p className="text-xs text-slate-400">Voir les plans disponibles</p>
  </div>
</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}