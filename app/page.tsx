"use client";
import ScrollDemo from "./components/ScrollDemo";

import { useRouter } from "next/navigation";
import Card from "../components/Card";
import Button from "../components/Button";
import { useEffect, useMemo, useState, useCallback } from "react";
import { hasAnyResult } from "../src/lib/saveResult";
import { createClient } from "@/lib/supabase/client";
import { useUser, ROLE_LIMITS } from "./components/UserContext";
import EligibilityModalLauncher from "./components/EligibilityModalLauncher";
import AvisSection from "./components/AvisSection";

type Level = 1 | 2 | 3;
type Theme = "Valeurs" | "Institutions" | "Histoire" | "Société";

const COUNT = 40;
const PER_QUESTION_SECONDS = 20;
const THEMES: Theme[] = ["Valeurs", "Institutions", "Histoire", "Société"];

function encode(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

type QcmUser = { pseudo: string; email: string };

function loadUserLocal(): QcmUser | null {
  try {
    const raw = localStorage.getItem("qcm_user");
    return raw ? (JSON.parse(raw) as QcmUser) : null;
  } catch { return null; }
}

function saveUser(u: QcmUser) {
  localStorage.setItem("qcm_user", JSON.stringify(u));
}

// ─── Calcul du streak ──────────────────────────────────────────────────────
function getStreak(): number {
  try {
    const raw = localStorage.getItem("qcm_streak");
    if (!raw) return 0;
    const { count, lastDate } = JSON.parse(raw) as { count: number; lastDate: string };
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastDate === today || lastDate === yesterday) return count;
    return 0;
  } catch { return 0; }
}

function updateStreak() {
  try {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const raw = localStorage.getItem("qcm_streak");
    if (!raw) {
      localStorage.setItem("qcm_streak", JSON.stringify({ count: 1, lastDate: today }));
      return;
    }
    const { count, lastDate } = JSON.parse(raw) as { count: number; lastDate: string };
    if (lastDate === today) return;
    if (lastDate === yesterday) {
      localStorage.setItem("qcm_streak", JSON.stringify({ count: count + 1, lastDate: today }));
    } else {
      localStorage.setItem("qcm_streak", JSON.stringify({ count: 1, lastDate: today }));
    }
  } catch {}
}

