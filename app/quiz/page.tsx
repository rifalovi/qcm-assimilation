"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { saveResultToSupabase } from "../../src/lib/saveResult";
import { trackEvent } from "../../src/lib/posthog";
import { useUser, ROLE_LIMITS } from "../components/UserContext";

import type { ChoiceKey, Level, Theme, Question } from "../../src/data/questions";
import { generateQuiz, scoreQuiz, markQuestionsAsSeen } from "../../src/lib/quizEngine";

import Card from "../../components/Card";
import Button from "../../components/Button";



// ── StarBurst — burst plein écran bonne réponse ──────────────
const EMOJIS_Q = ["⭐","✨","💫","🌟","✦","·","*","★","✩","⚡"];
const BURST_PARTICLES_Q = Array.from({ length: 60 }, (_, i) => {
  const angle = Math.random() * 360;
  const rad = (angle * Math.PI) / 180;
  const dist = 80 + Math.random() * 280;
  return {
    tx: `${Math.cos(rad) * dist}px`,
    ty: `${Math.sin(rad) * dist}px`,
    delay: `${Math.floor(Math.random() * 200)}ms`,
    dur: `${0.5 + Math.random() * 0.7}s`,
    fs: `${8 + Math.floor(Math.random() * 10)}px`,
    rot: `${Math.floor(Math.random() * 720)}deg`,
    sz: `${0.3 + Math.random() * 0.6}`,
    glow: i % 4 === 0 ? "rgba(251,191,36,0.9)" : i % 4 === 1 ? "rgba(167,243,208,0.9)" : i % 4 === 2 ? "rgba(196,181,253,0.9)" : "rgba(251,146,60,0.9)",
    emoji: EMOJIS_Q[i % EMOJIS_Q.length],
  };
});

function StarBurstQuiz({ show }: { show: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!show || !mounted) return null;
  return createPortal(
    <div className="star-burst-overlay">
      <div className="star-burst-bg" />
      {BURST_PARTICLES_Q.map((p, i) => (
        <span key={i} className="star-particle"
          style={{
            "--tx": p.tx, "--ty": p.ty, "--delay": p.delay,
            "--dur": p.dur, "--fs": p.fs, "--rot": p.rot,
            "--sz": p.sz, "--glow": p.glow,
          } as React.CSSProperties}>
          {p.emoji}
        </span>
      ))}
    </div>,
    document.body
  );
}

