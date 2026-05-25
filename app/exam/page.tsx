"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Timer,
  CheckCircle2,
  BookOpen,
  PenLine,
  BarChart2,
  Trophy,
  AlertTriangle,
  Compass,
  Flag,
  Crown,
  Sparkles,
  Lock,
  Zap,
  Target,
} from "lucide-react";
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
    <div
      className="flex h-11 w-11 items-center justify-center rounded-2xl border"
      style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: "var(--cc-text-muted)" }}>
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
      className="rounded-full border px-3 py-2 text-sm font-semibold transition-all duration-200"
      style={active
        ? { borderColor: "var(--cc-primary)", background: "var(--cc-primary-soft)", color: "var(--cc-primary)" }
        : { borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }
      }
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
      count: COUNT, // toujours 40 questions pour l'examen blanc
      mode: "exam",
      perQuestion: 30,
      maxDuration: 900,
      perQuestionSeconds: 30,
    }));
    router.push("/quiz");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
      <div className="space-y-6">

        {/* ===== HERO ===== */}
        <section
          className={`relative overflow-visible rounded-2xl border transition-all duration-700 ${
            heroVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)", boxShadow: "var(--cc-shadow)" }}
        >
          {/* Tricolore */}
          <div className="flex h-1.5 w-full overflow-hidden rounded-t-2xl">
            <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
            <div className="flex-1" style={{ background: "white" }} />
            <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
          </div>

          <div className="relative px-5 py-7 sm:px-8 sm:py-9">

            {/* Identité */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MarianneMark />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.22em]" style={{ color: "var(--cc-text-muted)" }}>
                      République française
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
                      <span className="inline-flex h-2.5 w-4 overflow-hidden rounded-sm border" style={{ borderColor: "var(--cc-border)" }}>
                        <span className="w-1/3" style={{ background: "var(--cc-flag-blue)" }} />
                        <span className="w-1/3" style={{ background: "white" }} />
                        <span className="w-1/3" style={{ background: "var(--cc-flag-red)" }} />
                      </span>
                      FR
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: "var(--cc-text-muted)" }}>Examen blanc • Simulation 2026</div>
                </div>
              </div>
              {!authLoading && !isAuthenticated && user?.pseudo?.trim() && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text)" }}>
                  <span>Bonjour <span className="font-semibold" style={{ color: "var(--cc-text)" }}>{authUsername?.trim() || user?.pseudo?.trim() || "Utilisateur"}</span> 👋</span>
                  <span style={{ color: "var(--cc-text-disabled)" }}>•</span>
                  <button onClick={clearIdentity} className="transition hover:underline" style={{ color: "var(--cc-text-muted)" }}>Déconnexion</button>
                </div>
              )}
            </div>

            {/* Titre + CTA */}
            <div className="cc-badge cc-badge-info mb-3 mx-auto block text-center w-fit lg:mx-0">
              Conditions proches de l'épreuve
            </div>

            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl text-center lg:text-left" style={{ color: "var(--cc-text)" }}>
              Testez-vous en{" "}
              <span style={{ color: "var(--cc-primary)" }}>conditions</span>{" "}
              d'<span style={{ color: "var(--cc-primary)" }}>examen blanc</span>.
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-center max-w-xl mx-auto lg:mx-0 lg:text-left" style={{ color: "var(--cc-text-muted)" }}>
              Simulation complète du test civique français — questions chronométrées, niveau exigeant, score requis 32/40.
            </p>

            {/* Pills info */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="cc-badge cc-badge-info">40 questions</span>
              <span className="inline-flex items-center gap-1 cc-badge cc-badge-warning">
                <Timer size={11} /> 30s / question
              </span>
              <span className="inline-flex items-center gap-1 cc-badge cc-badge-success">
                <CheckCircle2 size={11} /> Requis : 32/40
              </span>
            </div>

            {/* Boutons */}
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap justify-center">
              <PremiumButton onClick={smartStartExam} label="Démarrer l'examen blanc" />
              <Button variant="secondary" onClick={() => router.push("/info")}>
                <BookOpen size={15} className="mr-1.5 inline-block" /> Comprendre l'examen
              </Button>
              <Button variant="secondary" onClick={() => router.push("/")}>
                <PenLine size={15} className="mr-1.5 inline-block" /> Entraînement
              </Button>
            </div>
          </div>
        </section>

        {/* ===== NAVIGATION ===== */}
        <section className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => router.push("/info")}>
            <BookOpen size={15} className="mr-1.5 inline-block" /> Guide
          </Button>
          {hasLastResult && (
            <Button variant="secondary" onClick={() => router.push("/results?mode=exam")}>
              <BarChart2 size={15} className="mr-1.5 inline-block" /> Dernier résultat
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push("/")}>
            <PenLine size={15} className="mr-1.5 inline-block" /> Entraînement
          </Button>
          <Button variant="secondary" onClick={() => router.push("/leaderboard")}>
            <Trophy size={15} className="mr-1.5 inline-block" /> Classement
          </Button>
        </section>

        {/* ===== CONFIGURATION ===== */}
        <section className="grid gap-5 lg:grid-cols-3">

          {/* Niveau */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold" style={{ color: "var(--cc-text)" }}>Niveau de difficulté</h3>
              <span
                className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  borderColor: "color-mix(in srgb, var(--cc-danger) 25%, transparent)",
                  background: "color-mix(in srgb, var(--cc-danger) 10%, var(--cc-surface))",
                  color: "var(--cc-danger)",
                }}
              >
                Difficile
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setLevel(n as Level)}
                  className="rounded-xl border py-3 text-sm font-semibold transition"
                  style={level === n
                    ? { borderColor: "var(--cc-primary)", background: "var(--cc-primary-soft)", color: "var(--cc-primary)" }
                    : { borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }
                  }
                >
                  Niveau {n}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border p-3 text-xs space-y-1" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
              <p>• Niveau 1 — prise en main</p>
              <p>• Niveau 2 — entraînement intermédiaire</p>
              <p>• <span className="font-medium" style={{ color: "var(--cc-primary)" }}>Niveau 3 — simulation réaliste ✓</span></p>
            </div>
          </Card>

          {/* Thèmes */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold" style={{ color: "var(--cc-text)" }}>Thèmes</h3>
              <span className="cc-badge cc-badge-neutral">
                {themes.length}/{THEMES.length}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {THEMES.map((t) => (
                <Pill key={t} active={themes.includes(t)} onClick={() => toggleTheme(t)}>{t}</Pill>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setThemes([...THEMES])}>Tout</Button>
              <Button variant="secondary" onClick={() => setThemes([])}>Aucun</Button>
            </div>
            {!canStart && (
              <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--cc-danger)" }}>
                <AlertTriangle size={13} /> Sélectionnez au moins un thème.
              </p>
            )}
          </Card>

          {/* Résumé */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold" style={{ color: "var(--cc-text)" }}>Résumé</h3>
              <span className="cc-badge cc-badge-warning">
                Chronométré
              </span>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              {[
                { label: "Questions",        value: "40",                                                    color: "var(--cc-text)" },
                { label: "Temps / question", value: "30 s",                                                  color: "var(--cc-warning)" },
                { label: "Validation",       value: "≥ 32 réponses",                                         color: "var(--cc-success)" },
                { label: "Niveau",           value: `Niveau ${level}`,                                       color: "var(--cc-primary)" },
                { label: "Thèmes",           value: `${themes.length} thème${themes.length > 1 ? "s" : ""}`, color: "var(--cc-text)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span style={{ color: "var(--cc-text-muted)" }}>{label}</span>
                  <span className="font-semibold" style={{ color }}>{value}</span>
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
            {
              icon: <Zap size={20} />,
              title: "Rythme soutenu",
              text: "Chronométrage serré pour simuler les conditions réelles.",
              color: "var(--cc-warning)",
            },
            {
              icon: <Compass size={20} />,
              title: "Vision réaliste",
              text: "Ambiance proche de l'évaluation officielle.",
              color: "var(--cc-primary)",
            },
            {
              icon: <Target size={20} />,
              title: "Mesure de niveau",
              text: "Score précis pour cibler vos révisions.",
              color: "var(--cc-success)",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border p-5 transition"
              style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)", boxShadow: "var(--cc-shadow-sm)" }}
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  borderColor: `color-mix(in srgb, ${item.color} 25%, transparent)`,
                  border: "1px solid",
                  background: `color-mix(in srgb, ${item.color} 10%, var(--cc-surface))`,
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
              <h3 className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>{item.title}</h3>
              <p className="mt-1 text-xs leading-6" style={{ color: "var(--cc-text-muted)" }}>{item.text}</p>
            </div>
          ))}
        </section>

      </div>

      {/* ===== MODAL UPGRADE EXAM ===== */}
      {openExamUpgrade && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpenExamUpgrade(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border p-6" style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)", boxShadow: "var(--cc-shadow-lg)" }}>
            {/* Tricolore */}
            <div className="absolute top-0 left-0 right-0 flex h-1 overflow-hidden rounded-t-2xl">
              <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
              <div className="flex-1" style={{ background: "white" }} />
              <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
            </div>

            <div className="mt-2 text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "color-mix(in srgb, var(--cc-primary) 12%, var(--cc-surface))", color: "var(--cc-primary)" }}
              >
                <Lock size={26} />
              </div>
              <h3 className="text-xl font-extrabold" style={{ color: "var(--cc-text)" }}>
                Examen blanc — accès Pass requis
              </h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>
                Créez un compte et choisissez un Pass pour débloquer l'examen blanc, les corrections détaillées et le coach IA.
              </p>
            </div>

            {/* Plans rapides */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div
                className="rounded-xl border p-3 text-center"
                style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: "var(--cc-text-muted)" }}>Pass Express</div>
                <div className="text-lg font-extrabold" style={{ color: "var(--cc-primary)" }}>4,99 €</div>
                <div className="text-[11px]" style={{ color: "var(--cc-text-disabled)" }}>7 jours</div>
              </div>
              <div
                className="rounded-xl border p-3 text-center relative"
                style={{ borderColor: "var(--cc-primary)", background: "var(--cc-primary-soft)" }}
              >
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "var(--cc-primary)", color: "var(--cc-surface)" }}
                >
                  Recommandé
                </div>
                <div className="text-xs font-semibold mb-1" style={{ color: "var(--cc-text)" }}>Pass Sérénité</div>
                <div className="text-lg font-extrabold" style={{ color: "var(--cc-primary)" }}>9,99 €</div>
                <div className="text-[11px]" style={{ color: "var(--cc-text-muted)" }}>30 jours</div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <button
                onClick={() => { setOpenExamUpgrade(false); router.push("/pricing"); }}
                className="cc-btn cc-btn-primary w-full justify-center py-3 rounded-xl"
              >
                <Sparkles size={15} className="mr-1.5 inline-block" /> Voir les Pass
              </button>
              <button
                onClick={() => { setOpenExamUpgrade(false); router.push("/register"); }}
                className="cc-btn cc-btn-secondary w-full justify-center py-3 rounded-xl"
              >
                Créer un compte gratuit
              </button>
              <button
                onClick={() => setOpenExamUpgrade(false)}
                className="w-full text-center text-sm transition hover:opacity-70"
                style={{ color: "var(--cc-text-disabled)", background: "none", border: "none" }}
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
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border p-6" style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)", boxShadow: "var(--cc-shadow-lg)" }}>
            <h3 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>Avant de commencer</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>Entrez un pseudo et une adresse email valide.</p>
            <input
              value={pseudoDraft}
              onChange={(e) => setPseudoDraft(e.target.value)}
              placeholder="Pseudo (ex : Carlos)"
              className="mt-4 w-full"
              maxLength={20}
            />
            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="Adresse email"
              className="mt-3 w-full"
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