// ─── Pill ──────────────────────────────────────────────────────────────────
function Pill({ children, active = false, onClick }: {
  children: React.ReactNode; active?: boolean; onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
        active
          ? "border-blue-400/30 bg-blue-500/15 text-blue-200"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/20 hover:bg-white/10 hover:text-white"
      }`}>
      {children}
    </button>
  );
}

// ─── Modal Onboarding ──────────────────────────────────────────────────────
function OnboardingModal({ onClose, onAction }: {
  onClose: () => void;
  onAction: (action: "scroll" | "quiz" | "audio") => void;
}) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: "📱",
      title: "Révisez en scrollant",
      desc: "Swipez verticalement pour changer de question, horizontalement pour voir les QCM associés. Aussi rapide qu'un fil d'actu.",
      action: "scroll" as const,
      cta: "Essayer le Scroll",
      color: "border-amber-400/20 bg-amber-500/10 text-amber-200",
      btnColor: "bg-amber-500 text-slate-950 hover:bg-amber-400",
    },
    {
      icon: "🎯",
      title: "Testez votre niveau",
      desc: "Faites un premier test de 10 questions pour savoir où vous en êtes. Vos erreurs seront expliquées en détail.",
      action: "quiz" as const,
      cta: "Faire un test",
      color: "border-blue-400/20 bg-blue-500/10 text-blue-200",
      btnColor: "bg-blue-600 text-white hover:bg-blue-500",
    },
    {
      icon: "🎧",
      title: "Écoutez en déplacement",
      desc: "100 épisodes audio guidés au format entretien réel. Révisez dans le métro, en cuisine, partout.",
      action: "audio" as const,
      cta: "Découvrir l'audio",
      color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
      btnColor: "bg-emerald-600 text-white hover:bg-emerald-500",
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-[101] w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/98 to-slate-900/98 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.6)]">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-blue-400" : i < step ? "w-3 bg-blue-400/50" : "w-3 bg-white/15"
              }`} />
            ))}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition text-lg">✕</button>
        </div>

        {/* Bienvenue */}
        {step === 0 && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs text-slate-400">
              🇫🇷 Bienvenue sur <span className="font-semibold text-white">QCM Assimilation</span> — la meilleure façon de préparer votre entretien civique.
            </p>
          </div>
        )}

        {/* Contenu étape */}
        <div className={`mb-5 rounded-2xl border p-4 ${current.color}`}>
          <div className="mb-2 text-3xl">{current.icon}</div>
          <h3 className="mb-1 text-base font-extrabold text-white">{current.title}</h3>
          <p className="text-xs leading-5 opacity-80">{current.desc}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { onAction(current.action); onClose(); }}
            className={`w-full rounded-2xl py-3 text-sm font-bold transition active:scale-[0.98] ${current.btnColor}`}
          >
            {current.cta} →
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/10">
              Étape suivante
            </button>
          ) : (
            <button onClick={onClose}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/10">
              Commencer librement
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { role, username: authUsername, loading: authLoading, isAuthenticated, logout } = useUser();
  const limits = ROLE_LIMITS[role];

  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [pseudoDraft, setPseudoDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [pseudoOpen, setPseudoOpen] = useState(false);
  const [hasLastResult, setHasLastResult] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [streak, setStreak] = useState(0);
  const [openExamUpgrade, setOpenExamUpgrade] = useState(false);

  useEffect(() => {
    const u = loadUserLocal();
    if (u) { setPseudo(u.pseudo); setEmail(u.email); setPseudoDraft(u.pseudo); setEmailDraft(u.email); }
    const t = setTimeout(() => setHeroVisible(true), 50);

    // Streak
    setStreak(getStreak());

    // Onboarding — afficher seulement à la 1ère visite
    const onboarded = localStorage.getItem("qcm_onboarded");
    if (!onboarded) {
      setTimeout(() => setShowOnboarding(true), 800);
    }

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const u = loadUserLocal();
    if (!u?.email) { setHasLastResult(false); return; }
    const e = u.email.trim().toLowerCase();
    async function check() {
      const remote = await hasAnyResult(e);
      if (remote) { setHasLastResult(true); return; }
      setHasLastResult(
        !!localStorage.getItem(`last_result:train:${e}`) ||
        !!localStorage.getItem(`last_result:exam:${e}`)
      );
    }
    check();
  }, [pseudo, email]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const username = session.user.user_metadata?.username || session.user.email?.split("@")[0] || "";
        const email = session.user.email || "";
        setPseudo(username); setEmail(email); setPseudoDraft(username); setEmailDraft(email);
        saveUser({ pseudo: username, email });
      }
    });
  }, []);

  function requireAuthAndRun(action: () => void) {
    if (!pseudo || !email) { setPseudoOpen(true); return; }
    action();
  }

  function openPseudoModal() {
    try {
      const raw = localStorage.getItem("qcm_user");
      if (raw) {
        const u = JSON.parse(raw) as { pseudo?: string; email?: string };
        setPseudoDraft(u.pseudo ?? pseudo ?? "");
        setEmailDraft(u.email ?? email ?? "");
      } else { setPseudoDraft(pseudo ?? ""); setEmailDraft(email ?? ""); }
    } catch { setPseudoDraft(pseudo ?? ""); setEmailDraft(email ?? ""); }
    setPseudoOpen(true);
  }

  async function clearPseudo() {
    await logout();
    setPseudo(""); setEmail(""); setPseudoDraft(""); setEmailDraft("");
    setHasLastResult(false); setPseudoOpen(false); setHomeMenuOpen(false);
  }

  const [level, setLevel] = useState<Level>(1);
  const [themes, setThemes] = useState<Theme[]>([...THEMES]);
  const canStart = themes.length > 0;

  const meta = useMemo(() => ({
    level, themes, count: COUNT, perQuestionSeconds: PER_QUESTION_SECONDS, mode: "train" as const,
  }), [level, themes]);

  function confirmIdentity() {
    const p = pseudoDraft.trim();
    const e = emailDraft.trim().toLowerCase();
    if (!p || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return;
    saveUser({ pseudo: p, email: e }); setPseudo(p); setEmail(e); setPseudoOpen(false);
    localStorage.setItem("quiz_settings", JSON.stringify(meta));
    router.push("/quiz");
  }

  function start() {
    if (!canStart) return;
    updateStreak();
    setStreak(getStreak());
    requireAuthAndRun(() => { localStorage.setItem("quiz_settings", JSON.stringify(meta)); router.push("/quiz"); });
  }

  function startExam() {
    if (role === "anonymous") { setOpenExamUpgrade(true); return; }
    requireAuthAndRun(() => { router.push("/exam"); });
  }

  function toggleTheme(t: Theme) {
    setThemes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  const handleOnboardingAction = useCallback((action: "scroll" | "quiz" | "audio") => {
    localStorage.setItem("qcm_onboarded", "1");
    if (action === "scroll") router.push("/scroll");
    else if (action === "quiz") start();
    else router.push("/audio");
  }, [router]);

  const closeOnboarding = useCallback(() => {
    localStorage.setItem("qcm_onboarded", "1");
    setShowOnboarding(false);
  }, []);

  const streakMessage = streak >= 7 ? "🔥 Incroyable !" : streak >= 3 ? "💪 Continue !" : streak >= 1 ? "✨ Bonne habitude !" : "";

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const payload: Record<string, string> = {
      "form-name": "feedback-qcm", rating: String(rating), comment: comment.trim(),
      pseudo: pseudo.trim() || "", page: "home", level: String(level),
      themes: themes.join(", "), count: String(COUNT), mode: "train",
    };
    try {
      const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: encode(payload) });
      if (!res.ok) throw new Error("failed");
      setSent(true); setComment("");
    } catch { alert("Erreur d'envoi. Réessaie."); }
    finally { setSending(false); }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <EligibilityModalLauncher isAuthenticated={!!pseudo.trim() && !!email.trim()} />
      <div className="space-y-8 sm:space-y-10">

        {/* ══════════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════════ */}
        <section className={`relative overflow-visible rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl transition-all duration-700 ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-blue-600"/><div className="flex-1 bg-white"/><div className="flex-1 bg-red-600"/>
          </div>
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl"/>
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"/>

          <div className="relative px-5 py-7 sm:px-8 sm:py-9">

            {/* Nav */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-14 overflow-hidden rounded-lg border border-white/10 shadow-md">
                  <span className="flex-1 bg-blue-700"/><span className="flex-1 bg-white"/><span className="flex-1 bg-red-600"/>
                </span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">République française</div>
                  <div className="text-xs text-slate-400">Plateforme d'entraînement 2026</div>
                </div>
              </div>

              {!authLoading && isAuthenticated ? (
                <div className="relative flex justify-end">
                  <button onClick={() => setHomeMenuOpen(!homeMenuOpen)}
                    className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition">
                    <span>Bonjour <span className="font-semibold text-white">{authUsername?.trim() || pseudo.trim()}</span> 👋</span>
                    {streak > 0 && (
                      <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                        🔥 {streak}j
                      </span>
                    )}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform: homeMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {homeMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-0" onClick={() => setHomeMenuOpen(false)} />
                      <div className="fixed right-4 top-20 z-50 w-52 rounded-[1.6rem] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:absolute sm:right-0 sm:top-full sm:mt-2"
                        style={{ background: "linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(10,15,26,0.98) 100%)" }}>
                        <div className="border-b border-white/10 px-3 py-2">
                          <p className="text-sm font-semibold text-white">{authUsername?.trim() || pseudo.trim()}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{role === "elite" ? "👑 Élite" : role === "premium" ? "🎯 Premium" : "✨ Freemium"}</p>
                          {streak > 0 && (
                            <p className="mt-1 text-xs text-orange-300">🔥 {streak} jour{streak > 1 ? "s" : ""} de suite {streakMessage}</p>
                          )}
                        </div>
                        <div className="py-2">
                          {[
                            { label: "Réviser", icon: "📚", onClick: () => router.push("/scroll") },
                            { label: "S'entraîner", icon: "🎯", onClick: () => router.push("/quiz") },
                            { label: "Audio", icon: "🎧", onClick: () => router.push("/audio") },
                            { label: "Résultats", icon: "📊", onClick: () => router.push("/results") },
                            { label: "Mon compte", icon: "👤", onClick: () => router.push("/account") },
                            { label: "Ressources", icon: "🏛️", onClick: () => router.push("/resources") },
                            { label: "Tarifs", icon: "👑", onClick: () => router.push("/pricing") },
                          ].map((item) => (
                            <button key={item.label} onClick={() => { setHomeMenuOpen(false); item.onClick(); }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                              <span>{item.icon}</span><span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-white/10 py-1">
                          <button onClick={clearPseudo}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10">
                            <span>🚪</span>Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push("/login")}
                    className="rounded-2xl border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/15 hover:text-white">
                    Se connecter
                  </button>
                  <button onClick={() => router.push("/register")}
                    className="rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition hover:brightness-110">
                    Créer un compte
                  </button>
                </div>
              )}
            </div>

            {/* ── ANGLE ÉMOTIONNEL ── */}
            {!isAuthenticated && (
              <div className="mb-5 rounded-2xl border border-red-400/15 bg-red-500/8 px-4 py-3 text-center">
                <p className="text-sm font-semibold leading-6 text-slate-200">
                  <span className="text-red-300">Des milliers de candidats échouent faute de préparation.</span>
                  <span className="ml-1 text-white">Vous, vous serez prêt.</span>
                </p>
              </div>
            )}

            {/* ── STREAK pour utilisateurs connectés ── */}
            {isAuthenticated && streak > 0 && (
              <div className="mb-5 rounded-2xl border border-orange-400/20 bg-orange-500/8 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-orange-200">
                  🔥 {streak} jour{streak > 1 ? "s" : ""} de révision consécutif{streak > 1 ? "s" : ""} — {streakMessage}
                </p>
                <p className="mt-0.5 text-xs text-orange-300/70">Continuez aujourd'hui pour maintenir votre série !</p>
              </div>
            )}

            {/* ── STREAK vide pour utilisateurs connectés ── */}
            {isAuthenticated && streak === 0 && (
              <div className="mb-5 rounded-2xl border border-slate-400/10 bg-white/3 px-4 py-3 text-center">
                <p className="text-xs text-slate-400">
                  🎯 Faites un exercice aujourd'hui pour démarrer votre série de révisions
                </p>
              </div>
            )}

            {/* Badge + Titre */}
            <div className="mb-3 mx-auto block text-center w-fit rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              Plus de 800 questions-réponses
            </div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl text-center">
              Préparez votre <span className="text-blue-400">parcours</span> en <span className="text-blue-400">France</span>.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 text-center max-w-xl mx-auto">
              Valeurs de la République • Institutions • Histoire • Vie en société — entraînement progressif conforme à l'examen civique 2026.
            </p>

            {/* ── STATS de réassurance ── */}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {[
                { val: "93%", label: "taux de réussite", color: "text-emerald-300", bg: "border-emerald-400/20 bg-emerald-500/8" },
                { val: "800+", label: "questions", color: "text-blue-300", bg: "border-blue-400/20 bg-blue-500/8" },
                { val: "2 sem.", label: "pour être prêt", color: "text-amber-300", bg: "border-amber-400/20 bg-amber-500/8" },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl border px-4 py-2 text-center ${s.bg}`}>
                  <div className={`text-base font-extrabold ${s.color}`}>{s.val}</div>
                  <div className="text-[10px] text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">📝 Entraînement progressif</span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">✓ Corrections détaillées</span>
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">🎯 Simulation réaliste</span>
            </div>

            {/* CTA principaux */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button onClick={start}
                className="inline-flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-6 py-4 text-base font-bold text-white shadow-[0_12px_32px_rgba(37,99,235,0.35)] transition hover:brightness-110 active:scale-[0.98] sm:w-auto">
                <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l10 5.5-10 5.5V1.5z"/></svg>
                Commencer un test
              </button>
              <button onClick={() => setShowReviseModal(true)}
                className="inline-flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-6 py-4 text-base font-bold text-amber-200 transition hover:border-amber-400/50 hover:bg-amber-500/15 active:scale-[0.98] sm:w-auto">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
                Réviser
              </button>
            </div>

            {/* Actions secondaires */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={() => router.push("/audio")}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                🎧 Bibliothèque audio
              </button>
              <button onClick={() => { const el = document.getElementById("avis-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                ⭐ Voir les avis
              </button>
              <button onClick={() => router.push("/leaderboard")}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                🏆 Classement
              </button>
              <button onClick={() => router.push("/resources")}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                🏛️ Ressources
              </button>
              {/* Bouton guide onboarding */}
              {!isAuthenticated && (
                <button onClick={() => setShowOnboarding(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/15">
                  🗺️ Guide de démarrage
                </button>
              )}
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 2 — DÉMO SCROLL
        ══════════════════════════════════════════ */}
        <ScrollDemo />

        {/* ══════════════════════════════════════════
            SECTION 3 — PARAMÉTRAGE
        ══════════════════════════════════════════ */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Niveau */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-xl">🎯</div>
                <div>
                  <h3 className="text-base font-bold text-white">Choisissez votre niveau</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Ajustez la difficulté selon votre progression.</p>
                </div>
              </div>
              <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">3 niveaux</div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[1, 2, 3].map((n) => {
                const active = level === n;
                const locked = !limits.levels.includes(n);
                return (
                  <button key={n} type="button" onClick={() => !locked && setLevel(n as Level)}
                    className={`relative rounded-2xl border px-4 py-4 text-center transition-all duration-200 ${locked ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600" : active ? "border-blue-400/30 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-200 shadow-[0_10px_30px_rgba(37,99,235,0.18)]" : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/20 hover:bg-white/10 hover:text-white"}`}>
                    <div className="text-sm font-semibold">Niveau {n}</div>
                    {locked && <div className="mt-1 text-xs text-amber-400/70">🔒 Premium</div>}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-sm font-semibold text-white">Conseil</div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Niveau 1 : bases et repères essentiels</li>
                <li>• Niveau 2 : précision et pièges fréquents</li>
                <li>• Niveau 3 : approfondissement et maîtrise</li>
              </ul>
            </div>
            {(role !== "premium" && role !== "elite") && (
              <button onClick={() => router.push("/pricing")}
                className="mt-4 w-full rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left transition hover:bg-amber-500/15">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-amber-300">👑 Passer en Premium</p>
                    <p className="mt-0.5 text-[11px] text-amber-200/60">Débloquez niveaux 2 & 3 + 40 questions + examen blanc</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-amber-400"><path d="M5 4l6 4-6 4V4z" fill="currentColor"/></svg>
                </div>
              </button>
            )}
          </Card>

          {/* Thèmes */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-xl">📚</div>
                <div>
                  <h3 className="text-base font-bold text-white">Sélectionnez vos thèmes</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Ciblez vos révisions selon vos besoins.</p>
                </div>
              </div>
              <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">{themes.length}/{THEMES.length}</div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              {THEMES.map((t) => <Pill key={t} active={themes.includes(t)} onClick={() => toggleTheme(t)}>{t}</Pill>)}
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button variant="secondary" onClick={() => setThemes([...THEMES])}>Tout sélectionner</Button>
              <Button variant="secondary" onClick={() => setThemes([])}>Tout retirer</Button>
            </div>
            {!canStart && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200 sm:text-left">
                ⚠️ Sélectionnez au moins un thème pour démarrer.
              </div>
            )}
          </Card>

          {/* Résumé */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-xl">📋</div>
                <div>
                  <h3 className="text-base font-bold text-white">Résumé de votre session</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Vérifiez les paramètres avant de lancer le test.</p>
                </div>
              </div>
              <div className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">Prêt</div>
            </div>
            <div className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm">
              {[["Questions", `${limits.quizCount} questions`], ["Temps / question", `${PER_QUESTION_SECONDS}s`], ["Niveau", `Niveau ${level}`]].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-white">{value}</span>
                </div>
              ))}
              {(role !== "premium" && role !== "elite") && (
                <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {role === "anonymous" ? "👤 Crée un compte gratuit pour accéder à 20 questions" : role === "elite" ? "" : "✨ Passe en Premium pour accéder à 40 questions et tous les niveaux"}
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Button className="w-full" onClick={start} disabled={!canStart}>Faire un test</Button>
              {limits.canExam ? (
                <Button variant="danger" className="w-full" onClick={startExam}>Examen blanc</Button>
              ) : (
                <div className="relative">
                  <button disabled className="w-full rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-slate-600 cursor-not-allowed">Examen blanc</button>
                  <div className="mt-1 text-center text-xs text-amber-400/70">🔒 Disponible en Premium — essai gratuit pour Freemium</div>
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-xs leading-6 text-slate-400 sm:text-left">
              Votre résultat affichera vos erreurs, vos bonnes réponses et les explications pour progresser plus vite.
            </p>
          </Card>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 4 — BÉNÉFICES
        ══════════════════════════════════════════ */}
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "🧠", title: "Comprenez vos erreurs et progressez rapidement", text: "Chaque question est accompagnée d'une explication détaillée pour transformer chaque erreur en véritable leçon." },
            { icon: "📌", title: "Travaillez uniquement vos points faibles", text: "Ciblez les thèmes qui vous manquent, ajustez le niveau de difficulté et concentrez-vous sur ce qui compte vraiment." },
            { icon: "🏁", title: "Simulez l'examen réel et gagnez en confiance", text: "Le mode examen blanc reproduit les conditions réelles de l'entretien civique — pour arriver préparé le jour J." },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 text-center shadow-[0_18px_45px_rgba(2,8,23,0.28)] transition-all duration-300 hover:border-blue-400/20 md:text-left">
              <div className="mb-3 text-2xl">{item.icon}</div>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{item.text}</p>
            </div>
          ))}
        </section>

      </div>

      {/* ══════════════════════════════════════════
          MODAL — Onboarding
      ══════════════════════════════════════════ */}
      {showOnboarding && (
        <OnboardingModal
          onClose={closeOnboarding}
          onAction={handleOnboardingAction}
        />
      )}

      {/* ══════════════════════════════════════════
          MODAL — Réviser
      ══════════════════════════════════════════ */}
      {showReviseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReviseModal(false)} />
          <div className="relative z-[101] w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/98 to-slate-900/98 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.6)]">
            <button onClick={() => setShowReviseModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-400 transition hover:text-white">✕</button>
            <h3 className="text-lg font-extrabold text-white">Comment voulez-vous réviser ?</h3>
            <p className="mt-1 text-sm text-slate-400">Choisissez votre mode de révision préféré.</p>
            <div className="mt-5 flex flex-col gap-3">
              <button onClick={() => { setShowReviseModal(false); router.push("/scroll"); }}
                className="flex items-center gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-left transition hover:border-amber-400/40 hover:bg-amber-500/15 active:scale-[0.98]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/20 text-2xl">📱</div>
                <div className="flex-1">
                  <p className="font-bold text-white">Flash-cards Scroll</p>
                  <p className="mt-0.5 text-xs text-slate-400">Swipez verticalement pour réviser — rapide et immersif.</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-amber-400"><path d="M5 4l6 4-6 4V4z" fill="currentColor"/></svg>
              </button>
              <button onClick={() => { setShowReviseModal(false); router.push("/audio"); }}
                className="flex items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-left transition hover:border-emerald-400/40 hover:bg-emerald-500/15 active:scale-[0.98]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/20 text-2xl">🎧</div>
                <div className="flex-1">
                  <p className="font-bold text-white">Bibliothèque Audio</p>
                  <p className="mt-0.5 text-xs text-slate-400">Écoutez les épisodes guidés — format entretien réel, voix naturelle.</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-emerald-400"><path d="M5 4l6 4-6 4V4z" fill="currentColor"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal identité */}
      {pseudoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPseudoOpen(false)} />
          <div className="relative z-[101] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_25px_70px_rgba(2,8,23,0.55)] sm:p-6">
            <div className="mb-4 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Avant de commencer</h3>
              <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-400">Créez un compte pour sauvegarder vos résultats, ou continuez sans compte.</p>
            </div>
            <div className="flex flex-col gap-3">
              <a href={`/register?email=${encodeURIComponent(emailDraft)}&pseudo=${encodeURIComponent(pseudoDraft)}`}
                className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:brightness-105">
                Créer un compte gratuit
              </a>
              <a href="/login" className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                J'ai déjà un compte
              </a>
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2.5 text-center text-xs text-slate-500">Ou continuer sans compte</p>
              <input value={pseudoDraft} onChange={(e) => setPseudoDraft(e.target.value)} placeholder="Pseudo (ex : Carlos)"
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
                maxLength={20} autoFocus />
              <input type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} placeholder="Adresse email"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20" />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" type="button" onClick={() => setPseudoOpen(false)}>Annuler</Button>
                <Button type="button" onClick={confirmIdentity} disabled={!pseudoDraft.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim().toLowerCase())}>
                  Continuer sans compte
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal upgrade examen */}
      {openExamUpgrade && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpenExamUpgrade(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
            <div className="text-center">
              <div className="text-4xl mb-3">👑</div>
              <h3 className="text-xl font-extrabold text-white">Créez un compte pour accéder à l'examen blanc</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">L'examen blanc est accessible aux comptes Freemium avec un essai gratuit limité, puis en illimité avec Premium.</p>
            </div>
            <div className="mt-6 space-y-3">
              <button onClick={() => { setOpenExamUpgrade(false); router.push("/pricing"); }}
                className="w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400">
                ✨ Créer un compte / Voir les offres
              </button>
              <button onClick={() => setOpenExamUpgrade(false)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <form name="feedback-qcm" method="POST" data-netlify="true" hidden>
        <input type="hidden" name="form-name" value="feedback-qcm" />
        <input type="text" name="pseudo" /><input type="text" name="rating" />
        <input type="text" name="comment" /><input type="text" name="page" />
        <input type="text" name="level" /><input type="text" name="themes" />
        <input type="text" name="count" /><input type="text" name="mode" />
      </form>

      <AvisSection />
    </main>
  );
}