export default function QuizPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useUser();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPremiumCTA, setShowPremiumCTA] = useState(false);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(20);
  const [meta, setMeta] = useState<{
    level: Level;
    themes: Theme[];
    count: number;
    mode?: "train" | "exam";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [goResults, setGoResults] = useState(false);
  const [answers, setAnswers] = useState<Record<string, ChoiceKey | null>>({});
  const tickRef = useRef<number | null>(null);
  const globalRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const [mode, setMode] = useState<"train" | "exam">("train");
  const [globalTime, setGlobalTime] = useState<number | null>(null);
  const [focusWarn, setFocusWarn] = useState(0);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (mode !== "exam") return;
    function onVisibility() {
      if (document.visibilityState !== "visible") setFocusWarn((n) => n + 1);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [mode]);

  useEffect(() => {
    if (mode !== "exam") return;
    if (focusWarn < 3) return;
    submit();
  }, [mode, focusWarn]);

  useEffect(() => {
    if (authLoading) return;
    const raw = localStorage.getItem("quiz_settings");
    if (!raw) {
      router.push("/");
      return;
    }

    type Settings = {
      level: Level;
      themes: Theme[];
      count: number;
      mode?: "train" | "exam";
      perQuestion?: number;
      maxDuration?: number;
    };

    const parsed = JSON.parse(raw) as Settings;
    const m = parsed.mode ?? "train";
    setMode(m);

    const pq = parsed.perQuestion ?? (m === "exam" ? 30 : 20);
    setRemaining(pq);

    if (m === "exam") setGlobalTime(parsed.maxDuration ?? 15 * 60);
    else setGlobalTime(null);

    setMeta({
      level: parsed.level,
      themes: parsed.themes,
      count: parsed.count,
      mode: m,
    });
    trackEvent("quiz_started", {
      level: parsed.level,
      themes: parsed.themes,
      count: parsed.count,
      mode: m,
    });

    try {
  const limits = ROLE_LIMITS[role];

  // Bloque le mode examen selon le rôle
  if (m === "exam" && !limits.canExam && role !== "anonymous") {
    router.push("/?blocked=exam");
    return;
  }

  // Bloque les niveaux non autorisés
  if (!limits.levels.includes(parsed.level)) {
    router.push("/?blocked=level");
    return;
  }

  // Applique la limite de questions
  const allowedCount = Math.min(parsed.count, limits.quizCount);
  console.log('role:', role, 'limits:', limits.quizCount, 'allowedCount:', allowedCount)

  const quiz = generateQuiz({
    level: parsed.level,
    themes: parsed.themes,
    count: allowedCount,
  });
  setQuestions(quiz);
  const init: Record<string, ChoiceKey | null> = {};
  for (const q of quiz) init[q.id] = null;
  setAnswers(init);
} catch (e: any) {
  setError(e?.message ?? "Erreur lors de la génération du test.");
}
  }, [router, role, authLoading]);

  useEffect(() => {
    if (mode !== "exam") return;
    if (!questions.length) return;

    setGlobalTime((t) => t ?? 15 * 60);

    if (globalRef.current) window.clearInterval(globalRef.current);
    globalRef.current = window.setInterval(() => {
      setGlobalTime((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (globalRef.current) window.clearInterval(globalRef.current);
      globalRef.current = null;
    };
  }, [mode, questions.length]);

  useEffect(() => {
    if (globalTime === null) return;
    if (globalTime > 0) return;
    submit();
  }, [globalTime]);

useEffect(() => {
  if (!goResults) return;
  if (!['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(role)) {
    setShowPremiumCTA(true);
  } else {
    router.push(`/results?mode=${mode}`);
  }
}, [goResults, router, mode, role]);

  const current = questions[idx];

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== null).length,
    [answers]
  );

  const result = useMemo(() => {
    if (!questions.length) return null;
    return scoreQuiz({ questions, answers });
  }, [questions, answers]);

  const score = useMemo(() => {
    if (!result) return null;
    const { correct, total } = result;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = correct >= 32;
    return { correct, total, percent, passed };
  }, [result]);

  const minToSubmit = Math.ceil(questions.length * 0.8);
  const canSubmit = answeredCount >= minToSubmit;

  useEffect(() => {
    if (!questions.length) return;

    const perQuestionSeconds = mode === "exam" ? 30 : 20;
    setRemaining(perQuestionSeconds);

    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          const q = questions[idx];
          if (!answers[q.id]) {
            setAnswers((prev) => ({ ...prev, [q.id]: null }));
          }

          if (idx >= questions.length - 1) {
            submit();
            return 0;
          }

          setIdx((v) => v + 1);
          return perQuestionSeconds;
        }
        return r - 1;
      });
    }, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [idx, questions.length, mode]);

  useEffect(() => {
    if (remaining > 0) return;
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    if (idx < questions.length - 1) setIdx((i) => i + 1);
  }, [remaining, idx, questions.length]);

