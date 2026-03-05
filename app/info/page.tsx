"use client";

import { useRouter } from "next/navigation";

const SECTIONS = [
  {
    icon: "📋",
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
    title: "Naturalisation française",
    description:
      "Les personnes demandant la nationalité par naturalisation doivent démontrer leur connaissance des valeurs et institutions. L'examen vient compléter l'évaluation du niveau de français et l'entretien en préfecture.",
    color: "blue",
  },
  {
    title: "Carte de séjour pluriannuelle",
    description:
      "L'examen peut être requis pour l'obtention d'une carte de séjour pluriannuelle, généralement valable entre 2 et 4 ans.",
    color: "indigo",
  },
  {
    title: "Carte de résident",
    description:
      "Dans certains cas, la réussite de cet examen est demandée pour obtenir une carte de résident de 10 ans.",
    color: "violet",
  },
];

export default function InfoPage() {
  const router = useRouter();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

      {/* ===== HERO ===== */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-white to-red-600" />

        {/* Halos décoratifs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-red-100/40 dark:bg-red-900/20 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          {/* Badge officiel */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-5">
            <span className="inline-flex h-3 w-5 overflow-hidden rounded-sm border border-slate-200 dark:border-slate-600">
              <span className="w-1/3 bg-blue-700" />
              <span className="w-1/3 bg-white dark:bg-slate-200" />
              <span className="w-1/3 bg-red-600" />
            </span>
            République Française — En vigueur depuis le 1er janvier 2026
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Comprendre <span className="text-blue-700 dark:text-blue-400">l'examen civique</span>
          </h1>

          <p className="mt-4 text-slate-600 dark:text-slate-400 text-base max-w-2xl leading-relaxed">
            L'examen civique vise à vérifier la connaissance des valeurs de la République,
            des institutions françaises et des principes fondamentaux de la vie en société.
            Il fait désormais partie des dispositifs d'intégration pour certaines démarches administratives.
          </p>

          {/* CTA principaux */}
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <span>✏️</span> S'entraîner maintenant
            </button>
            <button
              onClick={() => router.push("/exam")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
            >
              <span>🎯</span> Passer un examen blanc
            </button>
          </div>
        </div>
      </div>

      {/* ===== STAT BANNER ===== */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        {[
          { value: "40", label: "Questions" },
          { value: "80%", label: "Score requis" },
          { value: "45 min", label: "Durée" },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400">{value}</div>
            <div className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* ===== SECTIONS FORMAT / THÈMES / QUI ===== */}
      <div className="grid gap-5 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="text-2xl mb-3">{s.icon}</div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">{s.title}</h2>
            <ul className="space-y-2">
              {s.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="mt-0.5 text-blue-500 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ===== SITUATIONS OBLIGATOIRES ===== */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          Dans quelles situations est-il obligatoire ?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          L'examen civique peut être demandé dans plusieurs contextes administratifs.
        </p>
        <div className="space-y-4">
          {SITUATIONS.map((s) => (
            <div key={s.title}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex gap-4">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CAS D'EXEMPTION ===== */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5">
        <h2 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
          <span>⚠️</span> Cas où l'examen n'est pas demandé
        </h2>
        <ul className="mt-3 space-y-2">
          {[
            "Renouvellement d'un titre de séjour déjà obtenu",
            "Citoyens de l'Union européenne",
            "Certains statuts spécifiques prévus par la réglementation",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
              <span className="shrink-0">•</span> {item}
            </li>
          ))}
        </ul>
      </div>

      {/* ===== AVANT / APRÈS 2026 ===== */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">
          Ce qui a changé en 2026
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-red-500 dark:text-red-400 mb-3">Avant 2026</div>
            <ul className="space-y-2">
              {[
                "Pas d'examen national standardisé",
                "Connaissances évaluées en entretien préfecture uniquement",
                "Évaluation variable selon les agents",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-red-900 dark:text-red-300">
                  <span className="shrink-0 text-red-400">✕</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-green-100 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-3">Depuis 2026</div>
            <ul className="space-y-2">
              {[
                "Examen civique national sous forme de QCM",
                "Évaluation uniforme et structurée",
                "Résultats objectifs et reproductibles",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-green-900 dark:text-green-300">
                  <span className="shrink-0 text-green-500">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ===== CTA FINAL ===== */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-7 text-center shadow-sm">
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-200/40 dark:bg-blue-700/20 blur-3xl" />
        <div className="relative">
          <div className="text-3xl mb-3">🎯</div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Prêt à vous préparer ?
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Entraînez-vous avec des questions proches de l'examen, testez vos connaissances
            et préparez-vous dans des conditions réelles.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105"
            >
              ✏️ Mode entraînement
            </button>
            <button
              onClick={() => router.push("/exam")}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 px-6 py-3 text-sm font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all hover:scale-105"
            >
              🎯 Examen blanc
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 px-6 py-3 text-sm font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all hover:scale-105"
            >
              🏆 Classement
            </button>
          </div>
        </div>
      </div>

      {/* ===== NAV RETOUR ===== */}
      <div className="flex justify-center">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition flex items-center gap-1"
        >
          ← Retour à l'accueil
        </button>
      </div>

    </main>
  );
}
