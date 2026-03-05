"use client";

import { useRouter } from "next/navigation";

// ===================== ICÔNES / DÉCORATIONS =====================

function FrenchFlag({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex overflow-hidden rounded-sm border border-slate-200 dark:border-slate-600 ${className}`}>
      <span className="w-1/3 bg-blue-700" />
      <span className="w-1/3 bg-white dark:bg-slate-100" />
      <span className="w-1/3 bg-red-600" />
    </span>
  );
}

function MarianneSVG() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 text-slate-700 dark:text-slate-200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8c8.5 0 15.5 7 15.5 15.5S40.5 39 32 39 16.5 32 16.5 23.5 23.5 8 32 8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M18 53c3.8-7.6 10.1-12 14-12s10.2 4.4 14 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 22c4-6 9-9 16-9 1.5 0 3 .2 4.3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Bonnet phrygien */}
      <path d="M24 17c2-4 5-7 8-7s6 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ===================== DONNÉES =====================

const STATS = [
  { value: "40", label: "Questions", icon: "📋" },
  { value: "80%", label: "Score requis", icon: "🎯" },
  { value: "45 min", label: "Durée", icon: "⏱️" },
  { value: "2026", label: "En vigueur depuis", icon: "📅" },
];

const FORMAT_ITEMS = [
  "40 questions à choix multiples (QCM)",
  "4 réponses proposées par question",
  "1 seule réponse correcte par question",
  "Durée approximative : 45 minutes",
  "Seuil de réussite : 32 bonnes réponses sur 40 (80 %)",
];

const THEMES_ITEMS = [
  "Les valeurs de la République française",
  "Les institutions françaises",
  "Les symboles nationaux",
  "L'histoire de France",
  "Les droits et devoirs dans la société",
  "Situations de la vie quotidienne",
];

const CONCERNES_ITEMS = [
  "Ressortissants non-européens souhaitant s'installer durablement",
  "Demandeurs d'une carte de séjour pluriannuelle (2 à 4 ans)",
  "Demandeurs d'une carte de résident (10 ans)",
  "Candidats à la naturalisation française",
];

const SITUATIONS = [
  {
    emoji: "🏛️",
    title: "Naturalisation française",
    description: "Les personnes demandant la nationalité par naturalisation doivent démontrer leur connaissance des valeurs et institutions. L'examen vient compléter l'évaluation du niveau de français et l'entretien en préfecture.",
  },
  {
    emoji: "📄",
    title: "Carte de séjour pluriannuelle",
    description: "L'examen peut être requis pour l'obtention d'une carte de séjour pluriannuelle, généralement valable entre 2 et 4 ans.",
  },
  {
    emoji: "🪪",
    title: "Carte de résident (10 ans)",
    description: "Dans certains cas, la réussite de cet examen est demandée pour obtenir une carte de résident de 10 ans.",
  },
];

const EXEMPTIONS = [
  "Renouvellement d'un titre de séjour déjà obtenu",
  "Citoyens de l'Union européenne",
  "Certains statuts spécifiques prévus par la réglementation",
];

const AVANT = [
  "Pas d'examen national standardisé",
  "Connaissances évaluées uniquement en entretien de préfecture",
  "Évaluation variable selon les agents",
];

const DEPUIS = [
  "Examen civique national sous forme de QCM",
  "Évaluation uniforme et structurée sur tout le territoire",
  "Résultats objectifs et reproductibles",
];

// ===================== PAGE =====================

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* ============================================================
          HERO OFFICIEL
      ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
        {/* Bande tricolore */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-white to-red-600" />

        {/* Halos */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-red-100/40 dark:bg-red-900/20 blur-3xl" />

        <div className="relative p-6 sm:p-8 lg:p-10">

          {/* TOP BAR officielle */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            {/* Logo RF */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center shadow-sm">
                <MarianneSVG />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">
                  République Française
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <FrenchFlag className="h-3.5 w-6" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">FR</span>
                </div>
              </div>
            </div>

            {/* Badge officiel */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              En vigueur depuis le 1er janvier 2026
            </div>
          </div>

          {/* TITRE PRINCIPAL */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              🇫🇷 L'examen civique
              <br />
              <span className="text-blue-700 dark:text-blue-400">Informations essentielles</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Comprendre le format, les thèmes et les conditions de l'examen civique
              avant de vous entraîner dans les meilleures conditions.
            </p>

            {/* BOUTONS CTA PRINCIPAUX */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => router.push("/train")}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105 hover:shadow-xl"
              >
                ✏️ S'entraîner maintenant
              </button>
              <button
                onClick={() => router.push("/exam")}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-6 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all hover:scale-105"
              >
                🎯 Passer un examen blanc
              </button>
              <button
                onClick={() => router.push("/leaderboard")}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-6 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all hover:scale-105"
              >
                🏆 Classement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          STATS CLÉS
      ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(({ value, label, icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400">{value}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* ============================================================
          FORMAT / THÈMES / QUI EST CONCERNÉ
      ============================================================ */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Format */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="text-2xl mb-3">📋</div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Format de l'examen</h2>
          <ul className="space-y-2.5">
            {FORMAT_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <span className="mt-0.5 text-blue-500 dark:text-blue-400 shrink-0 font-bold">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Thèmes */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="text-2xl mb-3">📚</div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Thèmes abordés</h2>
          <ul className="space-y-2.5">
            {THEMES_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <span className="mt-0.5 text-blue-500 dark:text-blue-400 shrink-0 font-bold">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Qui est concerné */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="text-2xl mb-3">🧑‍💼</div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Qui est concerné ?</h2>
          <ul className="space-y-2.5">
            {CONCERNES_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <span className="mt-0.5 text-blue-500 dark:text-blue-400 shrink-0 font-bold">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ============================================================
          SITUATIONS OBLIGATOIRES
      ============================================================ */}
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Dans quelles situations est-il obligatoire ?
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            L'examen civique peut être demandé dans plusieurs contextes administratifs.
          </p>
        </div>
        <div className="space-y-4">
          {SITUATIONS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
              <div className="text-2xl shrink-0">{s.emoji}</div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================
          CAS D'EXEMPTION
      ============================================================ */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-6">
        <h2 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2 mb-3">
          <span>⚠️</span> Cas où l'examen n'est pas demandé
        </h2>
        <ul className="space-y-2">
          {EXEMPTIONS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
              <span className="shrink-0 font-bold">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ============================================================
          AVANT / APRÈS 2026
      ============================================================ */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">
          Ce qui a changé en 2026
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-red-500 dark:text-red-400 mb-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-red-200 dark:bg-red-800" />
              Avant 2026
              <span className="h-px flex-1 bg-red-200 dark:bg-red-800" />
            </div>
            <ul className="space-y-3">
              {AVANT.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-red-900 dark:text-red-300">
                  <span className="text-red-400 dark:text-red-500 shrink-0 font-bold">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-green-100 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-green-200 dark:bg-green-800" />
              Depuis 2026
              <span className="h-px flex-1 bg-green-200 dark:bg-green-800" />
            </div>
            <ul className="space-y-3">
              {DEPUIS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-green-900 dark:text-green-300">
                  <span className="text-green-500 dark:text-green-400 shrink-0 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ============================================================
          OBJECTIF APP
      ============================================================ */}
      <div className="rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-6">
        <h2 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-3">
          <span>🎯</span> Objectif de cette application
        </h2>
        <ul className="space-y-2">
          {[
            "Vous entraîner avec des questions proches de l'examen réel",
            "Tester vos connaissances avec des explications détaillées",
            "Vous préparer dans des conditions similaires à un QCM officiel",
            "Suivre votre progression et identifier vos points faibles",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300">
              <span className="shrink-0">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ============================================================
          CTA FINAL
      ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-white to-red-600" />
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-blue-100/40 dark:bg-blue-900/20 blur-3xl" />

        <div className="relative p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center shadow-sm">
              <MarianneSVG />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Prêt à vous préparer ?
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Entraînez-vous avec plus de 400 questions-réponses, testez vos connaissances
            et préparez-vous dans des conditions réelles.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => router.push("/train")}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105 hover:shadow-xl"
            >
              ✏️ Mode entraînement
            </button>
            <button
              onClick={() => router.push("/exam")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-7 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all hover:scale-105"
            >
              🎯 Examen blanc
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-7 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all hover:scale-105"
            >
              🏆 Classement
            </button>
          </div>
        </div>
      </div>

    </main>
  );
}