function selectAnswer(choice: ChoiceKey) {
  if (!current) return;
  setAnswers((prev) => ({ ...prev, [current.id]: choice }));
  // Burst si bonne réponse en mode train
  if (mode !== "exam" && choice === current.answer) {
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 1000);
  }
  if (tickRef.current) window.clearInterval(tickRef.current);
  setRemaining(mode === "exam" ? 30 : 20);
  if (idx < questions.length - 1) setIdx(idx + 1);
}

  async function submit() {
    if (submittedRef.current) return;
    submittedRef.current = true;

    if (tickRef.current) window.clearInterval(tickRef.current);
    if (globalRef.current) window.clearInterval(globalRef.current);

    const result = scoreQuiz({ questions, answers });
    markQuestionsAsSeen(questions.map(q => q.id));
    const _percent = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    trackEvent("quiz_completed", {
      score_correct: result.correct,
      score_total: result.total,
      score_percent: _percent,
      passed: result.correct >= 32,
      mode: mode,
      level: meta?.level,
      themes: meta?.themes,
    });
    const payload = { meta, questions, answers, result };

    const rawUser = localStorage.getItem("qcm_user");
    const u = rawUser ? JSON.parse(rawUser) : null;
    const email = u?.email ? String(u.email).trim().toLowerCase() : "";
    const pseudo = u?.pseudo ?? "";
    const currentMode: "train" | "exam" = mode === "exam" ? "exam" : "train";

    if (email) localStorage.setItem(`last_result:${currentMode}:${email}`, JSON.stringify(payload));
    localStorage.setItem("last_result", JSON.stringify(payload));

    if (email) {
      const { correct, total } = result;
      const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
      const passed = correct >= 32;

      await saveResultToSupabase({
        email,
        pseudo,
        mode: currentMode,
        score_correct: correct,
        score_total: total,
        score_percent: percent,
        passed,
        level: meta?.level ?? 1,
        themes: meta?.themes ?? [],
        answers,
        questions,
        details: result.details,
      });
    }

    setGoResults(true);
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Card>
          <h1 className="text-xl font-bold text-white">
            Impossible de générer le test
          </h1>
          <p className="mt-2 text-slate-300">{error}</p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push(`/results?mode=${mode}`)}>
            Retour
          </Button>
        </Card>
      </main>
    );
  }

  if (!questions.length || !current || !meta) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 text-slate-300 sm:px-6 sm:py-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_18px_45px_rgba(2,8,23,0.28)]">
          Chargement…
        </div>
      </main>
    );
  }

  const progressPct = questions.length
    ? Math.round(((idx + 1) / questions.length) * 100)
    : 0;

  const timeRatio =
    mode === "exam"
      ? Math.max(0, Math.min(100, Math.round((remaining / 30) * 100)))
      : Math.max(0, Math.min(100, Math.round((remaining / 20) * 100)));

  function formatGlobalTime(value: number | null) {
    if (value === null) return null;
    const min = Math.floor(value / 60);
    const sec = value % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function leaveQuiz() {
  const ok = window.confirm(
    mode === "exam"
      ? "Quitter l'examen en cours ? Votre progression actuelle sera perdue."
      : "Quitter le test en cours ? Votre progression actuelle sera perdue."
  );

  if (!ok) return;

  if (tickRef.current) window.clearInterval(tickRef.current);
  if (globalRef.current) window.clearInterval(globalRef.current);

  router.push(`/results?mode=${mode}`);
}

  return (
    <main className="mx-auto max-w-4xl px-3 py-2 sm:px-6 sm:py-4">
      <div className="space-y-4">
        {/* Bandeau compact */}
        <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 p-3 shadow-[0_20px_50px_rgba(2,8,23,0.40)]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
  <div className="flex items-center gap-3 flex-wrap">
    <button
      type="button"
      onClick={leaveQuiz}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      ← Quitter
    </button>

    <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-200">
      {mode === "exam" ? "Mode examen" : "Mode entraînement"}
    </span>

    <span className="text-sm text-slate-300">
      Niveau <span className="font-semibold text-white">{meta.level}</span>
    </span>

    <span className="text-sm font-semibold text-white">
      Question {idx + 1} / {questions.length}
    </span>
  </div>

  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
    <div
      className={`h-2.5 w-2.5 rounded-full ${
        remaining <= 3 ? "bg-red-500 animate-pulse" : "bg-emerald-400"
      }`}
    />
    <span className="font-semibold text-white">{Math.max(0, remaining)}s</span>
  </div>
</div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Progression</span>
                <span className="font-semibold text-slate-200">{progressPct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Temps question</span>
                <span className="font-semibold text-slate-200">{timeRatio}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    remaining <= 5
                      ? "bg-gradient-to-r from-red-600 to-rose-500"
                      : "bg-gradient-to-r from-emerald-500 to-green-400"
                  }`}
                  style={{ width: `${timeRatio}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap text-xs text-slate-400">
            <span>
              Répondu : <span className="font-semibold text-white">{answeredCount}/{questions.length}</span>
            </span>
            <span>
              Validation : <span className="font-semibold text-white">≥ {minToSubmit}</span>
            </span>
            {mode === "exam" && globalTime !== null && (
              <span>
                Temps global : <span className="font-semibold text-white">{formatGlobalTime(globalTime)}</span>
              </span>
            )}
          </div>

          {mode === "exam" && focusWarn > 0 && (
            <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Onglet quitté : <span className="font-semibold">{focusWarn}</span>/3
            </div>
          )}
        </div>

        {/* Question directement visible */}
        <Card className="overflow-hidden">
          <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {current.theme} • Niveau {current.level}
            </div>

            <h2 className="text-lg font-semibold leading-snug text-white sm:text-xl">
              {current.question}
            </h2>
          </div>

          <div className="mt-2 space-y-1.5">
            {current.choices.map((c) => {
              const selected = answers[current.id] === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => selectAnswer(c.key)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 ${
                    selected
                      ? "border-blue-400/30 bg-blue-500/15 text-white shadow-[0_10px_30px_rgba(37,99,235,0.14)]"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-blue-400/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span
                    className={`mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold ${
                      selected
                        ? "bg-blue-500/20 text-blue-200"
                        : "bg-white/5 text-slate-300"
                    }`}
                  >
                    {c.key}
                  </span>
                  <span className="align-middle">{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={leaveQuiz}
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      Quitter
    </button>

    {mode !== "exam" && (
      
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          Précédent
        </button>
       
      
    )}
  </div>

  <div className="flex-1" />

  <Button onClick={submit} disabled={!canSubmit}>
    Valider le test
  </Button>
</div>

          <StarBurstQuiz show={showBurst} />
          {!canSubmit && (
            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              ⚠️ Validation possible uniquement si vous avez répondu à au moins{" "}
              <strong>{minToSubmit}</strong> questions.
            </div>
          )}

          {score && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Score provisoire :{" "}
              <span className="font-semibold text-white">
                {score.correct}/{score.total}
              </span>{" "}
              — {score.percent}%
            </div>
          )}
        </Card>
      </div>

      {showPremiumCTA && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
  style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
  <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
      
      <div className="text-center mb-5">
        <div className="text-4xl mb-3">{role === "anonymous" ? "✨" : "👑"}</div>
        <h2 className="text-xl font-extrabold text-white">
          {role === "anonymous" 
            ? "Crée un compte gratuit !" 
            : "Passe en Premium !"}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {role === "anonymous"
            ? "Tu viens de faire 10 questions 🎉. Crée un compte gratuit pour sauvegarder tes résultats et accéder à 20 questions."
            : "Tu viens de terminer tes 20 questions 😉. Passe en Premium pour accéder à 40 questions, tous les niveaux, l'examen blanc et les statistiques détaillées."}
        </p>
      </div>

      <div className="space-y-3">
        {role === "anonymous" ? (
          <>
            <a href={`/register?redirect=/results?mode=${mode}`}
              className="block w-full rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-500">
              🚀 Créer un compte pour sauvegarder
            </a>
            <a href={`/login?redirect=/results?mode=${mode}`}
              className="block w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/10">
              J'ai déjà un compte
            </a>
            <button
              onClick={() => { setShowPremiumCTA(false); router.push(`/results?mode=${mode}`); }}
              className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-xs font-medium text-slate-500 transition hover:text-slate-300">
              Voir mes résultats sans compte →
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push("/account")}
            className="block w-full rounded-2xl bg-amber-500 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-amber-400">
            👑 Passer en Premium — 19,99€/3 mois
            <a href="/pricing" className="block text-center text-xs text-amber-400/70 hover:text-amber-300 transition mt-1">
  Voir les tarifs →
</a>
          </button>
          
        )}
        <div className="flex gap-2">
  <button
    onClick={() => router.push("/pricing")}
    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-medium text-slate-400 transition hover:text-white"
  >
    Voir les tarifs
  </button>
  <button
    onClick={() => { setShowPremiumCTA(false); router.push(`/results?mode=${mode}`); }}
    className={`flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-slate-400 transition hover:text-white ${role === "anonymous" ? "hidden" : ""}`}
  >
    Mes résultats →
  </button>
</div>
      </div>
    </div>
  </div>
)}
    </main>
  );
}