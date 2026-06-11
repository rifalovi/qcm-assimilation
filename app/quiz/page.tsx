"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { saveResultToSupabase } from "../../src/lib/saveResult";
import { trackEvent } from "../../src/lib/posthog";
import { useUser } from "../components/UserContext";
import { getAccessQuota, formatRechargeDate, isRechargeAvailable } from "../../src/lib/access";
import { useAccessLevel } from "../../src/hooks/useAccessLevel";
import QuotaBar from "../../src/components/QuotaBar";
import UpgradeNudge from "../../src/components/UpgradeNudge";

import type { ChoiceKey, Level, Theme, Question } from "../../src/data/questions";
import { generateQuiz, generateQuizAsync, scoreQuiz, markQuestionsAsSeen } from "../../src/lib/quizEngine";

import Card from "../../components/Card";
import Button from "../../components/Button";
import Alert from "../../components/Alert";
import ProgressBar from "../../components/ProgressBar";
import { GraduationCap, Sparkles } from "lucide-react";



// ── StarBurst — burst plein écran bonne réponse ──────────────
// Particules pures CSS (disques colorés) — aucun emoji
const BURST_PARTICLES_Q = Array.from({ length: 60 }, (_, i) => {
  const angle = Math.random() * 360;
  const rad = (angle * Math.PI) / 180;
  const dist = 80 + Math.random() * 280;
  const size = `${8 + Math.floor(Math.random() * 10)}px`;
  return {
    tx: `${Math.cos(rad) * dist}px`,
    ty: `${Math.sin(rad) * dist}px`,
    delay: `${Math.floor(Math.random() * 200)}ms`,
    dur: `${0.5 + Math.random() * 0.7}s`,
    fs: size,
    rot: `${Math.floor(Math.random() * 720)}deg`,
    sz: `${0.3 + Math.random() * 0.6}`,
    glow: i % 4 === 0 ? "rgba(251,191,36,0.9)" : i % 4 === 1 ? "rgba(167,243,208,0.9)" : i % 4 === 2 ? "rgba(196,181,253,0.9)" : "rgba(251,146,60,0.9)",
    size,
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
          {/* Disque CSS pur — aucun emoji */}
          <i style={{ display: "inline-block", width: p.size, height: p.size, borderRadius: "50%", background: p.glow, boxShadow: `0 0 5px ${p.glow}` }} />
        </span>
      ))}
    </div>,
    document.body
  );
}

