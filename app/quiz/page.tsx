"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveResultToSupabase } from "../../src/lib/saveResult";

import type { ChoiceKey, Level, Theme, Question } from "../../src/data/questions";
import { generateQuiz, scoreQuiz } from "../../src/lib/quizEngine";

import Card from "../../components/Card";
import Button from "../../components/Button";

const PER_QUESTION_SECONDS = 20;
const MIN_ANSWERED_TO_SUBMIT = 32;

export default function QuizPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(PER_QUESTION_SECONDS);
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
    router.push(`/results?mode=${mode}`);
  }, [goResults, router, mode]);

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
    if (idx < questions.length - 1) setIdx(idx + 1);
  }

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
          <Button className="mt-4" variant="secondary" onClick={() => router.push("/")}>
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-600" />
          </div>

          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  {mode === "exam" ? "Mode examen" : "Mode entraînement"}
                </div>

                <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {mode === "exam"
                    ? "Concentrez-vous, répondez avec précision et gérez votre temps."
                    : "Progressez question après question avec un rythme maîtrisé."}
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  {mode === "exam"
                    ? "Chaque réponse compte. Restez attentif au chronomètre, évitez de quitter l’onglet et visez au moins 32 bonnes réponses pour valider."
                    : "Prenez le temps de répondre, avancez à votre rythme et validez lorsque vous avez répondu à suffisamment de questions."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <StatBox
                  label="Question"
                  value={`${idx + 1}/${questions.length}`}
                  accent="blue"
                />
                <StatBox
                  label="Répondu"
                  value={`${answeredCount}/${questions.length}`}
                  accent="indigo"
                />
                <StatBox
                  label="Temps restant"
                  value={`${Math.max(0, remaining)}s`}
                  accent={remaining <= 5 ? "red" : "emerald"}
                />
                {mode === "exam" && (
                  <StatBox
                    label="Temps global"
                    value={formatGlobalTime(globalTime) ?? "--:--"}
                    accent={globalTime !== null && globalTime <= 120 ? "red" : "amber"}
                  />
                )}
              </div>
            </div>

            {mode === "exam" && (
              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Onglet quitté : <span className="font-semibold">{focusWarn}</span>/3
                {focusWarn > 0 && (
                  <span className="text-red-300"> — Restez sur cette page pour éviter une validation automatique.</span>
                )}
              </div>
            )}
          </div>
        </section>

        <Card className="overflow-hidden">
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-400">
                Niveau{" "}
                <span className="font-semibold text-white">{meta.level}</span>
              </div>

              <div className="text-sm font-semibold text-white">
                Question {idx + 1} / {questions.length}
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    remaining <= 3 ? "bg-red-500 animate-pulse" : "bg-emerald-400"
                  }`}
                />
                <span className="font-semibold text-white">
                  {Math.max(0, remaining)}s
                </span>
              </div>

              <div className="text-sm text-slate-400">
                Validation à partir de{" "}
                <span className="font-semibold text-white">
                  {MIN_ANSWERED_TO_SUBMIT}
                </span>{" "}
                réponses
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Progression du questionnaire</span>
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
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Temps restant pour cette question</span>
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

              {mode === "exam" && globalTime !== null && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Temps global restant</span>
                    <span className="font-semibold text-slate-200">
                      {formatGlobalTime(globalTime)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        globalTime <= 120
                          ? "bg-gradient-to-r from-red-600 to-rose-500"
                          : "bg-gradient-to-r from-amber-500 to-yellow-400"
                      }`}
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, Math.round((globalTime / 900) * 100))
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {current.theme} • Niveau {current.level}
            </div>

            <h2 className="text-xl font-semibold leading-relaxed text-white sm:text-2xl">
              {current.question}
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            {current.choices.map((c) => {
              const selected = answers[current.id] === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => selectAnswer(c.key)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
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

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {mode !== "exam" ? (
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Précédent
              </button>
            ) : (
              <div />
            )}

            <div className="flex-1" />

            <Button onClick={submit} disabled={!canSubmit}>
              Valider le test
            </Button>
          </div>

          {!canSubmit && (
            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              ⚠️ Validation possible uniquement si vous avez répondu à au moins{" "}
              <strong>{MIN_ANSWERED_TO_SUBMIT}</strong> questions.
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
    </main>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "blue" | "indigo" | "emerald" | "amber" | "red";
}) {
  const accentClass = {
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    indigo: "border-indigo-400/20 bg-indigo-500/10 text-indigo-100",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    red: "border-red-400/20 bg-red-500/10 text-red-100",
  }[accent];

  return (
    <div className={`rounded-2xl border px-4 py-3 ${accentClass}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-80">
        {label}
      </div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}