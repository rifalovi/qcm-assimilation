"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hasAnyResult } from "../../src/lib/saveResult";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useUser, ROLE_LIMITS } from "../components/UserContext";

type Level = 1 | 2 | 3;
type Theme = "Valeurs" | "Institutions" | "Histoire" | "Société";

const COUNT = 40;
const THEMES: Theme[] = ["Valeurs", "Institutions", "Histoire", "Société"];

type QcmUser = { pseudo: string; email: string };

function normEmail(v: string) {
  return v.trim().toLowerCase();
}

function loadUser(): QcmUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("qcm_user");
    return raw ? (JSON.parse(raw) as QcmUser) : null;
  } catch {
    return null;
  }
}

function saveUser(u: QcmUser) {
  localStorage.setItem("qcm_user", JSON.stringify(u));
}

function MarianneMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="text-slate-200"
      >
        <path
          d="M20 21a8 8 0 0 0-16 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Pill({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
        active
          ? "border-blue-400/30 bg-blue-500/15 text-blue-200 shadow-[0_0_0_1px_rgba(96,165,250,0.06)]"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/20 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function StatMiniCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-4 text-center shadow-[0_18px_45px_rgba(2,8,23,0.28)] transition-all duration-300 hover:border-blue-400/20 hover:shadow-[0_24px_55px_rgba(2,8,23,0.36)]">
      <div className="mb-1 text-xl">{icon}</div>
      <div className="text-2xl font-extrabold text-white sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">{label}</div>
    </div>
  );
}