export default function QuizPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useUser();
  const limits = getAccessQuota(role);

  // Crédits live depuis la RPC get_access_level() — uniquement pour freemium
  const {
    mode:             accessMode,
    quiz_credits:     quizCredits,
    exam_trials:      examTrials,
    date_epuisement,
    isLoading:        accessLoading,
    consumeQuizCredit,
    consumeExamTrial,
  } = useAccessLevel();

  // Accès refusé (verrou dur) — null tant que l'accès n'est pas tranché
  const [blocked, setBlocked] = useState<null | "credits" | "exam">(null);
  // Garde l'initialisation à un seul passage (évite de régénérer le quiz quand
  // les crédits changent en cours de partie)
  const didInitRef = useRef(false);

  // Seuil de nudge : 80 % du quota consommé (4 crédits restants pour freemium/20)
  const QUOTA_MAX    = 20;
  const NUDGE_THRESHOLD = Math.floor(QUOTA_MAX * 0.2); // 4

  const [nudge, setNudge] = useState<"threshold" | "exhausted" | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPremiumCTA, setShowPremiumCTA] = useState(false);
  const [showAnonForm, setShowAnonForm] = useState(false);
  const [anonPrenom, setAnonPrenom] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { const u = JSON.parse(localStorage.getItem('qcm_user') ?? '{}'); return u.pseudo ?? ''; } catch { return ''; }
  });
  const [anonEmail, setAnonEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { const u = JSON.parse(localStorage.getItem('qcm_user') ?? '{}'); return u.email ?? ''; } catch { return ''; }
  });
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
  // Correction post-réponse (mode entraînement uniquement)
  const [showCorrection, setShowCorrection] = useState(false);
  const [lastChoice, setLastChoice] = useState<ChoiceKey | null>(null);
  const correctionTimerRef = useRef<number | null>(null);

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
    // Attendre que l'authentification ET le niveau d'accès (crédits live) soient résolus
    if (authLoading || accessLoading) return;
    // N'initialiser qu'une seule fois — sinon le quiz se régénère quand les
    // crédits sont décrémentés en cours de partie.
    if (didInitRef.current) return;
    didInitRef.current = true;

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

    // ── VERROU DUR — solde réel (et non quota statique) ───────────────────────
    // Freemium sans crédit quiz et hors fenêtre de recharge → paywall.
    const rechargeReady = isRechargeAvailable(date_epuisement);
    if (accessMode === "freemium" && m !== "exam" && quizCredits <= 0 && !rechargeReady) {
      trackEvent("quiz_blocked", { reason: "credits_exhausted" });
      setMode(m);
      setBlocked("credits");
      return;
    }
    // Freemium ayant déjà consommé son examen blanc d'essai → paywall.
    if (accessMode === "freemium" && m === "exam" && examTrials <= 0) {
      trackEvent("quiz_blocked", { reason: "exam_exhausted" });
      setMode(m);
      setBlocked("exam");
      return;
    }

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

    // Consomme un essai d'examen blanc (freemium) au démarrage de l'examen.
    if (accessMode === "freemium" && m === "exam") {
      consumeExamTrial();
    }

    try {
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

  // Plafond du nombre de questions : pour un freemium en entraînement, on
  // s'aligne sur le SOLDE RÉEL de crédits (et non le quota statique du rôle),
  // afin qu'un test ne puisse jamais dépasser ce qu'il reste réellement.
  const creditCap = accessMode === "freemium" && m !== "exam" ? quizCredits : limits.quiz;
  const allowedCount = Math.min(parsed.count, creditCap);

  // Tentative async (base), fallback automatique sur les fichiers si vide
  generateQuizAsync({
    level: parsed.level,
    themes: parsed.themes,
    count: allowedCount,
  }).then((quiz) => {
    setQuestions(quiz);
    const init: Record<string, ChoiceKey | null> = {};
    for (const q of quiz) init[q.id] = null;
    setAnswers(init);
  }).catch((e: Error) => {
    // Dernier recours : sync
    try {
      const quiz = generateQuiz({ level: parsed.level, themes: parsed.themes, count: allowedCount });
      setQuestions(quiz);
      const init: Record<string, ChoiceKey | null> = {};
      for (const q of quiz) init[q.id] = null;
      setAnswers(init);
    } catch {
      setError(e?.message ?? "Erreur lors de la génération du test.");
    }
  });
} catch (e: any) {
  setError(e?.message ?? "Erreur lors de la génération du test.");
}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, role, authLoading, accessLoading]);

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

    // ?freeze=1 : pas de minuterie — utile pour screenshots / démo
    const freezeMode = new URLSearchParams(window.location.search).get("freeze") === "1";
    if (freezeMode) return;

    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          const q = questions[idx];
          if (!q) return 0;
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

  // Réinitialise l'état de correction à chaque changement de question
  // (évite la teinte rosée/rouge résiduelle sur la nouvelle question)
  useEffect(() => {
    setShowCorrection(false);
    setLastChoice(null);
  }, [idx]);

function advanceAfterCorrection() {
  setShowCorrection(false);
  setLastChoice(null);
  setRemaining(20);
  if (idx < questions.length - 1) {
    setIdx((i) => i + 1);
  } else {
    submit();
  }
}

