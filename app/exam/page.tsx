"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hasAnyResult } from "../../src/lib/saveResult";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useUser, ROLE_LIMITS } from "../components/UserContext";
import PremiumButton from "@/components/PremiumButton";

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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-slate-200">
        <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function Pill({ children, active = false, onClick }: {
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
          ? "border-blue-400/30 bg-blue-500/15 text-blue-200"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/20 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function ExamPage() {
  const router = useRouter();
  const { role, username: authUsername, loading: authLoading, isAuthenticated, logout } = useUser();
  const limits = ROLE_LIMITS[role];

  const [user, setUser] = useState<QcmUser | null>(null);
  const [hasLastResult, setHasLastResult] = useState(false);
  const [pseudoOpen, setPseudoOpen] = useState(false);
  const [pseudoDraft, setPseudoDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [heroVisible, setHeroVisible] = useState(false);
  const [openExamUpgrade, setOpenExamUpgrade] = useState(false);
  const [level, setLevel] = useState<Level>(1);
  const [themes, setThemes] = useState<Theme[]>([...THEMES]);
  const canStart = themes.length > 0;
  const meta = useMemo(() => ({ level, themes, count: COUNT }), [level, themes]);

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
      if (!email) { setHasLastResult(false); return; }
      const remote = await hasAnyResult(email);
      if (remote) { setHasLastResult(true); return; }
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

  async function clearIdentity() {
    await logout();
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
    if (role === "anonymous") {
      setOpenExamUpgrade(true);
      return;
    }

    if (authUsername) { startExam(); return; }
    const u = loadUser();
    if (!u?.pseudo?.trim() || !u?.email?.trim()) { openIdentityModal(); return; }
    startExam();
  }

  function toggleTheme(t: Theme) {
    setThemes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function startExam() {
    if (!canStart) return;
    localStorage.setItem("quiz_settings", JSON.stringify({
      level,
      themes,
      count: limits.quizCount,
      mode: "exam",
      perQuestion: 30,
      maxDuration: 900,
      perQuestionSeconds: 30,
    }));
    router.push("/quiz");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-6">

        {/* ===== HERO ===== */}
        <section className={`relative overflow-visible rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl transition-all duration-700 ${
          heroVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}>
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-blue-600"/>
            <div className="flex-1 bg-white"/>
            <div className="flex-1 bg-red-600"/>
          </div>
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl"/>
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"/>

          <div className="relative px-5 py-7 sm:px-8 sm:py-9">

            {/* Identité */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MarianneMark />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.22em] text-slate-400">
                      République française
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                      <span className="inline-flex h-2.5 w-4 overflow-hidden rounded-sm border border-white/10">
                        <span className="w-1/3 bg-blue-600"/>
                        <span className="w-1/3 bg-white"/>
                        <span className="w-1/3 bg-red-600"/>
                      </span>
                      FR
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">Examen blanc • Simulation 2026</div>
                </div>
              </div>
              {!authLoading && !isAuthenticated && user?.pseudo?.trim() && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  <span>Bonjour <span className="font-semibold text-white">{authUsername?.trim() || user?.pseudo?.trim() || "Utilisateur"}</span> 👋</span>
                  <span className="text-slate-500">•</span>
                  <button onClick={clearIdentity} className="text-slate-400 hover:text-red-400 hover:underline">Déconnexion</button>
                </div>
              )}
            </div>

            {/* Titre + CTA */}
            <div className="mb-3 mx-auto block text-center w-fit items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300 lg:mx-0">
              Conditions proches de l'épreuve
            </div>

            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl text-center lg:text-left">
              Testez-vous en{" "}
              <span className="text-blue-400">conditions</span>{" "}
              d'<span className="text-blue-400">examen blanc</span>.
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-400 text-center max-w-xl mx-auto lg:mx-0 lg:text-left">
              Simulation complète du test civique français — questions chronométrées, niveau exigeant, score requis 32/40.
            </p>

            {/* Pills info */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                40 questions
              </span>
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                ⏱️ 30s / question
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                ✓ Requis : 32/40
              </span>
            </div>

            {/* Boutons */}
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap justify-center lg:justify-start">
              <PremiumButton onClick={smartStartExam} label="Démarrer l'examen blanc" />
              <Button variant="secondary" onClick={() => router.push("/info")}>
                📖 Comprendre l'examen
              </Button>
              <Button variant="secondary" onClick={() => router.push("/")}>
                ✏️ Entraînement
              </Button>
            </div>
          </div>
        </section>

        {/* ===== NAVIGATION ===== */}
        <section className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => router.push("/info")}>📘 Guide</Button>
          {hasLastResult && (
            <Button variant="secondary" onClick={() => router.push("/results?mode=exam")}>📊 Dernier résultat</Button>
          )}
          <Button variant="secondary" onClick={() => router.push("/")}>✏️ Entraînement</Button>
          <Button variant="secondary" onClick={() => router.push("/leaderboard")}>🏆 Classement</Button>
        </section>

        {/* ===== CONFIGURATION ===== */}
        <section className="grid gap-5 lg:grid-cols-3">

          {/* Niveau */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-white">Niveau de difficulté</h3>
              <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-300">
                Difficile
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setLevel(n as Level)}
                  className={`rounded-xl border py-3 text-sm font-semibold transition ${
                    level === n
                      ? "border-blue-400/30 bg-blue-500/15 text-blue-200"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  Niveau {n}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400 space-y-1">
              <p>• Niveau 1 — prise en main</p>
              <p>• Niveau 2 — entraînement intermédiaire</p>
              <p>• <span className="text-blue-300 font-medium">Niveau 3 — simulation réaliste ✓</span></p>
            </div>
          </Card>

          {/* Thèmes */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-white">Thèmes</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                {themes.length}/{THEMES.length}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              {THEMES.map((t) => (
                <Pill key={t} active={themes.includes(t)} onClick={() => toggleTheme(t)}>{t}</Pill>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setThemes([...THEMES])}>Tout</Button>
              <Button variant="secondary" onClick={() => setThemes([])}>Aucun</Button>
            </div>
            {!canStart && (
              <p className="mt-3 text-xs text-red-400">⚠️ Sélectionnez au moins un thème.</p>
            )}
          </Card>

          {/* Résumé */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-white">Résumé</h3>
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                Chronométré
              </span>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              {[
                ["Questions", "40", "text-white"],
                ["Temps / question", "30 s", "text-amber-300"],
                ["Validation", "≥ 32 réponses", "text-emerald-300"],
                ["Niveau", `Niveau ${level}`, "text-blue-300"],
                ["Thèmes", `${themes.length} thème${themes.length > 1 ? "s" : ""}`, "text-white"],
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slate-400">{label}</span>
                  <span className={`font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <PremiumButton onClick={smartStartExam} label="Démarrer l'examen blanc" />
            </div>
          </Card>
        </section>

        {/* ===== FEATURES ===== */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: "⏱️", title: "Rythme soutenu", text: "Chronométrage serré pour simuler les conditions réelles.", color: "border-amber-400/20" },
            { icon: "🧭", title: "Vision réaliste", text: "Ambiance proche de l'évaluation officielle.", color: "border-blue-400/20" },
            { icon: "🏁", title: "Mesure de niveau", text: "Score précis pour cibler vos révisions.", color: "border-emerald-400/20" },
          ].map((item) => (
            <div key={item.title} className={`rounded-2xl border ${item.color} bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 transition hover:brightness-110`}>
              <div className="mb-2 text-2xl">{item.icon}</div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="mt-1 text-xs leading-6 text-slate-400">{item.text}</p>
            </div>
          ))}
        </section>

      </div>

      {/* ===== MODAL IDENTITÉ ===== */}
      {openExamUpgrade && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpenExamUpgrade(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
            <div className="text-center">
              <div className="text-4xl mb-3">👑</div>
              <h3 className="text-xl font-extrabold text-white">
                Créez un compte pour commencer l'examen blanc
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Les comptes Freemium bénéficient d’un essai gratuit limité de l’examen blanc. Les comptes Premium débloquent l’accès complet ainsi que les résultats détaillés et les corrections.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  setOpenExamUpgrade(false);
                  router.push("/pricing");
                }}
                className="w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
              >
                ✨ Créer un compte / Voir les offres
              </button>

              <button
                onClick={() => setOpenExamUpgrade(false)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {pseudoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPseudoOpen(false)}/>
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
            <h3 className="text-lg font-bold text-white">Avant de commencer</h3>
            <p className="mt-1 text-sm text-slate-400">Entrez un pseudo et une adresse email valide.</p>
            <input
              value={pseudoDraft}
              onChange={(e) => setPseudoDraft(e.target.value)}
              placeholder="Pseudo (ex : Carlos)"
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30"
              maxLength={20}
            />
            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="Adresse email"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30"
            />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" type="button" onClick={() => setPseudoOpen(false)}>Annuler</Button>
              <Button
                type="button"
                onClick={() => confirmIdentityAndRun(startExam)}
                disabled={!pseudoDraft.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail(emailDraft))}
              >
                Continuer
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}