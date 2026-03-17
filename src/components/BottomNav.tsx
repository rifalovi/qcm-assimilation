"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/quiz", label: "Entraîner", icon: "📝" },
  { href: "/exam", label: "Examen", icon: "🎯" },
  { href: "/leaderboard", label: "Classement", icon: "🏆" },
  { href: "/account", label: "Compte", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-900/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition ${
                active
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className={active ? "font-semibold" : ""}>{tab.label}</span>
              {active && (
                <span className="absolute bottom-0 h-0.5 w-10 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}