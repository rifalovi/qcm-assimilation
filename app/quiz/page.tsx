"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadUser, userKeyByEmail } from "../../src/lib/qcmUser"; // ajuste le chemin
import { saveResultToSupabase } from "../../src/lib/saveResult";


import type { ChoiceKey, Level, Theme, Question } from "../../src/data/questions";
import { generateQuiz, scoreQuiz } from "../../src/lib/quizEngine";

import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import Button from "../../components/Button";

const PER_QUESTION_SECONDS = 20;
const MIN_ANSWERED_TO_SUBMIT = 32;


export default function QuizPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(PER_QUESTION_SECONDS);
  const [meta, setMeta] = useState<{ level: Level; themes: Theme[]; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [goResults, setGoResults] = useState(false);

  const [answers, setAnswers] = useState<Record<string, ChoiceKey | null>>({});
  const tickRef = useRef<number | null>(null);
  const globalRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const [mode, setMode] = useState<"train" | "exam">("train");
  const [globalTime, setGlobalTime] = useState<number | null>(null);
const [focusWarn, setFocusWarn] = useState(0);

useEffect(() => {
  if (mode !== "exam") return;

  function onVisibility() {
    if (document.visibilityState !== "visible") {
      setFocusWarn((n) => n + 1);
    }
  }

  document.addEventListener("visibilitychange", onVisibility);
  return () => document.removeEventListener("visibilitychange", onVisibility);
}, [mode]);
  
useEffect(() => {
  if (mode !== "exam") return;
  if (focusWarn < 3) return;

  // Stop immédiat (comme fin 15 min)
  submit();
}, [mode, focusWarn]);

useEffect(() => {
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
    perQuestion?: number;     // ex: 30
    maxDuration?: number;     // ex: 15*60
  };

  const parsed = JSON.parse(raw) as Settings;

  // Mode
  const m = parsed.mode ?? "train";
  setMode(m);

  // Durées
  const pq = parsed.perQuestion ?? (m === "exam" ? 30 : 20);
  setRemaining(pq);

  if (m === "exam") {
    setGlobalTime(parsed.maxDuration ?? 15 * 60);
  } else {
    setGlobalTime(null);
  }

  // Meta (pour affichage + results)
  setMeta({ level: parsed.level, themes: parsed.themes, count: parsed.count });

  try {
    const quiz = generateQuiz({
      level: parsed.level,
      themes: parsed.themes,
      count: parsed.count,
    });
    setQuestions(quiz);

    const init: Record<string, ChoiceKey | null> = {};
    for (const q of quiz) init[q.id] = null;
    setAnswers(init);
  } catch (e: any) {
    setError(e?.message ?? "Erreur lors de la génération du test.");
  }
}, [router]);



