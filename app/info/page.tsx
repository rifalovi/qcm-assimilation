"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SECTIONS = [
  {
    icon: "📋",
    color: "from-blue-500 to-blue-700",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    title: "Format de l'examen",
    items: [
      "40 questions à choix multiples",
      "4 réponses proposées par question",
      "1 seule réponse correcte",
      "Durée approximative : 45 minutes",
      "Seuil de réussite : 32/40 (80 %)",
    ],
  },
  {
    icon: "📚",
    color: "from-indigo-500 to-indigo-700",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-700",
    title: "Thèmes abordés",
    items: [
      "Les valeurs de la République",
      "Les institutions françaises",
      "Les symboles nationaux",
      "L'histoire de France",
      "Les droits et devoirs dans la société",
    ],
  },
  {
    icon: "🧑‍💼",
    color: "from-violet-500 to-violet-700",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-700",
    title: "Qui est concerné ?",
    items: [
      "Ressortissants non-européens souhaitant s'installer durablement",
      "Demandeurs d'une carte de séjour pluriannuelle (2 à 4 ans)",
      "Demandeurs d'une carte de résident (10 ans)",
      "Candidats à la naturalisation française",
    ],
  },
];

const SITUATIONS = [
  {
    num: "01",
    title: "Naturalisation française",
    description: "Les personnes demandant la nationalité par naturalisation doivent démontrer leur connaissance des valeurs et institutions. L'examen vient compléter l'évaluation du niveau de français et l'entretien en préfecture.",
    icon: "🏛️",
  },
  {
    num: "02",
    title: "Carte de séjour pluriannuelle",
    description: "L'examen peut être requis pour l'obtention d'une carte de séjour pluriannuelle, généralement valable entre 2 et 4 ans.",
    icon: "📄",
  },
  {
    num: "03",
    title: "Carte de résident",
    description: "Dans certains cas, la réussite de cet examen est demandée pour obtenir une carte de résident de 10 ans.",
    icon: "🪪",
  },
];