function selectAnswer(choice: ChoiceKey) {
  if (!current) return;
  if (showCorrection) return; // Bloquer le double-clic pendant la correction

  setAnswers((prev) => ({ ...prev, [current.id]: choice }));

  if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }

  // ── Décrémenter les crédits pour les comptes freemium en mode entraînement ──
  // N'appelle pas consumeQuizCredit en mode examen (session blanche distincte).
  if (accessMode === "freemium" && mode !== "exam") {
    consumeQuizCredit().then((result) => {
      if (!result.success) {
        setNudge("exhausted");
      } else if (result.quiz_credits <= NUDGE_THRESHOLD && nudge === null) {
        setNudge("threshold");
      }
    });
  }

  // Examen OU anonyme : avance sans afficher la bonne réponse.
  // (la correction est réservée aux comptes connectés → incite à l'inscription)
  if (mode === "exam" || role === "anonymous") {
    setRemaining(mode === "exam" ? 30 : 20);
    if (idx < questions.length - 1) setIdx((i) => i + 1);
    else submit();
  } else {
    // Entraînement (connecté) : affiche la correction 4 s puis avance
    setLastChoice(choice);
    setShowCorrection(true);
    if (choice === current.answer) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1000);
    }
    if (correctionTimerRef.current) window.clearTimeout(correctionTimerRef.current);
    // ?freeze=1 : maintient la correction affichée indéfiniment (démo / screenshot)
    const freezeMode = new URLSearchParams(window.location.search).get("freeze") === "1";
    if (!freezeMode) {
      correctionTimerRef.current = window.setTimeout(advanceAfterCorrection, 4000);
    }
  }
}

  async function submit() {
    if (submittedRef.current) return;
    submittedRef.current = true;

    if (tickRef.current) window.clearInterval(tickRef.current);
    if (globalRef.current) window.clearInterval(globalRef.current);
    if (correctionTimerRef.current) window.clearTimeout(correctionTimerRef.current);

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

  if (blocked) {
    const isCredits = blocked === "credits";
    const recharge = formatRechargeDate(date_epuisement);
    return (
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <Card>
          <div className="text-center">
            <div className="mb-4 flex justify-center" style={{ color: "var(--cc-primary)" }}>
              {isCredits ? <Sparkles size={40} /> : <GraduationCap size={40} />}
            </div>
            <h1 className="text-xl font-extrabold" style={{ color: "var(--cc-text)" }}>
              {isCredits ? "Vos 20 questions gratuites sont épuisées" : "Votre examen blanc d'essai a été utilisé"}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--cc-text-muted)" }}>
              {isCredits
                ? (recharge
                    ? `Votre quota gratuit se recharge le ${recharge}. En attendant, un Pass vous donne un accès illimité à toutes les questions, tous les niveaux et les examens blancs.`
                    : "Un Pass vous donne un accès illimité à toutes les questions, tous les niveaux et les examens blancs.")
                : "Les examens blancs illimités sont inclus dans les Passes — avec correction détaillée et statistiques par thème."}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <a href="/pricing" className="cc-btn cc-btn-primary w-full justify-center">Voir les Passes →</a>
            <button onClick={() => router.push(`/results?mode=${blocked === "exam" ? "exam" : "train"}`)} className="cc-btn cc-btn-secondary w-full justify-center">Voir mes derniers résultats</button>
            <button onClick={() => router.push("/")} className="cc-btn cc-btn-tertiary cc-btn-sm w-full justify-center">Retour à l&apos;accueil</button>
          </div>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Card>
          <h1 className="text-xl font-bold" style={{ color: "var(--cc-text)" }}>
            Impossible de générer le test
          </h1>
          <p className="mt-2" style={{ color: "var(--cc-text-muted)" }}>{error}</p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push(`/results?mode=${mode}`)}>
            Retour
          </Button>
        </Card>
      </main>
    );
  }

  if (!questions.length || !current || !meta) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8" style={{ color: "var(--cc-text)" }}>
        <div className="rounded-xl border p-6" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
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
    <>
      {/* UpgradeNudge — banner au seuil (non-bloquant) */}
      {accessMode === "freemium" && nudge === "threshold" && mode !== "exam" && (
        <UpgradeNudge
          variant="banner"
          trigger="threshold"
          onDismiss={() => setNudge(null)}
        />
      )}

      {/* UpgradeNudge — modal à l'épuisement (bloquant : sortie vers résultats,
          jamais de retour dans un nouveau test sans Pass) */}
      {accessMode === "freemium" && nudge === "exhausted" && (
        <UpgradeNudge
          variant="modal"
          trigger="exhausted"
          rechargeDate={formatRechargeDate(date_epuisement)}
          dismissLabel="Voir mes résultats"
          onDismiss={() => { setNudge(null); router.push(`/results?mode=${mode}`); }}
        />
      )}

    <main className="mx-auto max-w-4xl px-3 py-2 pb-24 sm:px-6 sm:py-4 sm:pb-4">
      <div className="space-y-4">
        {/* Bandeau compact */}
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)", boxShadow: "var(--cc-shadow)" }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
  <div className="flex items-center gap-3 flex-wrap">
    <button
      type="button"
      onClick={leaveQuiz}
      className="text-xs transition hover:opacity-70"
      style={{ color: "var(--cc-text-disabled)", background: "none", border: "none", padding: "0" }}
    >
      ← Quitter
    </button>

    <span className="cc-badge cc-badge-info">
      {mode === "exam" ? "Mode examen" : "Mode entraînement"}
    </span>

    <span className="text-sm" style={{ color: "var(--cc-text-muted)" }}>
      Niveau <span className="font-semibold" style={{ color: "var(--cc-text)" }}>{meta.level}</span>
    </span>

    <span className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
      Question {idx + 1} / {questions.length}
    </span>
  </div>

  <div className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
    <div
      className={remaining <= 5 ? "animate-pulse" : ""}
      style={{
        width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0,
        background: remaining <= 5 ? "var(--cc-danger)" : "var(--cc-success)",
      }}
    />
    <span className="font-semibold" style={{ color: "var(--cc-text)" }}>{Math.max(0, remaining)}s</span>
  </div>
