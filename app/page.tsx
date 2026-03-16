"use client";

import { useRouter } from "next/navigation";
import Card from "../components/Card";
import Button from "../components/Button";
import { useEffect, useMemo, useState } from "react";
import { hasAnyResult } from "../src/lib/saveResult";
import { createClient } from "@/lib/supabase/client";
import { useUser, ROLE_LIMITS } from "./components/UserContext";


type Level = 1 | 2 | 3;
type Theme = "Valeurs" | "Institutions" | "Histoire" | "Société";

const COUNT = 40;
const PER_QUESTION_SECONDS = 20;
const THEMES: Theme[] = ["Valeurs", "Institutions", "Histoire", "Société"];

function MarianneMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-7 w-7 text-slate-200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M32 8c8.5 0 15.5 7 15.5 15.5S40.5 39 32 39 16.5 32 16.5 23.5 23.5 8 32 8Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M18 53c3.8-7.6 10.1-12 14-12s10.2 4.4 14 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M22 22c4-6 9-9 16-9 1.5 0 3 .2 4.3.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function encode(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

type QcmUser = { pseudo: string; email: string };

function loadUserLocal(): QcmUser | null {
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

export default function HomePage() {
  const router = useRouter();
  const { role } = useUser();
const limits = ROLE_LIMITS[role];

  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [pseudoDraft, setPseudoDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [pseudoOpen, setPseudoOpen] = useState(false);
  const [hasLastResult, setHasLastResult] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const u = loadUserLocal();
    if (u) {
      setPseudo(u.pseudo);
      setEmail(u.email);
      setPseudoDraft(u.pseudo);
      setEmailDraft(u.email);
    }
    const t = setTimeout(() => setHeroVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const u = loadUserLocal();
    if (!u?.email) {
      setHasLastResult(false);
      return;
    }
    const e = u.email.trim().toLowerCase();
    async function check() {
      const remote = await hasAnyResult(e);
      if (remote) {
        setHasLastResult(true);
        return;
      }
      const hasTrain = !!localStorage.getItem(`last_result:train:${e}`);
      const hasExam = !!localStorage.getItem(`last_result:exam:${e}`);
      setHasLastResult(hasTrain || hasExam);
    }
    check();
  }, [pseudo, email]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const username =
          session.user.user_metadata?.username ||
          session.user.email?.split("@")[0] ||
          "";
        const email = session.user.email || "";
        setPseudo(username);
        setEmail(email);
        setPseudoDraft(username);
        setEmailDraft(email);
        saveUser({ pseudo: username, email });
      }
    });
  }, []);

  function requireAuthAndRun(action: () => void) {
    if (!pseudo || !email) {
      setPseudoOpen(true);
      return;
    }
    action();
  }

  function openPseudoModal() {
    try {
      const raw = localStorage.getItem("qcm_user");
      if (raw) {
        const u = JSON.parse(raw) as { pseudo?: string; email?: string };
        setPseudoDraft(u.pseudo ?? pseudo ?? "");
        setEmailDraft(u.email ?? email ?? "");
      } else {
        setPseudoDraft(pseudo ?? "");
        setEmailDraft(email ?? "");
      }
    } catch {
      setPseudoDraft(pseudo ?? "");
      setEmailDraft(email ?? "");
    }
    setPseudoOpen(true);
  }

  async function clearPseudo() {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem("qcm_user");
    setPseudo(""); setEmail(""); setPseudoDraft(""); setEmailDraft("");
    setHasLastResult(false); setPseudoOpen(false);
  }
  
  

  const [level, setLevel] = useState<Level>(1);
  const [themes, setThemes] = useState<Theme[]>([...THEMES]);
  const canStart = themes.length > 0;

  const meta = useMemo(
    () => ({
      level,
      themes,
      count: COUNT,
      perQuestionSeconds: PER_QUESTION_SECONDS,
      mode: "train" as const,
    }),
    [level, themes]
  );

  function confirmIdentity() {
    const p = pseudoDraft.trim();
    const e = emailDraft.trim().toLowerCase();
    if (!p || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return;
    const u = { pseudo: p, email: e };
    saveUser(u);
    setPseudo(p);
    setEmail(e);
    setPseudoOpen(false);
    localStorage.setItem("quiz_settings", JSON.stringify(meta));
    router.push("/quiz");
  }

  function start() {
    if (!canStart) return;
    requireAuthAndRun(() => {
      localStorage.setItem("quiz_settings", JSON.stringify(meta));
      router.push("/quiz");
    });
  }

  function startExam() {
    requireAuthAndRun(() => {
      router.push("/exam");
    });
  }

  function toggleTheme(t: Theme) {
    setThemes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  const [openFeedback, setOpenFeedback] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const payload: Record<string, string> = {
      "form-name": "feedback-qcm",
      rating: String(rating),
      comment: comment.trim(),
      pseudo: pseudo.trim() || "",
      page: "home",
      level: String(level),
      themes: themes.join(", "),
      count: String(COUNT),
      mode: "train",
    };
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode(payload),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
      setComment("");
    } catch {
      alert("Erreur d'envoi. Réessaie.");
    } finally {
      setSending(false);
    }
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
            <div className="mb-8 flex flex-col gap-4 text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md">
                  <MarianneMark />
                </div>

                <div className="text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
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
                    Plateforme d’entraînement 2026
                  </div>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                {pseudo.trim() ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-slate-300 backdrop-blur-md sm:text-left">
                    <span>
                      Bonjour <span className="font-semibold text-white">{pseudo.trim()}</span> 👋
                    </span>
                    <span className="hidden sm:inline text-slate-500">•</span>
                    <button
                      type="button"
                      onClick={openPseudoModal}
                      className="text-slate-400 transition hover:text-white hover:underline"
                    >
                      Changer
                    </button>
                    <span className="hidden sm:inline text-slate-500">•</span>
                    <button
                      type="button"
                      onClick={clearPseudo}
                      className="text-slate-400 transition hover:text-red-400 hover:underline"
                    >
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openPseudoModal}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:border-blue-400/20 hover:bg-white/10 hover:text-white"
                  >
                    Bonjour 👋 Connectez-vous
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
  <div className="mb-4 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-xs">
    Plus de 400 questions-réponses
  </div>

  <h1 className="mx-auto max-w-[16ch] text-2xl font-extrabold leading-tight tracking-tight text-white sm:max-w-[18ch] sm:text-3xl lg:mx-0 lg:max-w-3xl lg:text-5xl">
    Préparez votre examen civique.
  </h1>

  <div className="mx-auto mt-5 max-w-2xl rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4 sm:px-5 sm:py-5 lg:mx-0">
    <p className="text-[0.98rem] leading-8 text-slate-300 sm:text-base">
      Entraînez-vous sur les valeurs de la République, les institutions, l’histoire
      de France et la vie en société.
    </p>
    <p className="mt-3 text-[0.98rem] leading-8 text-slate-300 sm:text-base">
      Choisissez votre niveau, sélectionnez vos thèmes et progressez avec des
      explications pédagogiques proches des exigences de l’examen civique 2026.
    </p>
  </div>

  <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
    <Button className="w-full sm:w-auto" onClick={start}>
      Commencer maintenant
    </Button>
    <Button className="w-full sm:w-auto" variant="secondary" onClick={() => router.push("/info")}>
      Comprendre l'examen
    </Button>
    <Button className="w-full sm:w-auto" variant="secondary" onClick={startExam}>
      Examen blanc
    </Button>
  </div>

  <div className="mt-7 flex flex-wrap justify-center gap-3 text-xs text-slate-400 sm:text-sm lg:justify-start">
    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
      Entraînement progressif
    </div>
    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
      Corrections détaillées
    </div>
    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
      Simulation réaliste
    </div>
  </div>
</div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-1">
                <StatMiniCard value="40" label="Questions par session" icon="❓" />
                <StatMiniCard value="20 s" label="Temps par question" icon="⏱️" />
                <StatMiniCard value="80%" label="Objectif de réussite" icon="🎯" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => router.push("/info")}>
            📘 Guide de l'examen
          </Button>

          {hasLastResult && (
            <Button variant="secondary" onClick={() => router.push("/results")}>
              📊 Voir le dernier résultat
            </Button>
          )}

          <Button variant="secondary" onClick={() => setOpenFeedback(true)}>
            💬 Laisser un avis
          </Button>

          <Button variant="secondary" onClick={() => router.push("/leaderboard")}>
            🏆 Classement
          </Button>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card>
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
              <div>
                <h3 className="text-lg font-bold text-white">Choisissez votre niveau</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Ajustez la difficulté selon votre progression.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                3 niveaux
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
  {[1, 2, 3].map((n) => {
    const active = level === n;
    const locked = !limits.levels.includes(n);
    return (
      <button
        key={n}
        type="button"
        onClick={() => !locked && setLevel(n as Level)}
        className={`relative rounded-2xl border px-4 py-4 text-center transition-all duration-200 ${
          locked
            ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600"
            : active
            ? "border-blue-400/30 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-200 shadow-[0_10px_30px_rgba(37,99,235,0.18)]"
            : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/20 hover:bg-white/10 hover:text-white"
        }`}
      >
        <div className="text-sm font-semibold">Niveau {n}</div>
        {locked && (
          <div className="mt-1 text-xs text-amber-400/70">
            🔒 Premium
          </div>
        )}
      </button>
    );
  })}