export default function InfoPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

      {/* ===== HERO PREMIUM ===== */}
      <div
        className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #1e3a8a 100%)" }}
      >
        {/* Tricolore top */}
        <div className="h-1.5 w-full flex">
          <div className="flex-1 bg-blue-600" />
          <div className="flex-1 bg-white/90" />
          <div className="flex-1 bg-red-600" />
        </div>

        {/* Déco */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative p-7 sm:p-10">
          {/* Top bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-blue-200/70 font-semibold">République Française</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex h-2.5 w-4 overflow-hidden rounded-sm border border-white/20">
                    <span className="w-1/3 bg-blue-600" /><span className="w-1/3 bg-white" /><span className="w-1/3 bg-red-600" />
                  </span>
                  <span className="text-xs text-white/70 font-semibold">FR</span>
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/20 border border-green-400/30 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-300">En vigueur depuis le 1er janvier 2026</span>
            </div>
          </div>

          {/* Titre */}
          <div className="text-center">
            <div className="text-sm font-bold uppercase tracking-widest text-blue-300/80 mb-3">FR — Examen civique</div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              L'examen civique
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                Informations essentielles
              </span>
            </h1>
            <p className="mt-5 text-blue-100/70 text-base max-w-xl mx-auto leading-relaxed">
              Comprendre le format, les thèmes et les conditions de l'examen civique
              avant de vous entraîner dans les meilleures conditions.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <button onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-400 hover:to-indigo-400 hover:scale-105 transition-all duration-200">
              ✏️ S'entraîner maintenant
            </button>
            <button onClick={() => router.push("/exam")}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 hover:scale-105 transition-all duration-200">
              🎯 Passer un examen blanc
            </button>
            <button onClick={() => router.push("/leaderboard")}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 hover:scale-105 transition-all duration-200">
              🏆 Classement
            </button>
          </div>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className={`grid grid-cols-3 gap-4 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {[
          { value: "40", label: "Questions", icon: "❓", color: "from-blue-500 to-blue-700" },
          { value: "80%", label: "Score requis", icon: "🎯", color: "from-green-500 to-emerald-600" },
          { value: "45 min", label: "Durée max", icon: "⏱️", color: "from-orange-500 to-amber-600" },
        ].map(({ value, label, icon, color }) => (
          <div key={label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-4 sm:p-5 text-center shadow-lg`}>
            <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10 blur-xl" />
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
            <div className="mt-1 text-xs sm:text-sm text-white/80 font-semibold">{label}</div>
          </div>
        ))}
      </div>

      {/* ===== FORMAT / THÈMES / QUI ===== */}
      <div className={`grid gap-5 sm:grid-cols-3 transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {SECTIONS.map((s) => (
          <div key={s.title}
            className={`rounded-2xl border ${s.border} ${s.bg} p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white text-lg shadow-md mb-4`}>
              {s.icon}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">{s.title}</h2>
            <ul className="space-y-2">
              {s.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ===== SITUATIONS OBLIGATOIRES ===== */}
      <div className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dans quelles situations ?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Contextes où l'examen civique est obligatoire</p>
          </div>
        </div>
        <div className="space-y-4">
          {SITUATIONS.map((s) => (
            <div key={s.title}
              className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-blue-50 dark:bg-blue-900/10 blur-2xl" />
              <div className="flex items-start gap-4">
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <div className="text-2xl">{s.icon}</div>
                  <div className="text-xs font-black text-slate-300 dark:text-slate-600">{s.num}</div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CAS D'EXEMPTION ===== */}
      <div className={`transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="relative overflow-hidden rounded-2xl border border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 shadow-sm">
          <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-amber-200/40 dark:bg-amber-700/10 blur-2xl" />
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚠️</span>
            <h2 className="font-bold text-amber-900 dark:text-amber-400 text-base">Cas où l'examen n'est pas demandé</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: "🔄", text: "Renouvellement d'un titre de séjour déjà obtenu" },
              { icon: "🇪🇺", text: "Citoyens de l'Union européenne" },
              { icon: "📜", text: "Certains statuts spécifiques prévus par la réglementation" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-2 rounded-xl bg-amber-100/60 dark:bg-amber-900/30 p-3 border border-amber-200 dark:border-amber-800">
                <span className="text-base shrink-0">{item.icon}</span>
                <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== AVANT / APRÈS 2026 ===== */}
      <div className={`transition-all duration-700 delay-[350ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-red-500 to-green-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Ce qui a changé en 2026</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-5">
            <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-red-200/40 dark:bg-red-800/20 blur-xl" />
            <div className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 px-3 py-1 mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400">Avant 2026</span>
            </div>
            <ul className="space-y-3">
              {["Pas d'examen national standardisé", "Connaissances évaluées en entretien préfecture uniquement", "Évaluation variable selon les agents"].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-red-900 dark:text-red-300">
                  <span className="mt-0.5 h-4 w-4 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center shrink-0 text-[10px] text-red-600 dark:text-red-400 font-bold">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5">
            <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-green-200/40 dark:bg-green-800/20 blur-xl" />
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 px-3 py-1 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-green-700 dark:text-green-400">Depuis 2026</span>
            </div>
            <ul className="space-y-3">
              {["Examen civique national sous forme de QCM", "Évaluation uniforme et structurée", "Résultats objectifs et reproductibles"].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-green-900 dark:text-green-300">
                  <span className="mt-0.5 h-4 w-4 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center shrink-0 text-[10px] text-green-600 dark:text-green-400 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ===== CTA FINAL ===== */}
      <div className={`transition-all duration-700 delay-[400ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="relative overflow-hidden rounded-3xl shadow-xl"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 50%, #312e81 100%)" }}>
          <div className="pointer-events-none absolute inset-0 opacity-5"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="relative p-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-3xl mb-5 mx-auto">
              🎯
            </div>
            <h2 className="text-2xl font-black text-white">Prêt à vous préparer ?</h2>
            <p className="mt-2 text-sm text-blue-200/70 max-w-md mx-auto leading-relaxed">
              Entraînez-vous avec des questions proches de l'examen et préparez-vous dans des conditions réelles.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <button onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-all duration-200">
                ✏️ Mode entraînement
              </button>
              <button onClick={() => router.push("/exam")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 hover:scale-105 transition-all duration-200">
                🎯 Examen blanc
              </button>
              <button onClick={() => router.push("/leaderboard")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 hover:scale-105 transition-all duration-200">
                🏆 Classement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RETOUR ===== */}
      <div className="flex justify-center pb-4">
        <button onClick={() => router.push("/")}
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
          Retour à l'accueil
        </button>
      </div>

    </main>
  );
}