useEffect(() => {
  if (mode !== "exam") return;
  if (!questions.length) return;

  // 15 minutes en secondes
  setGlobalTime((t) => (t ?? 15 * 60));

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
  if (!goResults) return;
  router.push("/results");
}, [goResults, router]);

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

  const canSubmit = answeredCount >= MIN_ANSWERED_TO_SUBMIT;
  

  // Timer reset à chaque question
 useEffect(() => {
  if (!questions.length) return;

  const perQuestionSeconds = mode === "exam" ? 30 : 20;

  setRemaining(perQuestionSeconds);

  if (tickRef.current) window.clearInterval(tickRef.current);

  tickRef.current = window.setInterval(() => {
    setRemaining((r) => {
      if (r <= 1) {
        // ⏱ Temps écoulé

        const current = questions[idx];

        // Si aucune réponse → reste null (donc faux)
        if (!answers[current.id]) {
          setAnswers((prev) => ({
            ...prev,
            [current.id]: null,
          }));
        }

        // Dernière question → soumettre
        if (idx >= questions.length - 1) {
          submit();
          return 0;
        }

        // Sinon question suivante
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

  // Auto-next quand temps = 0
  useEffect(() => {
    if (remaining > 0) return;

    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;

    if (idx < questions.length - 1) setIdx((i) => i + 1);
  }, [remaining, idx, questions.length]);

  function selectAnswer(choice: ChoiceKey) {
    if (!current) return;

    setAnswers((prev) => ({ ...prev, [current.id]: choice }));
    if (idx < questions.length - 1) setIdx(idx + 1);
  }

// REMPLACE la fonction submit() dans app/quiz/page.tsx
// Et ajoute l'import en haut du fichier

// ============ IMPORT À AJOUTER EN HAUT ============
// import { saveResultToSupabase } from "../../src/lib/saveResult";

// ============ NOUVELLE FONCTION submit() ============
async function submit() {
  if (submittedRef.current) return;
  submittedRef.current = true;

  if (tickRef.current) window.clearInterval(tickRef.current);
  if (globalRef.current) window.clearInterval(globalRef.current);

  const result = scoreQuiz({ questions, answers });
  const payload = { meta, questions, answers, result };

  const rawUser = localStorage.getItem("qcm_user");
  const u = rawUser ? JSON.parse(rawUser) : null;
  const email = u?.email ? String(u.email).trim().toLowerCase() : "";
  const pseudo = u?.pseudo ?? "";

  const currentMode: "train" | "exam" =
    meta && (meta as any).mode === "exam" ? "exam" : "train";

  // 1) Sauvegarde localStorage (fallback offline)
  if (email) {
    localStorage.setItem(`last_result:${currentMode}:${email}`, JSON.stringify(payload));
  }
  localStorage.setItem("last_result", JSON.stringify(payload));

  // 2) Sauvegarde Supabase (sync multi-appareils)
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

  // 3) Navigation
  setGoResults(true);
}
        if (error) {
        return (
        <main className="max-w-4xl mx-auto p-6">
        <Card>
          <h1 className="text-xl font-bold">Impossible de générer le test</h1>
            <p className="mt-2 text-slate-700">{error}</p>
            <Button className="mt-4" variant="secondary" onClick={() => router.push("/")}>
               Retour
              </Button>
        </Card>
        </main>
                );}

              if (!questions.length || !current || !meta) {
                  return <main className="p-6">Chargement…</main>;}

const progressPct = questions.length
  ? Math.round(((idx + 1) / questions.length) * 100)
  : 0;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Card>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
            <div className="text-sm text-slate-500">
              Niveau <span className="font-semibold text-slate-800">{meta.level}</span>
            </div>

            <div className="text-sm font-semibold">
              Question {idx + 1} / {questions.length}
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  remaining <= 3 ? "bg-red-500 animate-pulse" : "bg-green-500"
                }`}
              />
              <span className="font-semibold">{Math.max(0, remaining)}s</span>
            </div>

            <div className="text-sm text-slate-600">
              Répondu{" "}
              <span className="font-semibold text-slate-900">
                {answeredCount}/{questions.length}
              </span>{" "}
              (min {MIN_ANSWERED_TO_SUBMIT})
            </div>
          </div>

          {mode === "exam" && (
  <div className="mt-2 text-xs text-slate-600">
    Onglet quitté : <span className="font-semibold">{focusWarn}</span>/3
    {focusWarn > 0 && <span className="text-red-600"> — Reste sur la page.</span>}
  </div>
)}
<div className="mt-3">
  <div className="flex items-center justify-between text-xs text-slate-600">
    <span>Progression</span>
    <span className="font-semibold">{progressPct}%</span>
  </div>

  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
    <div
      className="h-full rounded-full bg-blue-600 transition-all duration-300"
      style={{ width: `${progressPct}%` }}
    />
  </div>

  <div className="mt-2 text-xs text-slate-500">
    Répondu : <span className="font-semibold text-slate-700">{answeredCount}</span> / {questions.length}
  </div>
</div>
               </div>

        <h2 className="text-xl font-semibold mb-6 leading-relaxed">{current.question}</h2>

        <div className="space-y-4">
          {current.choices.map((c) => {
            const selected = answers[current.id] === c.key;
            return (
              <button
                key={c.key}
                onClick={() => selectAnswer(c.key)}
                className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
                  selected
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                }`}
              >
                <span className="font-semibold mr-2">{c.key}.</span>
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          {mode !== "exam" && (
  <button
    onClick={() => setIdx((i) => Math.max(0, i - 1))}
    disabled={idx === 0}
    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
  >
    Précédent
  </button>
)}

          <div className="flex-1" />

          <Button onClick={submit} disabled={!canSubmit}>
            Valider le test
          </Button>
        </div>

        {!canSubmit && (
          <p className="mt-4 text-sm text-amber-700">
            ⚠️ Validation possible uniquement si tu as répondu à{" "}
            <strong>{MIN_ANSWERED_TO_SUBMIT}</strong> questions minimum.
          </p>
        )}
      </Card>
    </main>
  );
}