</div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-center sm:text-left">
              <div className="mb-2 text-sm font-semibold text-white">Conseil</div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Niveau 1 : bases et repères essentiels</li>
                <li>• Niveau 2 : précision et pièges fréquents</li>
                <li>• Niveau 3 : approfondissement et maîtrise</li>
              </ul>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
              <div>
                <h3 className="text-lg font-bold text-white">Sélectionnez vos thèmes</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Ciblez vos révisions selon vos besoins.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                {themes.length}/{THEMES.length}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              {THEMES.map((t) => (
                <Pill key={t} active={themes.includes(t)} onClick={() => toggleTheme(t)}>
                  {t}
                </Pill>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button variant="secondary" onClick={() => setThemes([...THEMES])}>
                Tout sélectionner
              </Button>
              <Button variant="secondary" onClick={() => setThemes([])}>
                Tout retirer
              </Button>
            </div>

            {!canStart && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200 sm:text-left">
                ⚠️ Sélectionnez au moins un thème pour démarrer.
              </div>
            )}
          </Card>

          <Card>
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
              <div>
                <h3 className="text-lg font-bold text-white">Résumé de votre session</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Vérifiez les paramètres avant de lancer le test.
                </p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Prêt
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              {[
  ["Questions", `${limits.quizCount} questions`],
  ["Temps / question", `${PER_QUESTION_SECONDS}s`],
  ["Niveau", `Niveau ${level}`],
].map(([label, value]) => (
  <div key={String(label)} className="flex items-center justify-between gap-3">
    <span className="text-slate-400">{label}</span>
    <span className="font-semibold text-white">{value}</span>
  </div>
))}

{role !== "premium" && (
  <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
    {role === "anonymous"
      ? "👤 Crée un compte gratuit pour accéder à 20 questions"
      : "✨ Passe en Premium pour accéder à 40 questions et tous les niveaux"}
  </div>
)}
            </div>

            <div className="mt-6 flex flex-col gap-3">
  <Button className="w-full" onClick={start} disabled={!canStart}>
    Faire un test
  </Button>
  {limits.canExam ? (
    <Button variant="danger" className="w-full" onClick={startExam}>
      Examen blanc
    </Button>
  ) : (
    <div className="relative">
      <button
        disabled
        className="w-full rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-slate-600 cursor-not-allowed"
      >
        Examen blanc
      </button>
      <div className="mt-1 text-center text-xs text-amber-400/70">
        🔒 Disponible en Premium — essai gratuit pour Freemium
      </div>
    </div>
  )}
</div>

            <p className="mt-4 text-center text-xs leading-6 text-slate-400 sm:text-left">
              Votre résultat affichera vos erreurs, vos bonnes réponses et les explications pour
              progresser plus vite.
            </p>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "🧠",
              title: "Apprendre intelligemment",
              text: "Chaque question peut être accompagnée d’une explication pour transformer l’erreur en progression réelle.",
            },
            {
              icon: "📚",
              title: "Réviser par thème",
              text: "Concentrez-vous sur les sujets qui vous manquent le plus et adaptez votre entraînement à vos objectifs.",
            },
            {
              icon: "🏁",
              title: "Se mettre en condition",
              text: "Passez d’un mode entraînement libre à une simulation plus exigeante avec l’examen blanc.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 text-center shadow-[0_18px_45px_rgba(2,8,23,0.28)] transition-all duration-300 hover:border-blue-400/20 md:text-left"
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
            <div className="mb-5 text-center sm:text-left">
              <h3 className="text-xl font-bold text-white">Avant de commencer</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Créez un compte pour sauvegarder vos résultats, ou continuez sans compte avec une
                identité locale.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="/register"
                className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.24)] transition hover:brightness-105"
              >
                Créer un compte gratuit
              </a>
              <a
                href="/login"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                J'ai déjà un compte
              </a>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="mb-3 text-center text-xs text-slate-500">
                Ou continuer sans compte
              </p>

              <input
                value={pseudoDraft}
                onChange={(e) => setPseudoDraft(e.target.value)}
                placeholder="Pseudo (ex : Carlos)"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
                maxLength={20}
                autoFocus
              />

              <input
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder="Adresse email"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
              />

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" type="button" onClick={() => setPseudoOpen(false)}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={confirmIdentity}
                  disabled={
                    !pseudoDraft.trim() ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                      emailDraft.trim().toLowerCase()
                    )
                  }
                >
                  Continuer sans compte
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenFeedback(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
            <div className="flex items-start justify-between gap-3">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold text-white">Donner un avis</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Votre retour nous aide à améliorer l’expérience.
                </p>
              </div>
              <button
                onClick={() => setOpenFeedback(false)}
                className="text-slate-500 transition hover:text-white"
              >
                ✕
              </button>
            </div>

            {sent ? (
              <div className="mt-5 rounded-2xl border border-green-400/20 bg-green-500/10 p-4 text-green-200">
                Merci ✅ Votre retour a bien été envoyé.
              </div>
            ) : (
              <form
                name="feedback-qcm"
                method="POST"
                data-netlify="true"
                onSubmit={submitFeedback}
                className="mt-5 space-y-4"
              >
                <input type="hidden" name="form-name" value="feedback-qcm" />

                <div>
                  <label className="text-sm font-semibold text-slate-200">Note (1 à 5)</label>
                  <div className="mt-2 flex justify-center gap-2 sm:justify-start">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className={`h-10 w-10 rounded-xl border text-sm font-bold transition ${
                          rating === n
                            ? "border-blue-400/30 bg-blue-500/15 text-blue-200"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-200">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    name="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-2 min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
                    placeholder="Qu'est-ce qui vous a plu ? Qu'est-ce qu'on doit améliorer ?"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="secondary" type="button" onClick={() => setOpenFeedback(false)}>
                    Fermer
                  </Button>
                  <Button type="submit" disabled={sending}>
                    {sending ? "Envoi…" : "Envoyer"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <form name="feedback-qcm" method="POST" data-netlify="true" hidden>
        <input type="hidden" name="form-name" value="feedback-qcm" />
        <input type="text" name="pseudo" />
        <input type="text" name="rating" />
        <input type="text" name="comment" />
        <input type="text" name="page" />
        <input type="text" name="level" />
        <input type="text" name="themes" />
        <input type="text" name="count" />
        <input type="text" name="mode" />
      </form>
    </main>
  );
}