"use client";

import { useRouter } from "next/navigation";
import { useUser } from "../components/UserContext";
import { useEffect, useState } from "react";
import ScrollDemo from "@/components/ScrollDemo";

type QcmUser = { pseudo: string; email: string };

function loadUser(): QcmUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("qcm_user");
    return raw ? (JSON.parse(raw) as QcmUser) : null;
  } catch {
    return null;
  }
}

const SECTIONS = [
  {
    icon: "📋",
    color: "from-blue-500 via-indigo-500 to-sky-500",
    ring: "ring-blue-400/20",
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
    color: "from-indigo-500 via-violet-500 to-fuchsia-500",
    ring: "ring-indigo-400/20",
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
    color: "from-violet-500 via-purple-500 to-blue-500",
    ring: "ring-violet-400/20",
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
    description:
      "Les personnes demandant la nationalité par naturalisation doivent démontrer leur connaissance des valeurs et institutions. L'examen vient compléter l'évaluation du niveau de français et l'entretien en préfecture.",
    icon: "🏛️",
  },
  {
    num: "02",
    title: "Carte de séjour pluriannuelle",
    description:
      "L'examen peut être requis pour l'obtention d'une carte de séjour pluriannuelle, généralement valable entre 2 et 4 ans.",
    icon: "📄",
  },
  {
    num: "03",
    title: "Carte de résident",
    description:
      "Dans certains cas, la réussite de cet examen est demandée pour obtenir une carte de résident de 10 ans.",
    icon: "🪪",
  },
];

const EXEMPTIONS = [
  { icon: "🔄", text: "Renouvellement d'un titre de séjour déjà obtenu" },
  { icon: "🇪🇺", text: "Citoyens de l'Union européenne" },
  { icon: "📜", text: "Certains statuts spécifiques prévus par la réglementation" },
];

const BEFORE_2026 = [
  "Pas d'examen national standardisé",
  "Connaissances évaluées en entretien préfecture uniquement",
  "Évaluation variable selon les agents",
];

const SINCE_2026 = [
  "Examen civique national sous forme de QCM",
  "Évaluation uniforme et structurée",
  "Résultats objectifs et reproductibles",
];

function ActionButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const base =
    "w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40";
  const styles =
    variant === "primary"
      ? "border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_18px_40px_rgba(37,99,235,0.36)]"
      : "border border-white/10 bg-slate-800/80 text-slate-100 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:border-blue-400/25 hover:bg-slate-700/85";

  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-4 text-center shadow-[0_18px_45px_rgba(2,8,23,0.28)] transition-all duration-300 hover:border-blue-400/20 hover:shadow-[0_24px_55px_rgba(2,8,23,0.38)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_42%)] opacity-80" />
      <div className="relative">
        <div className="mb-1 text-xl sm:text-2xl">{icon}</div>
        <div className="text-2xl font-extrabold text-white sm:text-3xl">{value}</div>
        <div className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">{label}</div>
      </div>
    </div>
  );
}

export default function InfoPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [user, setUser] = useState<QcmUser | null>(null);
  const { role, username: supabaseUsername, loading: authLoading } = useUser();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    setUser(loadUser());
    return () => clearTimeout(t);
  }, []);

  function clearIdentity() {
    localStorage.removeItem("qcm_user");
    setUser(null);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-8 sm:space-y-10">
        <section
          className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl transition-all duration-700 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-600" />
          </div>

          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative px-5 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md">
                  <span className="text-xl">🇫🇷</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    République française
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-200">
                    Examen civique FR
                  </div>
                </div>
              </div>

              {!authLoading && !supabaseUsername && user?.pseudo?.trim() ? (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 backdrop-blur-md">
                  <span>
                    Bonjour <span className="font-semibold text-white">{user.pseudo.trim()}</span> 👋
                  </span>
                  <span className="text-slate-500">•</span>
                  <button
                    onClick={() => router.push("/")}
                    className="text-slate-400 transition hover:text-white hover:underline"
                  >
                    Changer
                  </button>
                  <span className="text-slate-500">•</span>
                  <button
                    onClick={clearIdentity}
                    className="text-slate-400 transition hover:text-red-400 hover:underline"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.04)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  En vigueur depuis le 1er janvier 2026
                </div>
              )}
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="text-center lg:text-left">
  <div className="mb-4 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-xs">
    Préparez-vous avec méthode
  </div>

  <h1 className="mx-auto max-w-[18ch] text-2xl font-extrabold leading-tight tracking-tight text-white sm:max-w-xl sm:text-3xl lg:mx-0 lg:max-w-3xl lg:text-5xl">
    L'examen civique