export default function ExamPage() {
  const router = useRouter();
  const { role } = useUser();
const limits = ROLE_LIMITS[role];

  const [user, setUser] = useState<QcmUser | null>(null);
  const [hasLastResult, setHasLastResult] = useState(false);
  const [pseudoOpen, setPseudoOpen] = useState(false);
  const [pseudoDraft, setPseudoDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const u = loadUser();
    if (!u) {
      setHasLastResult(false);
      const t = setTimeout(() => setHeroVisible(true), 50);
      return () => clearTimeout(t);
    }

    setUser(u);
    setPseudoDraft(u.pseudo ?? "");
    setEmailDraft(u.email ?? "");

    const email = u.email?.trim().toLowerCase() ?? "";
    async function check() {
      if (!email) {
        setHasLastResult(false);
        return;
      }
      const remote = await hasAnyResult(email);
      if (remote) {
        setHasLastResult(true);
        return;
      }
      setHasLastResult(!!localStorage.getItem(`last_result:exam:${email}`));
    }

    check();
    const t = setTimeout(() => setHeroVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  function openIdentityModal() {
    const u = loadUser();
    setPseudoDraft(u?.pseudo ?? "");
    setEmailDraft(u?.email ?? "");
    setPseudoOpen(true);
  }

  function clearIdentity() {
    localStorage.removeItem("qcm_user");
    setUser(null);
    setPseudoDraft("");
    setEmailDraft("");
    setHasLastResult(false);
  }

  function confirmIdentityAndRun(action: () => void) {
    const p = pseudoDraft.trim();
    const e = normEmail(emailDraft);
    if (!p || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return;

    const u: QcmUser = { pseudo: p, email: e };
    saveUser(u);
    setUser(u);
    setHasLastResult(!!localStorage.getItem(`last_result:exam:${e}`));
    setPseudoOpen(false);
    action();
  }

  function smartStartExam() {
    const u = loadUser();
    if (!u?.pseudo?.trim() || !u?.email?.trim()) {
      openIdentityModal();
      return;
    }
    startExam();
  }

  const [level, setLevel] = useState<Level>(3);
  const [themes, setThemes] = useState<Theme[]>([...THEMES]);
  const canStart = themes.length > 0;

  const meta = useMemo(
    () => ({ level, themes, count: COUNT }),
    [level, themes]
  );

  function toggleTheme(t: Theme) {
    setThemes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function startExam() {
    if (!canStart) return;
    localStorage.setItem(
      "quiz_settings",
      JSON.stringify({
        ...meta,
        mode: "exam",
        perQuestion: 30,
        maxDuration: 900,
      })
    );
    router.push("/quiz");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-8 sm:space-y-10">
        <section
          className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl transition-all duration-700 ${
            heroVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
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

          <div className="relative px-5 py-6 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-3">
                <MarianneMark />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      République française
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                      <span className="inline-flex h-2.5 w-4 overflow-hidden rounded-sm border border-white/10">
                        <span className="w-1/3 bg-blue-600" />
                        <span className="w-1/3 bg-white" />
                        <span className="w-1/3 bg-red-600" />
                      </span>
                      FR
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Examen blanc • Simulation 2026
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {user?.pseudo?.trim() ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 backdrop-blur-md">
                    <span>
                      Bonjour <span className="font-semibold text-white">{user.pseudo.trim()}</span> 👋
                    </span>
                    <span className="text-slate-500">•</span>
                    <button
                      type="button"
                      onClick={openIdentityModal}
                      className="text-slate-400 transition hover:text-white hover:underline"
                    >
                      Changer
                    </button>
                    <span className="text-slate-500">•</span>
                    <button
                      type="button"
                      onClick={clearIdentity}
                      className="text-slate-400 transition hover:text-red-400 hover:underline"
                    >
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openIdentityModal}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:border-blue-400/20 hover:bg-white/10 hover:text-white"
                  >
                    Bonjour 👋 S'identifier
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Conditions proches de l’épreuve
                </div>

                <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Testez-vous en conditions d’examen blanc, avec un rythme plus exigeant.
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Cette simulation reprend les grands thèmes du test civique français avec
                  40 questions, un temps limité et un niveau de difficulté par défaut plus élevé.
                  L’objectif est de vous mettre en situation réelle avant le passage officiel.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                 {limits.canExam ? (
  <Button onClick={smartStartExam}>Démarrer l'examen blanc</Button>
) : (
  <div className="relative">
    <button disabled
      className="rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-slate-600 cursor-not-allowed">
      Démarrer l'examen blanc
    </button>
    <div className="mt-1 text-xs text-amber-400/70 text-center">
      🔒 Disponible en Premium
    </div>
  </div>
)}
                  <Button variant="secondary" onClick={() => router.push("/info")}>
                    📖 Comprendre l'examen
                  </Button>
                  <Button variant="secondary" onClick={() => router.push("/")}>
                    ✏️ Mode entraînement
                  </Button>
                </div>

                <div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-400 sm:text-sm">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    40 questions
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    30 secondes par question
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Validation à partir de 32/40
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <StatMiniCard value="40" label="Questions" icon="❓" />
                <StatMiniCard value="30 s" label="Temps par question" icon="⏱️" />
                <StatMiniCard value="32/40" label="Score attendu" icon="🎯" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => router.push("/info")}>
            📘 Guide de l'examen
          </Button>

          {hasLastResult && (
            <Button variant="secondary" onClick={() => router.push("/results?mode=exam")}>
              📊 Voir le dernier résultat
            </Button>
          )}

          <Button variant="secondary" onClick={() => router.push("/")}>
            ✏️ Mode entraînement
          </Button>

          <Button variant="secondary" onClick={() => router.push("/leaderboard")}>
            🏆 Classement
          </Button>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Choisissez le niveau</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Le niveau 3 est recommandé pour une simulation réaliste.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                Difficile
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[1, 2, 3].map((n) => {
                const active = level === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setLevel(n as Level)}
                    className={`rounded-2xl border px-4 py-4 text-center transition-all duration-200 ${
                      active
                        ? "border-blue-400/30 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-200 shadow-[0_10px_30px_rgba(37,99,235,0.18)]"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/20 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="text-sm font-semibold">Niveau {n}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-sm font-semibold text-white">Conseil</div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Niveau 1 : prise en main</li>
                <li>• Niveau 2 : bon entraînement intermédiaire</li>
                <li>• Niveau 3 : simulation la plus exigeante</li>
              </ul>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Sélectionnez les thèmes</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Gardez tout pour une simulation complète, ou ciblez vos révisions.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                {themes.length}/{THEMES.length}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <Pill key={t} active={themes.includes(t)} onClick={() => toggleTheme(t)}>
                  {t}
                </Pill>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setThemes([...THEMES])}>
                Tout sélectionner
              </Button>
              <Button variant="secondary" onClick={() => setThemes([])}>
                Tout retirer
              </Button>
            </div>

            {!canStart && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                ⚠️ Sélectionnez au moins un thème pour démarrer.
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Résumé de l’examen</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Vérifiez les paramètres avant de lancer la session.
                </p>
              </div>
              <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                Chronométré
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              {[
                ["Questions", COUNT],
                ["Temps / question", "30 s"],
                ["Validation", "≥ 32 bonnes réponses"],
                ["Niveau", `Niveau ${level}`],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>

           {limits.canExam ? (
  <Button onClick={smartStartExam}>Démarrer l'examen blanc</Button>
) : (
  <div className="relative">
    <button disabled
      className="rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-slate-600 cursor-not-allowed">
      Démarrer l'examen blanc
    </button>
    <div className="mt-1 text-xs text-amber-400/70 text-center">
      🔒 Disponible en Premium
    </div>
  </div>
)}

            <p className="mt-4 text-xs leading-6 text-slate-400">
              Vous disposez de 30 secondes par question. Le niveau 3 est sélectionné par défaut
              pour vous rapprocher d’une situation plus exigeante.
            </p>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "⏱️",
              title: "Rythme soutenu",
              text: "Le chronométrage vous oblige à mobiliser rapidement vos repères et vos réflexes de réponse.",
            },
            {
              icon: "🧭",
              title: "Vision réaliste",
              text: "Vous vous confrontez à une session plus proche de l’ambiance d’évaluation réelle.",
            },
            {
              icon: "🏁",
              title: "Mesure de préparation",
              text: "Votre score vous aide à identifier si vous êtes prêt ou si certaines révisions doivent être renforcées.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)] transition-all duration-300 hover:border-blue-400/20"
            >
              <div className="mb-3 text-2xl">{item.icon}</div>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{item.text}</p>
            </div>
          ))}
        </section>
      </div>

      {pseudoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setPseudoOpen(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
            <h3 className="text-lg font-bold text-white">Avant de commencer</h3>
            <p className="mt-1 text-sm text-slate-400">
              Pour lancer l'examen blanc, inscrivez-vous en entrant un pseudo et une adresse email valide.
            </p>

            <input
              value={pseudoDraft}
              onChange={(e) => setPseudoDraft(e.target.value)}
              placeholder="Pseudo (ex : Carlos)"
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
              maxLength={20}
            />

            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="Adresse email"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
            />

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" type="button" onClick={() => setPseudoOpen(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => confirmIdentityAndRun(startExam)}
                disabled={
                  !pseudoDraft.trim() ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail(emailDraft))
                }
              >
                Continuer
              </Button>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              <a
                href={
                  "/register?pseudo=" +
                  encodeURIComponent(pseudoDraft) +
                  "&email=" +
                  encodeURIComponent(emailDraft)
                }
                className="font-medium text-blue-400 hover:underline"
              >
                Créer un vrai compte
              </a>{" "}
              pour sauvegarder votre historique et accéder aux statistiques complètes.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}