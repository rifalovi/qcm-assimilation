"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ELIGIBILITY_OPTIONS,
  STAY_OPTIONS,
  type EligibilityGoal,
  type EligibilityStay,
  getRecommendation,
  buildQuizSettings,
} from "@/lib/eligibility";

import { useUser, ROLE_LIMITS } from "./UserContext";

type Props = {
  onClose: () => void;
};

type Step = 1 | 2 | 3;

export default function EligibilityTunnel({ onClose }: Props) {
  const router = useRouter();
  const { role } = useUser();
  const limits = ROLE_LIMITS[role];

  const [step, setStep] = useState<Step>(1);
  const [goal, setGoal] = useState<EligibilityGoal | null>(null);
  const [stay, setStay] = useState<EligibilityStay | null>(null);

  const recommendation = useMemo(() => {
    if (!goal) return null;
    return getRecommendation(goal, stay ?? undefined);
  }, [goal, stay]);

  const fallbackLevel = ((limits.levels[limits.levels.length - 1] ?? 1) as 1 | 2 | 3);

  const effectiveRecommendedLevel: 1 | 2 | 3 =
    recommendation && limits.levels.includes(recommendation.recommendedLevel)
      ? recommendation.recommendedLevel
      : fallbackLevel;

  function handleGoalSelect(value: EligibilityGoal) {
    setGoal(value);
    setStep(2);
  }

  function handleStaySelect(value: EligibilityStay) {
    setStay(value);
    setStep(3);
  }

  function handleBack() {
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(1);
      return;
    }
    onClose();
  }

  function handleStartTraining() {
    if (!recommendation) return;

   const fallbackLevel = (limits.levels[limits.levels.length - 1] ?? 1) as 1 | 2 | 3;

const allowedLevel: 1 | 2 | 3 = limits.levels.includes(
  recommendation.recommendedLevel
)
  ? recommendation.recommendedLevel
  : fallbackLevel;

const settings = buildQuizSettings({
  level: allowedLevel,
  themes: recommendation.themes,
  count: limits.quizCount,
});

    localStorage.setItem(
  "eligibility_recommendation",
  JSON.stringify({
    goal: recommendation.goal,
    title: recommendation.title,
    level: recommendation.recommendedLevel,
    themes: recommendation.themes,
  })
);

    localStorage.setItem("quiz_settings", JSON.stringify(settings));
    onClose();
    router.push("/quiz");
  }

  function handleUnknownTraining() {
    const settings = buildQuizSettings({
      level: 1,
      themes: ["Valeurs", "Société"],
      count: limits.quizCount,
    });

    localStorage.setItem("quiz_settings", JSON.stringify(settings));
    onClose();
    router.push("/quiz");
  }

  return (
    <div className="relative w-full max-w-lg sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-4 sm:p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300 sm:px-3 sm:text-[11px]">
            Parcours personnalisé
          </div>

          <h2 className="text-lg font-extrabold leading-snug text-white sm:text-2xl">
            En 30 secondes, découvre ton niveau et ton plan de révision
          </h2>

          <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
            Réponse rapide, parcours guidé, entraînement préconfiguré.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-3 sm:py-2 sm:text-sm"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      <ProgressIndicator step={step} />

      {step === 1 && (
        <section className="mt-5 sm:mt-6">
          <h3 className="text-base font-bold text-white sm:text-lg">
            Pourquoi passes-tu cet examen ?
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Choisis la démarche qui correspond le mieux à ta situation.
          </p>

          <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3">
            {ELIGIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleGoalSelect(option.value)}
                className="rounded-2xl border border-white/10 bg-white/5 p-3.5 sm:p-4 text-left transition hover:border-blue-400/20 hover:bg-white/10"
              >
                <div className="text-sm font-semibold text-white sm:text-base">
                  {option.label}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-5 sm:mt-6">
          <h3 className="text-base font-bold text-white sm:text-lg">
            Depuis combien de temps es-tu en France ?
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Cette réponse nous aide à mieux te guider.
          </p>

          <div className="mt-4 grid gap-2.5 sm:mt-5 sm:grid-cols-3 sm:gap-3">
            {STAY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStaySelect(option.value)}
                className="rounded-2xl border border-white/10 bg-white/5 p-3.5 sm:p-4 text-center transition hover:border-blue-400/20 hover:bg-white/10"
              >
                <span className="text-xs font-semibold text-white sm:text-sm">
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              ← Retour
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-5 sm:mt-6">
          {goal === "unknown" || !recommendation ? (
            <div className="rounded-[1.25rem] sm:rounded-[1.6rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 sm:px-3 sm:text-xs">
                Orientation
              </div>

              <h3 className="mt-4 text-xl font-bold text-white">
                On va t’aider à y voir plus clair
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                Commence par les bases : valeurs de la République et vie en
                société. Tu pourras affiner ensuite selon ton évolution.
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-300">
                <div>
                  Niveau conseillé : <strong className="text-white">Niveau 1</strong>
                </div>
                <div className="mt-1">
                  Thèmes conseillés :{" "}
                  <strong className="text-white">Valeurs + Société</strong>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={handleUnknownTraining}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 sm:px-5"
                >
                  Commencer un entraînement de base
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-5"
                >
                  Modifier mes réponses
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.25rem] sm:rounded-[1.6rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 sm:px-3 sm:text-xs">
                {recommendation.badge}
              </div>

              <h3 className="mt-4 text-lg font-bold leading-snug text-white sm:text-2xl">
                {recommendation.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                {recommendation.description}
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 sm:p-4 text-sm leading-6 text-slate-300">
                {recommendation.confidenceText}
              </div>

              <div className="mt-4 grid gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3">
                <InfoCard
                  label="Niveau recommandé"
                  value={`Niveau ${recommendation.recommendedLevel}`}
                />
                <InfoCard
                  label="Durée estimée"
                  value={recommendation.estimatedDuration}
                />
                <InfoCard
                  label="Thèmes clés"
                  value={recommendation.themes.join(" • ")}
                />
                <InfoCard
                  label="Parcours"
                  value={recommendation.shortLabel}
                />
              </div>

              <div className="mt-4 sm:mt-5">
                <div className="text-xs font-semibold text-white sm:text-sm">
                  Ce que tu dois surtout connaître
                </div>

                <div className="mt-3 grid gap-2">
                  {recommendation.keyPoints.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-slate-900/40 px-3.5 py-3 sm:px-4 text-sm text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {recommendation.recommendedLevel !==
  ((limits.levels.includes(recommendation.recommendedLevel)
    ? recommendation.recommendedLevel
    : (limits.levels[limits.levels.length - 1] ?? 1)) as 1 | 2 | 3) && (
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Ton offre actuelle ne débloque pas entièrement ce niveau.
                  L’entraînement sera lancé avec le meilleur niveau disponible
                  pour ton compte.
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={handleStartTraining}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 sm:px-5"
                >
                  {recommendation.ctaLabel}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-5"
                >
                  Modifier mes réponses
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ProgressIndicator({ step }: { step: Step }) {
  const items = [
    { id: 1, label: "Démarche" },
    { id: 2, label: "Profil" },
    { id: 3, label: "Parcours" },
  ] as const;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {items.map((item, index) => {
        const active = step === item.id;
        const done = step > item.id;

        return (
          <div key={item.id} className="flex flex-1 items-center gap-2">
            <div
              className={[
                "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold",
                done || active
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-slate-500 border border-white/10",
              ].join(" ")}
            >
              {item.id}
            </div>

            <div
              className={[
                "text-[11px] sm:text-xs font-medium",
                done || active ? "text-white" : "text-slate-500",
              ].join(" ")}
            >
              {item.label}
            </div>

            {index < items.length - 1 ? (
              <div className="h-px min-w-[12px] flex-1 bg-white/10" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3.5 sm:p-4">
      <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold leading-5 sm:leading-6 text-white">
        {value}
      </div>
    </div>
  );
}