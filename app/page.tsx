"use client";
import ScrollDemo from "./components/ScrollDemo";
import { BookOpen, Bot, ChevronRight, Headphones, X, Target, Clock, ListChecks } from "lucide-react";

import { useRouter } from "next/navigation";
import Alert from "../components/Alert";
import Card from "../components/Card";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import { useEffect, useMemo, useState, useCallback } from "react";
import { hasAnyResult } from "../src/lib/saveResult";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./components/UserContext";
import { getAccessQuota } from "../src/lib/access";
import EligibilityModalLauncher from "./components/EligibilityModalLauncher";
import AvisSection from "./components/AvisSection";
import FeedbackModal from "./components/FeedbackModal";

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

/* ── Pill thème ──────────────────────────────────────────────── */
function Pill({ children, active = false, onClick }: {
  children: React.ReactNode; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-[var(--cc-primary)] bg-[var(--cc-primary-soft)] text-[var(--cc-primary)]"
          : "border-[var(--cc-border)] bg-[var(--cc-surface)] text-[var(--cc-text)] hover:border-[var(--cc-primary)] hover:text-[var(--cc-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Modal Onboarding ─────────────────────────────────────────── */
function OnboardingModal({ onClose, onAction, role = "anonymous" }: {
  onClose: () => void;
  onAction: (action: "scroll" | "quiz" | "audio") => void;
  role?: string;
}) {
  const [step, setStep] = useState(0);

  const baseSteps = [
    {
      title: "Réviser par fiches",
      desc: "Faites défiler les questions verticalement pour mémoriser les réponses à votre rythme.",
      action: "scroll" as const,
      cta: "Essayer les fiches",
      premium: false,
    },
    {
      title: "Passer un test QCM",
      desc: "Faites un premier test de 10 questions pour évaluer votre niveau. Chaque erreur est expliquée.",
      action: "quiz" as const,
      cta: "Commencer un test",
      premium: false,
    },
    {
      title: "Écouter en déplacement",
      desc: "100 épisodes audio au format entretien réel. Préparez-vous dans les transports, au quotidien.",
      action: "audio" as const,
      cta: "Découvrir l'audio",
      premium: false,
    },
    {
      title: "Retours d'expériences",
      desc: "Lisez les témoignages de candidats ayant passé l'entretien : questions posées, conseils, notes.",
      action: "scroll" as const,
      cta: "Lire les témoignages",
      premium: true,
      href: "/communaute/temoignages",
    },
    {
      title: "Forum communauté",
      desc: "Posez vos questions et partagez vos conseils avec d'autres candidats.",
      action: "scroll" as const,
      cta: "Rejoindre le forum",
      premium: true,
      href: "/communaute/forum",
    },
  ];

  const steps = baseSteps.filter(s => !s.premium || ['premium','elite','super_admin','admin'].includes(role));
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--cc-text)]/50" onClick={onClose} />
      <div className="relative z-[101] w-full max-w-sm rounded border border-[var(--cc-border)] bg-[var(--cc-surface)] p-6 shadow-lg">

        {/* En-tête */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${
                i === step ? "w-6 bg-[var(--cc-primary)]" : i < step ? "w-3 bg-[var(--cc-primary)]/50" : "w-3 bg-[var(--cc-border)]"
              }`} />
            ))}
          </div>
          <button onClick={onClose} className="text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] text-xl leading-none" aria-label="Fermer">×</button>
        </div>

        {step === 0 && (
          <div className="mb-5 rounded border-l-4 border-[var(--cc-primary)] bg-[var(--cc-primary-soft)] px-4 py-3">
            <p className="text-sm text-[var(--cc-text)]">
              Bienvenue sur <strong>Cap Citoyen</strong> — votre outil de préparation à l'entretien civique 2026.
            </p>
          </div>
        )}

        {/* Contenu étape */}
        <div className="mb-5 rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] p-4">
          <h3 className="mb-1 text-base font-bold text-[var(--cc-text)]">{current.title}</h3>
          <p className="text-sm leading-6 text-[var(--cc-text)]">{current.desc}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {(current as { href?: string }).href ? (
            <a
              href={(current as { href?: string }).href}
              onClick={onClose}
              className="cc-btn cc-btn-primary w-full justify-center text-center no-underline"
            >
              {current.cta}
            </a>
          ) : (
            <button
              onClick={() => { onAction(current.action); onClose(); }}
              className="cc-btn cc-btn-primary w-full justify-center"
            >
              {current.cta}
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="cc-btn cc-btn-secondary w-full justify-center"
            >
              Étape suivante
            </button>
          ) : (
            <button onClick={onClose} className="cc-btn cc-btn-secondary w-full justify-center">
              Commencer librement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const { role, username: authUsername, loading: authLoading, isAuthenticated, logout } = useUser();
  const limits = getAccessQuota(role);

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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
    document.body.style.position = "static";
    return () => {
      document.documentElement.style.overflowY = "auto";
      document.body.style.overflowY = "auto";
      document.body.style.position = "static";
    };
  }, []);

  useEffect(() => {
    const u = loadUserLocal();
    if (u) { setPseudo(u.pseudo); setEmail(u.email); setPseudoDraft(u.pseudo); setEmailDraft(u.email); }
    const t = setTimeout(() => setHeroVisible(true), 50);
    setStreak(getStreak());
    const onboarded = localStorage.getItem("qcm_onboarded");
    if (!onboarded) setTimeout(() => setShowOnboarding(true), 800);
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

  const displayName = authUsername?.trim() || pseudo.trim();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <EligibilityModalLauncher isAuthenticated={!!pseudo.trim() && !!email.trim()} />

      <div className="space-y-8 sm:space-y-10">

        {/* ══════════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════════ */}
        <section
          className={`relative overflow-hidden border border-[var(--cc-border)] bg-[var(--cc-surface)] transition-all duration-500 ${
            heroVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
          style={{ borderRadius: "var(--cc-radius-lg)" }}
        >
          {/* Filet tricolore */}
          <div className="absolute inset-x-0 top-0 z-10 flex h-1" aria-hidden="true">
            <span className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
            <span className="flex-1 bg-white" />
            <span className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
          </div>
          {/* Dégradé d'ambiance */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{ background: "linear-gradient(180deg, var(--cc-primary-soft) 0%, transparent 38%)", opacity: 0.7 }}
          />
          <div className="relative px-5 py-7 sm:px-8 sm:py-9">

            {/* Nav du hero */}
            <div className="mb-7 flex items-center justify-between gap-3">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-10 overflow-hidden rounded border border-[var(--cc-border)] shadow-sm" aria-hidden="true">
                  <span className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
                  <span className="flex-1 bg-white" />
                  <span className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
                </span>
                <span className="text-lg font-bold text-[var(--cc-primary)]">Cap Citoyen</span>
              </div>

              {/* Accès compte */}
              {!authLoading && isAuthenticated ? (
                <div className="relative flex justify-end">
                  <button
                    onClick={() => setHomeMenuOpen(!homeMenuOpen)}
                    className="flex items-center gap-2 rounded border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-2 text-sm text-[var(--cc-text)] hover:border-[var(--cc-primary)] transition-colors"
                    aria-expanded={homeMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>Bonjour, <span className="font-bold">{displayName}</span></span>
                    {streak > 0 && (
                      <span className="rounded bg-[var(--cc-primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--cc-primary)]">
                        {streak}j de révision
                      </span>
                    )}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                      style={{ transform: homeMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {homeMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setHomeMenuOpen(false)} />
                      <div className="absolute right-0 top-full z-50 mt-1 w-72 max-w-[calc(100vw-1rem)] rounded border border-[var(--cc-border)] bg-[var(--cc-surface)] shadow-md">
                        <div className="border-b border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3">
                          <p className="text-sm font-bold text-[var(--cc-text)]">{displayName}</p>
                          {role && role !== "anonymous" && (
                            <span className="mt-1 inline-block rounded bg-[var(--cc-primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--cc-primary)] capitalize">
                              {role}
                            </span>
                          )}
                          {streak > 0 && (
                            <p className="mt-1 text-xs text-[var(--cc-text-muted)]">{streak} jour{streak > 1 ? "s" : ""} de révision consécutif{streak > 1 ? "s" : ""}</p>
                          )}
                        </div>
                        {['super_admin','admin','moderator'].includes(role ?? '') && (
                          <div className="border-b border-[var(--cc-border)] p-2">
                            <button onClick={() => { setHomeMenuOpen(false); router.push("/admin"); }}
                              className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-medium text-[var(--cc-danger)] hover:bg-[var(--cc-danger-soft)] transition-colors">
                              Administration
                            </button>
                          </div>
                        )}
                        <div className="p-2">
                          {[
                            { href: "/scroll",  label: "Révision par fiches" },
                            { href: "/quiz",    label: "Entraînement QCM" },
                            { href: "/exam",    label: "Examen blanc" },
                            { href: "/audio",   label: "Bibliothèque audio" },
                            { href: "/results", label: "Mes résultats" },
                            { href: "/account", label: "Mon compte" },
                          ].map(({ href, label }) => (
                            <button key={href} onClick={() => { setHomeMenuOpen(false); router.push(href); }}
                              className="flex w-full items-center rounded px-2 py-2 text-sm text-[var(--cc-text)] hover:bg-[var(--cc-surface-alt)] transition-colors text-left">
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-[var(--cc-border)] p-2">
                          <button onClick={() => { setHomeMenuOpen(false); setShowFeedbackModal(true); }}
                            className="flex w-full items-center rounded px-2 py-2 text-sm text-[var(--cc-text-muted)] hover:bg-[var(--cc-surface-alt)] transition-colors">
                            Évaluer le service
                          </button>
                          <button onClick={clearPseudo}
                            className="flex w-full items-center rounded px-2 py-2 text-sm text-[var(--cc-danger)] hover:bg-[var(--cc-danger-soft)] transition-colors">
                            Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button onClick={() => router.push("/login")}
                  className="shrink-0 text-sm font-semibold text-[var(--cc-primary)] underline-offset-4 hover:underline">
                  Se connecter
                </button>
              )}
            </div>



            {/* Badge */}
            <span className="cc-badge cc-badge-info">Plus de 800 questions-réponses</span>

            {/* Titre */}
            <h1 className="mt-3 text-[1.75rem] font-extrabold leading-[1.15] tracking-tight text-[var(--cc-text)] sm:text-4xl">
              Réussissez l&apos;examen civique et votre{" "}
              <span className="text-[var(--cc-primary)]">parcours de naturalisation</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--cc-text-muted)]">
              Programme 2026 · Conforme à la réforme du 1er janvier 2026.
            </p>

            {/* Chiffres clés */}
            <div
              className="mt-6 grid grid-cols-3 py-4"
              style={{
                borderRadius: "var(--cc-radius-xl)",
                border: "1px solid var(--cc-border)",
                background: "var(--cc-surface)",
                boxShadow: "var(--cc-shadow-sm)",
              }}
            >
              {[
                { Icon: Target,     val: "32 / 40", label: "score requis" },
                { Icon: Clock,      val: "45 min",  label: "durée de l'examen" },
                { Icon: ListChecks, val: "800 +",   label: "questions" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center px-1.5 text-center"
                  style={{ borderRight: i < 2 ? "1px solid var(--cc-border)" : "none" }}
                >
                  <span className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--cc-primary-soft)] text-[var(--cc-primary)]">
                    <s.Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="text-lg font-extrabold leading-none text-[var(--cc-primary)]">{s.val}</span>
                  <span className="mt-1 text-[10.5px] leading-tight text-[var(--cc-text-muted)]">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Atouts */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { label: "Entraînement progressif", color: "var(--cc-primary)" },
                { label: "Corrections détaillées",  color: "var(--cc-success)" },
                { label: "Simulation réaliste",     color: "var(--cc-warning)" },
              ].map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--cc-text)]"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </span>
              ))}
            </div>

            {/* CTA principaux */}
            <div className="mt-7 flex flex-col gap-3">
              <button
                onClick={start}
                className="cc-btn cc-btn-primary w-full justify-center gap-2.5 px-6 py-3.5 text-base font-bold"
                style={{
                  background: "linear-gradient(180deg, color-mix(in srgb, var(--cc-primary) 82%, #fff), var(--cc-primary))",
                  boxShadow: "0 8px 20px color-mix(in srgb, var(--cc-primary) 26%, transparent)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                  <path d="M3 1.5l10 5.5-10 5.5V1.5z" />
                </svg>
                Commencer un entraînement
              </button>
              <button
                onClick={() => setShowReviseModal(true)}
                className="cc-btn cc-btn-secondary w-full justify-center gap-2.5 px-6 py-3.5 text-base font-semibold"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01" />
                </svg>
                Réviser
              </button>
            </div>

            {/* Réassurance / inscription */}
            {!isAuthenticated && (
              <p className="mt-4 text-center text-xs text-[var(--cc-text-muted)]">
                Pas encore de compte ?{" "}
                <button
                  onClick={() => router.push("/register")}
                  className="font-semibold text-[var(--cc-primary)] underline-offset-2 hover:underline"
                >
                  Créer un compte gratuit
                </button>
              </p>
            )}

            {/* Actions secondaires */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-[var(--cc-border)] pt-5">
              {[
                { label: "Bibliothèque audio", onClick: () => router.push("/audio") },
                { label: "Avis des utilisateurs", onClick: () => { const el = document.getElementById("avis-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); } },
                { label: "Classement", onClick: () => router.push("/leaderboard") },
                { label: "Ressources officielles", onClick: () => router.push("/resources") },
                { label: "Assistant IA démarches", onClick: () => router.push("/assistant") },
              ].map(({ label, onClick }) => (
                <button key={label} onClick={onClick}
                  className="cc-btn cc-btn-tertiary cc-btn-sm">
                  {label}
                </button>
              ))}
              {!isAuthenticated && (
                <button onClick={() => setShowOnboarding(true)} className="cc-btn cc-btn-tertiary cc-btn-sm">
                  Guide de démarrage
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
            SECTION 3 — PARAMÉTRAGE DE SESSION
        ══════════════════════════════════════════ */}
        <section className="grid gap-6 lg:grid-cols-3">

          {/* Niveau */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[var(--cc-text)]">Niveau de difficulté</h3>
                <p className="mt-0.5 text-xs text-[var(--cc-text-muted)]">Ajustez selon votre avancement.</p>
              </div>
              <span className="cc-badge cc-badge-neutral">3 niveaux</span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {([1, 2, 3] as const).map((n) => {
                const active = level === n;
                const locked = !limits.levels.includes(n);
                return (
                  <button key={n} type="button"
                    onClick={() => !locked && setLevel(n as Level)}
                    className={`relative rounded border px-4 py-4 text-center transition-colors ${
                      locked
                        ? "cursor-not-allowed border-[var(--cc-border)] bg-[var(--cc-surface-alt)] text-[var(--cc-text-disabled)]"
                        : active
                        ? "border-[var(--cc-primary)] bg-[var(--cc-primary-soft)] text-[var(--cc-primary)]"
                        : "border-[var(--cc-border)] bg-[var(--cc-surface)] text-[var(--cc-text)] hover:border-[var(--cc-primary)]"
                    }`}
                  >
                    <div className="text-sm font-bold">Niveau {n}</div>
                    {locked && <div className="mt-1 text-xs text-[var(--cc-warning)]">Abonnement requis</div>}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] p-4">
              <p className="mb-2 text-sm font-bold text-[var(--cc-text)]">Repères</p>
              <ul className="space-y-1.5 text-sm text-[var(--cc-text)]">
                <li>Niveau 1 — bases et repères essentiels</li>
                <li>Niveau 2 — précision et pièges fréquents</li>
                <li>Niveau 3 — approfondissement et maîtrise</li>
              </ul>
            </div>
            {!(['premium','elite','moderator','admin','super_admin'].includes(role ?? '')) && (
              <button onClick={() => router.push("/pricing")}
                className="cc-btn cc-btn-primary mt-4 w-full justify-start text-sm">
                Accéder aux niveaux 2 et 3 →
              </button>
            )}
          </Card>

          {/* Thèmes */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[var(--cc-text)]">Thèmes de révision</h3>
                <p className="mt-0.5 text-xs text-[var(--cc-text-muted)]">Concentrez vos révisions sur les domaines ciblés.</p>
              </div>
              <span className="cc-badge cc-badge-neutral">{themes.length}/{THEMES.length}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {THEMES.map((t) => <Pill key={t} active={themes.includes(t)} onClick={() => toggleTheme(t)}>{t}</Pill>)}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setThemes([...THEMES])}>Tout sélectionner</Button>
              <Button variant="secondary" size="sm" onClick={() => setThemes([])}>Tout retirer</Button>
            </div>
            {!canStart && (
              <div className="mt-4 cc-notice cc-notice-warning">
                <p className="text-sm text-[var(--cc-text)]">Sélectionnez au moins un thème pour démarrer.</p>
              </div>
            )}
          </Card>

          {/* Résumé */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[var(--cc-text)]">Résumé de la session</h3>
                <p className="mt-0.5 text-xs text-[var(--cc-text-muted)]">Vérifiez les paramètres avant de commencer.</p>
              </div>
              <span className="cc-badge cc-badge-success">Prêt</span>
            </div>
            <div className="mt-5 space-y-3 rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] p-4 text-sm">
              {[
                ["Questions",        `${limits.quiz} questions`],
                ["Temps / question", `${PER_QUESTION_SECONDS}s`],
                ["Niveau",          `Niveau ${level}`],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3">
                  <span className="text-[var(--cc-text-muted)]">{label}</span>
                  <span className="font-bold text-[var(--cc-text)]">{value}</span>
                </div>
              ))}
              {role !== "premium" && role !== "elite" && (
                <Alert variant="warning" noIcon className="mt-3">
                  <p className="text-xs">
                    {role === "anonymous"
                      ? "Créez un compte gratuit pour accéder à 20 questions."
                      : "Passez à un pass pour accéder à 40 questions et tous les niveaux."}
                  </p>
                </Alert>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Button className="w-full" onClick={start} disabled={!canStart}>
                Commencer le test
              </Button>
              {limits.canExam ? (
                <Button variant="secondary" className="w-full" onClick={startExam}>
                  Simulation d'examen blanc
                </Button>
              ) : (
                <div>
                  <button disabled className="w-full rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3 text-sm font-bold text-[var(--cc-text-disabled)] cursor-not-allowed">
                    Simulation d'examen blanc
                  </button>
                  <p className="mt-1 text-center text-xs text-[var(--cc-warning)]">Disponible avec un abonnement</p>
                </div>
              )}
            </div>
            <p className="mt-4 text-xs leading-6 text-[var(--cc-text-muted)]">
              Votre résultat affichera vos erreurs, vos bonnes réponses et les explications pour progresser.
            </p>
          </Card>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 4 — BÉNÉFICES
        ══════════════════════════════════════════ */}
        <section>
          <h2 className="mb-6 text-xl font-bold text-[var(--cc-text)]">Une préparation complète et progressive</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Comprendre ses erreurs pour progresser",
                text: "Chaque question est accompagnée d'une explication détaillée pour transformer chaque erreur en véritable leçon.",
                variant: "cc-badge-info",
              },
              {
                num: "02",
                title: "Concentrer ses révisions sur les points faibles",
                text: "Sélectionnez les thèmes qui vous manquent, ajustez le niveau de difficulté et optimisez votre temps de préparation.",
                variant: "cc-badge-success",
              },
              {
                num: "03",
                title: "Simuler les conditions réelles de l'entretien",
                text: "La simulation d'examen blanc reproduit les conditions officielles — durée, nombre de questions, format — pour arriver préparé le jour J.",
                variant: "cc-badge-warning",
              },
            ].map(item => (
              <div key={item.title} className="cc-card cc-card-elevated">
                <span className={`cc-badge ${item.variant} cc-badge-sm mb-4`}>{item.num}</span>
                <h3 className="text-base font-bold" style={{ color: "var(--cc-text)" }}>{item.title}</h3>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--cc-text-muted)" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5 — LIEN EXAMEN OFFICIEL
        ══════════════════════════════════════════ */}
        <section
          className="cc-card cc-card-featured"
          style={{ borderTopColor: "var(--cc-primary)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>Prêt à passer l'examen officiel ?</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--cc-text-muted)" }}>Retrouvez les centres d'examen CCI et les informations officielles sur le site du ministère.</p>
            </div>
            <a
              href="https://www.cci.fr/formation/cci-formez-vous-avec-le-test-dintegration-republicaine"
              target="_blank"
              rel="noopener noreferrer"
              className="cc-btn cc-btn-primary shrink-0 no-underline"
            >
              Trouver un centre d'examen
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </section>

      </div>

      {/* ══ MODAL — Onboarding ══════════════════════ */}
      {showOnboarding && !['premium','elite','moderator','admin','super_admin'].includes(role ?? '') && (
        <OnboardingModal role={role} onClose={closeOnboarding} onAction={handleOnboardingAction} />
      )}

      {/* ══ MODAL — Mode de révision ════════════════ */}
      {showReviseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "color-mix(in srgb, var(--cc-text) 50%, transparent)" }}
            onClick={() => setShowReviseModal(false)}
          />
          <div
            className="relative z-[101] w-full max-w-sm rounded-2xl border p-6 shadow-xl"
            style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}
          >
            <button
              onClick={() => setShowReviseModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 transition-colors"
              style={{ color: "var(--cc-text-muted)" }}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>
              Comment voulez-vous réviser ?
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>
              Choisissez votre format de révision préféré.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {([
                { label: "Révision par fiches",     desc: "Défilement vertical des questions — rapide et efficace.", href: "/scroll",    Icon: BookOpen   },
                { label: "Bibliothèque audio",       desc: "Épisodes guidés au format entretien réel, voix naturelle.", href: "/audio",  Icon: Headphones },
                { label: "Assistant IA démarches",   desc: "Posez vos questions sur la naturalisation et l'entretien civique.", href: "/assistant", Icon: Bot },
              ] as const).map(({ label, desc, href, Icon }) => (
                <button
                  key={href}
                  onClick={() => { setShowReviseModal(false); router.push(href); }}
                  className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:opacity-90"
                  style={{
                    borderColor: "var(--cc-border)",
                    background: "var(--cc-surface-alt)",
                  }}
                >
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: "color-mix(in srgb, var(--cc-primary) 12%, var(--cc-surface))",
                      color: "var(--cc-primary)",
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>{label}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--cc-text-muted)" }}>{desc}</p>
                  </div>
                  <ChevronRight size={14} className="mt-1 shrink-0" style={{ color: "var(--cc-primary)" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL — Identité ════════════════════════ */}
      {pseudoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--cc-text)]/50" onClick={() => setPseudoOpen(false)} />
          <div className="relative z-[101] w-full max-w-md rounded border border-[var(--cc-border)] bg-[var(--cc-surface)] p-6 shadow-lg">
            <h3 className="text-lg font-bold text-[var(--cc-text)]">Avant de commencer</h3>
            <p className="mt-1.5 text-sm text-[var(--cc-text-muted)]">Créez un compte pour sauvegarder vos résultats, ou continuez sans compte.</p>

            <div className="mt-5 flex flex-col gap-3">
              <a href={`/register?email=${encodeURIComponent(emailDraft)}&pseudo=${encodeURIComponent(pseudoDraft)}`}
                className="cc-btn cc-btn-primary w-full justify-center no-underline">
                Créer un compte gratuit
              </a>
              <a href="/login"
                className="cc-btn cc-btn-secondary w-full justify-center no-underline">
                J'ai déjà un compte
              </a>
            </div>

            <div className="mt-5 border-t border-[var(--cc-border)] pt-5">
              <p className="mb-3 text-xs text-[var(--cc-text-muted)]">Ou continuer sans compte</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--cc-text)]" htmlFor="pseudo-input">Pseudo</label>
                  <input
                    id="pseudo-input"
                    value={pseudoDraft}
                    onChange={e => setPseudoDraft(e.target.value)}
                    placeholder="ex : Carlos"
                    maxLength={20}
                    autoFocus
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--cc-text)]" htmlFor="email-input">Adresse email</label>
                  <input
                    id="email-input"
                    type="email"
                    value={emailDraft}
                    onChange={e => setEmailDraft(e.target.value)}
                    placeholder="votre@email.fr"
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-[var(--cc-text-muted)]">
                  Vos données sont utilisées uniquement pour sauvegarder vos résultats.
                  Conformément au RGPD, vous pouvez les supprimer à tout moment depuis votre compte.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="secondary" type="button" onClick={() => setPseudoOpen(false)}>Annuler</Button>
                  <Button
                    type="button"
                    onClick={confirmIdentity}
                    disabled={!pseudoDraft.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim().toLowerCase())}
                  >
                    Continuer sans compte
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL — Accès examen ═════════════════════ */}
      {openExamUpgrade && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--cc-text)]/50" onClick={() => setOpenExamUpgrade(false)} />
          <div className="relative w-full max-w-md rounded border border-[var(--cc-border)] bg-[var(--cc-surface)] p-6 shadow-lg">
            <h3 className="text-xl font-bold text-[var(--cc-text)]">Accès à la simulation d'examen</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--cc-text)]">
              La simulation d'examen blanc est accessible aux comptes Freemium avec un essai gratuit limité, puis en illimité avec un abonnement Premium.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => { setOpenExamUpgrade(false); router.push("/pricing"); }}
                className="cc-btn cc-btn-primary w-full justify-center"
              >
                Créer un compte ou voir les abonnements
              </button>
              <button
                onClick={() => setOpenExamUpgrade(false)}
                className="cc-btn cc-btn-secondary w-full justify-center"
              >
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

      <FeedbackModal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} pseudo={pseudo} email={email} />
    </main>
  );
}