</div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ProgressBar
              value={idx + 1}
              total={questions.length}
              variant="primary"
              size="sm"
              label={`Progression · ${progressPct}%`}
              showLabel
            />
            <ProgressBar
              value={timeRatio}
              total={100}
              variant={remaining <= 5 ? "danger" : "success"}
              size="sm"
              label={`Temps question · ${timeRatio}%`}
              showLabel
            />
          </div>

          {/* QuotaBar — freemium uniquement, mode entraînement */}
          {accessMode === "freemium" && mode !== "exam" && (
            <QuotaBar
              credits={quizCredits}
              max={QUOTA_MAX}
              rechargeDate={formatRechargeDate(date_epuisement)}
              className="mt-3"
            />
          )}

          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap text-xs" style={{ color: "var(--cc-text-muted)" }}>
            <span>
              Répondu : <span className="font-semibold" style={{ color: "var(--cc-text)" }}>{answeredCount}/{questions.length}</span>
            </span>
            <span>
              Validation : <span className="font-semibold" style={{ color: "var(--cc-text)" }}>≥ {minToSubmit}</span>
            </span>
            {mode === "exam" && globalTime !== null && (
              <span>
                Temps global :{" "}
                <span
                  className={globalTime < 300 ? "animate-pulse" : ""}
                  style={{ fontWeight: 600, color: globalTime < 300 ? "var(--cc-danger)" : "var(--cc-text)" }}
                >
                  {formatGlobalTime(globalTime)}
                </span>
              </span>
            )}
          </div>

          {mode === "exam" && focusWarn > 0 && (
            <Alert variant="warning" className="mt-3" noIcon>
              <span className="text-xs">Onglet quitté : <strong>{focusWarn}</strong>/3 — au 3e départ l'examen est soumis automatiquement.</span>
            </Alert>
          )}
        </div>

        {/* Question directement visible */}
        <Card className="overflow-hidden">
          <div className="rounded-xl border p-4 sm:p-5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--cc-text-muted)" }}>
              {current.theme} • Niveau {current.level}
            </div>

            <h2 className="text-lg font-semibold leading-snug sm:text-xl" style={{ color: "var(--cc-text)" }}>
              {current.question}
            </h2>
          </div>

          <div className="mt-2 space-y-1.5">
            {current.choices.map((c) => {
              const selected = answers[current.id] === c.key;
              const isCorrectKey = c.key === current.answer;
              const isWrongSelected = showCorrection && selected && !isCorrectKey;

              // Couleurs de correction
              const borderColor = showCorrection
                ? isCorrectKey
                  ? "var(--cc-success)"
                  : isWrongSelected
                  ? "var(--cc-danger)"
                  : "var(--cc-border)"
                : selected
                ? "var(--cc-primary)"
                : "var(--cc-border)";

              const bgColor = showCorrection
                ? isCorrectKey
                  ? "color-mix(in srgb, var(--cc-success) 12%, var(--cc-surface))"
                  : isWrongSelected
                  ? "color-mix(in srgb, var(--cc-danger) 12%, var(--cc-surface))"
                  : "var(--cc-surface)"
                : selected
                ? "var(--cc-primary-soft)"
                : "var(--cc-surface)";

              const keyBg = showCorrection
                ? isCorrectKey
                  ? "var(--cc-success)"
                  : isWrongSelected
                  ? "var(--cc-danger)"
                  : "var(--cc-surface-alt)"
                : selected
                ? "var(--cc-primary)"
                : "var(--cc-surface-alt)";

              const keyColor =
                showCorrection && (isCorrectKey || isWrongSelected)
                  ? "#fff"
                  : selected
                  ? "#fff"
                  : "var(--cc-text-muted)";

              return (
                <button
                  key={c.key}
                  onClick={() => selectAnswer(c.key)}
                  disabled={showCorrection}
                  className="w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 disabled:cursor-default"
                  style={{ borderColor, background: bgColor, color: "var(--cc-text)" }}
                >
                  <span
                    className="mr-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200"
                    style={{ background: keyBg, color: keyColor }}
                  >
                    {c.key}
                  </span>
                  <span className="align-middle">{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Correction feedback — mode entraînement uniquement */}
          {showCorrection && (
            <div
              className="mt-3 rounded-xl border px-4 py-3 transition-all duration-300"
              style={{
                borderColor: lastChoice === current.answer ? "var(--cc-success)" : "var(--cc-danger)",
                background: lastChoice === current.answer
                  ? "color-mix(in srgb, var(--cc-success) 8%, var(--cc-surface))"
                  : "color-mix(in srgb, var(--cc-danger) 8%, var(--cc-surface))",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: lastChoice === current.answer ? "var(--cc-success)" : "var(--cc-danger)" }}>
                {lastChoice === current.answer
                  ? "✓ Bonne réponse !"
                  : `✗ Mauvaise réponse — la bonne réponse était ${current.answer}`}
              </p>
              {/* Explication : premium/elite uniquement */}
              {limits.canSeeExplanations && current.explanation && (
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
                  {current.explanation}
                </p>
              )}
              {!limits.canSeeExplanations && (
                <p className="mt-1 text-xs" style={{ color: "var(--cc-text-disabled)" }}>
                  Explication disponible avec un Pass →{" "}
                  <a href="/pricing" className="underline" style={{ color: "var(--cc-primary)" }}>Voir les offres</a>
                </p>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={leaveQuiz}
      className="cc-btn cc-btn-tertiary cc-btn-sm"
    >
      Quitter
    </button>

    {mode !== "exam" && (
      
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="rounded-xl border px-4 py-2 transition disabled:opacity-50"
          style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
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
            <Alert variant="warning" className="mt-4" noIcon>
              <span className="text-sm">Validation possible à partir de <strong>{minToSubmit}</strong> réponses — encore {minToSubmit - answeredCount} à compléter.</span>
            </Alert>
          )}

          {score && (
            <div className="mt-5 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
              Score provisoire :{" "}
              <span className="font-semibold" style={{ color: "var(--cc-text)" }}>
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
  <div className="w-full max-w-md rounded-2xl border p-6" style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)", boxShadow: "var(--cc-shadow-lg)" }}>

      <div className="text-center mb-5">
        <div className="mb-3 flex justify-center" style={{ color: "var(--cc-primary)" }}>
          {role === "anonymous" ? <Sparkles size={40} /> : <GraduationCap size={40} />}
        </div>
        <h2 className="text-xl font-extrabold" style={{ color: "var(--cc-text)" }}>
          Débloque l&apos;accès complet
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--cc-text-muted)" }}>
          {role === "anonymous"
            ? "Tu viens de faire 10 questions ! Crée un compte gratuit pour sauvegarder tes résultats et accéder à 20 questions."
            : "Tu viens de terminer tes 20 questions. Choisis un Pass pour accéder à toutes les questions, tous les niveaux, l'examen blanc et les statistiques détaillées."}
        </p>
      </div>

      <div className="space-y-3">
        {role === "anonymous" ? (
          <>
            {/* Bug corrigé : emoji en contenu, pas en attribut */}
            <a
              href={`/register?redirect=/results?mode=${mode}`}
              className="cc-btn cc-btn-primary w-full justify-center"
            >
              Créer un compte pour sauvegarder
            </a>
            <a
              href={`/login?redirect=/results?mode=${mode}`}
              className="cc-btn cc-btn-secondary w-full justify-center"
            >
              J'ai déjà un compte
            </a>
            {!showAnonForm ? (
              <button
                onClick={() => {
                  const u = (() => { try { return JSON.parse(localStorage.getItem('qcm_user') ?? '{}'); } catch { return {}; } })();
                  const count = parseInt(localStorage.getItem('anon_test_count') ?? '0', 10);
                  if (count >= 3 && !u.email) {
                    window.location.href = '/register';
                    return;
                  }
                  if (u.pseudo && u.email) {
                    localStorage.setItem('anon_test_count', String(count + 1));
                    setShowPremiumCTA(false);
                    router.push('/results?mode=' + mode);
                  } else {
                    setShowAnonForm(true);
                  }
                }}
                className="cc-btn cc-btn-tertiary cc-btn-sm w-full justify-center"
              >
                {(() => { const c = parseInt(typeof window !== 'undefined' ? localStorage.getItem('anon_test_count') ?? '0' : '0', 10); return c >= 3 ? 'Créer un compte pour continuer' : 'Voir mes résultats sans compte →'; })()}
              </button>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-center text-sm font-medium" style={{ color: "var(--cc-text)" }}>Où envoyer tes résultats ?</p>
                <input
                  type="text"
                  placeholder="Ton prénom"
                  value={anonPrenom}
                  onChange={(e) => setAnonPrenom(e.target.value)}
                  className="cc-input w-full"
                />
                <input
                  type="email"
                  placeholder="Ton email"
                  value={anonEmail}
                  onChange={(e) => setAnonEmail(e.target.value)}
                  className="cc-input w-full"
                />
                <p className="text-center text-[10px]" style={{ color: "var(--cc-text-disabled)" }}>Pas de spam, jamais.</p>
                <button
                  disabled={!anonPrenom.trim() || !anonEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(anonEmail.trim())}
                  onClick={() => {
                    localStorage.setItem('qcm_user', JSON.stringify({ pseudo: anonPrenom.trim(), email: anonEmail.trim().toLowerCase() }));
                    const count = parseInt(localStorage.getItem('anon_test_count') ?? '0', 10);
                    localStorage.setItem('anon_test_count', String(count + 1));
                    setShowPremiumCTA(false);
                    router.push(`/results?mode=${mode}`);
                  }}
                  className="cc-btn cc-btn-primary w-full justify-center disabled:opacity-40"
                >
                  Voir mes résultats →
                </button>
              </div>
            )}
          </>
        ) : (
          /* Utilisateur freemium : CTA vers /pricing (pas "Premium 19,99€" retiré) */
          <a href="/pricing" className="cc-btn cc-btn-primary w-full justify-center">
            Choisir un Pass →
          </a>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/pricing")}
            className="cc-btn cc-btn-secondary cc-btn-sm flex-1 justify-center"
          >
            Voir les tarifs
          </button>
          {role !== "anonymous" && (
            <button
              onClick={() => { setShowPremiumCTA(false); router.push(`/results?mode=${mode}`); }}
              className="cc-btn cc-btn-tertiary cc-btn-sm flex-1 justify-center"
            >
              Mes résultats →
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}
    </main>
    </>
  );
}