Informations essentielles.
  </h1>

  <div className="mx-auto mt-5 max-w-2xl rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4 sm:px-5 sm:py-5 lg:mx-0">
    <p className="text-[0.98rem] leading-8 text-slate-300 sm:text-base">
      Comprendre le format, les thèmes et les conditions de l'examen civique avant de vous entraîner dans les meilleures conditions..
    </p>
  </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <ActionButton onClick={() => router.push("/")}>
                    S'entraîner maintenant
                  </ActionButton>
                  <ActionButton onClick={() => router.push("/exam")} variant="secondary">
                    Passer un examen blanc
                  </ActionButton>
                  <ActionButton onClick={() => router.push("/leaderboard")} variant="secondary">
                    Classement
                  </ActionButton>
                </div>

                <div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-400 sm:text-sm">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Format QCM
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Conditions réelles
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Préparation progressive
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-slate-800/90 to-slate-900/95 p-5 shadow-[0_20px_55px_rgba(2,8,23,0.4)] backdrop-blur-md sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Aperçu rapide
                      </div>
                      <div className="mt-1 text-lg font-bold text-white">
                        Les essentiels à retenir
                      </div>
                    </div>
                    <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                      2026
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      ["40", "questions à choix multiples"],
                      ["32/40", "score minimum pour réussir"],
                      ["45 min", "durée indicative de l’épreuve"],
                    ].map(([strong, text]) => (
                      <div
                        key={text}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div className="min-w-[72px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-center text-sm font-extrabold text-white">
                          {strong}
                        </div>
                        <div className="text-sm text-slate-300">{text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm leading-6 text-amber-100">
                    <span className="font-bold">Conseil :</span> comprendre les attentes de l’examen
                    vous aidera à vous entraîner plus efficacement et à gagner en confiance avant le
                    passage réel.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`transition-all duration-700 delay-100 ${
  visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
}`}>
  <ScrollDemo />
  <div className="mt-6 flex flex-col items-center gap-3">
    <button
      onClick={() => router.push("/scroll")}
      className="group relative overflow-hidden rounded-2xl border border-amber-400/30 bg-amber-500/10 px-8 py-4 text-base font-bold text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.15)] transition hover:bg-amber-500/20 hover:shadow-[0_0_32px_rgba(251,191,36,0.25)] active:scale-95"
    >
      <span className="relative z-10">🚀 Réviser maintenant</span>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-400/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </button>
    {role !== "premium" && (
      <button
        onClick={() => router.push("/account")}
        className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
      >
        👑 Passer en Premium — accès à 280 cartes
        <a href="/pricing" className="text-xs text-amber-400/70 hover:text-amber-300 transition">
  Voir les tarifs →
</a>
      </button>
    )}
  </div>
</section>

        <section
          className={`grid gap-5 lg:grid-cols-3 transition-all duration-700 delay-150 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className={`group rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)] ring-1 ${s.ring} transition-all duration-300 hover:border-blue-400/20 hover:shadow-[0_24px_55px_rgba(2,8,23,0.4)] sm:p-6`}
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-xl text-white shadow-lg`}
              >
                {s.icon}
              </div>

              <h2 className="mb-4 text-lg font-extrabold text-white">{s.title}</h2>

              <ul className="space-y-3">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section
          className={`transition-all duration-700 delay-200 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="h-10 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <div>
              <h2 className="text-2xl font-extrabold text-white">Dans quelles situations ?</h2>
              <p className="text-sm text-slate-400">
                Les principaux contextes dans lesquels l’examen civique peut être demandé.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {SITUATIONS.map((s) => (
              <div
                key={s.title}
                className="group rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)] transition-all duration-300 hover:border-blue-400/20 hover:shadow-[0_24px_55px_rgba(2,8,23,0.4)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-3xl">{s.icon}</div>
                  <div className="text-xs font-black tracking-[0.18em] text-slate-600">{s.num}</div>
                </div>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className={`transition-all duration-700 delay-300 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="overflow-hidden rounded-[1.8rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.2)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-xl">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-amber-100">
                  Cas où l’examen n’est pas demandé
                </h2>
                <p className="text-sm text-amber-200/80">
                  Quelques situations dans lesquelles cette exigence ne s’applique pas.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {EXEMPTIONS.map((item) => (
                <div
                  key={item.text}
                  className="rounded-2xl border border-amber-400/15 bg-black/10 p-4 backdrop-blur-sm"
                >
                  <div className="mb-2 text-lg">{item.icon}</div>
                  <p className="text-sm leading-6 text-amber-100">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className={`transition-all duration-700 delay-[350ms] ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="h-10 w-1 rounded-full bg-gradient-to-b from-red-500 to-green-500" />
            <div>
              <h2 className="text-2xl font-extrabold text-white">Ce qui a changé en 2026</h2>
              <p className="text-sm text-slate-400">
                Une évolution importante vers un cadre plus uniforme et plus lisible.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.6rem] border border-red-400/20 bg-gradient-to-br from-red-500/10 to-rose-500/10 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.2)] sm:p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
                  Avant 2026
                </span>
              </div>

              <ul className="space-y-3">
                {BEFORE_2026.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-red-100">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-400/20 text-[11px] font-bold text-red-300">
                      ✕
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.6rem] border border-green-400/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.2)] sm:p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-500/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.18em] text-green-300">
                  Depuis 2026
                </span>
              </div>

              <ul className="space-y-3">
                {SINCE_2026.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-green-100">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-400/20 text-[11px] font-bold text-green-300">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          className={`transition-all duration-700 delay-[400ms] ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-blue-400/20 bg-gradient-to-br from-blue-600/15 via-indigo-500/10 to-sky-500/15 px-5 py-8 text-center shadow-[0_22px_60px_rgba(2,8,23,0.32)] sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="relative">
              <div className="mb-3 text-4xl">🎯</div>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                Prêt à passer à l’action ?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Commencez par vous entraîner à votre rythme, puis testez-vous dans des conditions
                proches de l’épreuve réelle pour renforcer vos réflexes et votre confiance.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <ActionButton onClick={() => router.push("/")}>
                  ✏️ Mode entraînement
                </ActionButton>
                <ActionButton onClick={() => router.push("/exam")} variant="secondary">
                  🎯 Examen blanc
                </ActionButton>
                <ActionButton onClick={() => router.push("/leaderboard")} variant="secondary">
                  🏆 Classement
                </ActionButton>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-center pb-2">
          <button
            onClick={() => router.push("/")}
            className="group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-blue-300"
          >
            <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            Retour à l'accueil
          </button>
        </div>
      </div>
    </main>
  );
}