"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ELIGIBILITY_OPTIONS,
  STAY_OPTIONS,
  type EligibilityGoal,
  type EligibilityStay,
  getRecommendation,
  buildQuizSettings,
} from "@/lib/eligibility";

import { useUser } from "./UserContext";
import { getAccessQuota } from "../../src/lib/access";

type Props = {
  onClose: () => void;
};

type Step = 1 | 2 | 3;

export default function EligibilityTunnel({ onClose }: Props) {
  const router = useRouter();
  const { role } = useUser();
  const limits = getAccessQuota(role);

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
  count: limits.quiz,
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
      count: limits.quiz,
    });

    localStorage.setItem("quiz_settings", JSON.stringify(settings));
    onClose();
    router.push("/quiz");
  }

  return (
    <div className="relative w-full max-w-lg sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2rem] border p-4 sm:p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
        <div>
          <div
            className="mb-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] sm:px-3 sm:text-[11px]"
            style={{
              borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)",
              background: "var(--cc-primary-soft)",
              color: "var(--cc-primary)",
            }}
          >
            Parcours personnalisé
          </div>

          <h2 className="text-lg font-extrabold leading-snug sm:text-2xl" style={{ color: "var(--cc-text)" }}>
            En 30 secondes, découvre ton niveau et ton plan de révision
          </h2>

          <p className="mt-2 text-xs leading-5 sm:text-sm sm:leading-6" style={{ color: "var(--cc-text-muted)" }}>
            Réponse rapide, parcours guidé, entraînement préconfiguré.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border px-2.5 py-1.5 text-xs transition hover:opacity-80 sm:px-3 sm:py-2 sm:text-sm" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      <ProgressIndicator step={step} />

      {step === 1 && (
        <section className="mt-5 sm:mt-6">
          <h3 className="text-base font-bold sm:text-lg" style={{ color: "var(--cc-text)" }}>
            Pourquoi passes-tu cet examen ?
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>
            Choisis la démarche qui correspond le mieux à ta situation.
          </p>

          <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3">
            {ELIGIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleGoalSelect(option.value)}
                className="rounded-2xl border p-3.5 sm:p-4 text-left transition hover:opacity-90"
                style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
              >
                <div className="text-sm font-semibold sm:text-base" style={{ color: "var(--cc-text)" }}>
                  {option.label}
                </div>
                <div className="mt-1 text-xs leading-5 sm:text-sm sm:leading-6" style={{ color: "var(--cc-text-muted)" }}>
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-5 sm:mt-6">
          <h3 className="text-base font-bold sm:text-lg" style={{ color: "var(--cc-text)" }}>
            Depuis combien de temps es-tu en France ?
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>
            Cette réponse nous aide à mieux te guider.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
            {STAY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStaySelect(option.value)}
                className="rounded-2xl border p-3.5 sm:p-4 text-center transition hover:opacity-90"
                style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
              >
                <span className="text-xs font-semibold sm:text-sm" style={{ color: "var(--cc-text)" }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm font-medium transition hover:opacity-80" style={{ color: "var(--cc-text-muted)" }}
            >
              ← Retour
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-5 sm:mt-6">
          {goal === "unknown" || !recommendation ? (
            <div className="rounded-[1.25rem] sm:rounded-[1.6rem] border p-4 sm:p-5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
              <div
                className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs"
                style={{
                  borderColor: "color-mix(in srgb, var(--cc-warning) 25%, transparent)",
                  background: "var(--cc-warning-soft)",
                  color: "var(--cc-warning)",
                }}
              >
                Orientation
              </div>

              <h3 className="mt-4 text-xl font-bold" style={{ color: "var(--cc-text)" }}>
                On va t’aider à y voir plus clair
              </h3>

              <p className="mt-2 text-xs leading-5 sm:text-sm sm:leading-6" style={{ color: "var(--cc-text-muted)" }}>
                Commence par les bases : valeurs de la République et vie en
                société. Tu pourras affiner ensuite selon ton évolution.
              </p>

              <div className="mt-4 rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
                <div>
                  Niveau conseillé : <strong style={{ color: "var(--cc-text)" }}>Niveau 1</strong>
                </div>
                <div className="mt-1">
                  Thèmes conseillés :{" "}
                  <strong style={{ color: "var(--cc-text)" }}>Valeurs + Société</strong>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={handleUnknownTraining}
                  className="rounded-2xl px-4 py-3 text-sm font-bold transition hover:opacity-90 sm:px-5"
                  style={{ background: "var(--cc-primary)", color: "#fff" }}
                >
                  Commencer un entraînement de base
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:opacity-80 sm:px-5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
                >
                  Modifier mes réponses
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.25rem] sm:rounded-[1.6rem] border p-4 sm:p-5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
              <div
                className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs"
                style={{
                  borderColor: "color-mix(in srgb, var(--cc-success) 25%, transparent)",
                  background: "var(--cc-success-soft)",
                  color: "var(--cc-success)",
                }}
              >
                {recommendation.badge}
              </div>

              {(recommendation as any).natEarlyWarning && (
                <div
                  className="mt-4 rounded-2xl border p-4 text-sm"
                  style={{
                    borderColor: "color-mix(in srgb, var(--cc-warning) 25%, transparent)",
                    background: "var(--cc-warning-soft)",
                    color: "var(--cc-warning)",
                  }}
                >
                  <div className="font-bold mb-2" style={{ color: "var(--cc-warning)" }}>⚠️ Attention — durée de résidence insuffisante</div>
                  <p className="text-xs leading-5 mb-3" style={{ color: "var(--cc-warning)" }}>
                    La naturalisation requiert en général <strong>5 ans de résidence</strong> en France. Des exceptions existent si vous êtes dans l'une de ces situations :
                  </p>
                  <ul className="text-xs leading-6 space-y-1 mb-3" style={{ color: "var(--cc-warning)" }}>
                    <li>• Statut de réfugié reconnu</li>
                    <li>• Langue maternelle française (pays francophone)</li>
                    <li>• Scolarisé 5 ans+ dans un établissement francophone</li>
                    <li>• Service militaire dans l'armée française</li>
                    <li>• Diplôme d'un établissement supérieur français (2 ans+)</li>
                    <li>• Services exceptionnels rendus à la France</li>
                    <li>• Parcours exceptionnel d'intégration</li>
                  </ul>
                  <a
                    href="https://www.service-public.fr/particuliers/vosdroits/F2213"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold underline hover:opacity-80"
                    style={{ color: "var(--cc-primary)" }}
                  >
                    Voir toutes les conditions sur Service-Public.fr →
                  </a>
                </div>
              )}

              <h3 className="mt-4 text-lg font-bold leading-snug sm:text-2xl" style={{ color: "var(--cc-text)" }}>
                {recommendation.title}
              </h3>

              <p className="mt-2 text-xs leading-5 sm:text-sm sm:leading-6" style={{ color: "var(--cc-text-muted)" }}>
                {recommendation.description}
              </p>

              <div className="mt-4 rounded-2xl border p-3.5 sm:p-4 text-sm leading-6" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
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
                <div className="text-xs font-semibold sm:text-sm" style={{ color: "var(--cc-text)" }}>
                  Ce que tu dois surtout connaître
                </div>

                <div className="mt-3 grid gap-2">
                  {recommendation.keyPoints.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border px-3.5 py-3 sm:px-4 text-sm" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
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
                <div
                  className="mt-4 rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: "color-mix(in srgb, var(--cc-warning) 25%, transparent)",
                    background: "var(--cc-warning-soft)",
                    color: "var(--cc-warning)",
                  }}
                >
                  Ton offre actuelle ne débloque pas entièrement ce niveau.
                  L’entraînement sera lancé avec le meilleur niveau disponible
                  pour ton compte.
                </div>
              )}



              {/* Recommandation Bibliothèque Audio pour naturalisation */}
              {goal === "nat" && (
                <div
                  className="mt-4 rounded-2xl border p-4"
                  style={{
                    borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)",
                    background: "var(--cc-primary-soft)",
                  }}
                >
                  <div className="text-xs font-bold mb-1" style={{ color: "var(--cc-primary)" }}>🎧 Bibliothèque Audio recommandée</div>
                  <p className="text-xs leading-5 mb-3" style={{ color: "var(--cc-text-muted)" }}>
                    Préparez l'oral de votre entretien avec nos épisodes audio dédiés à la naturalisation — valeurs, institutions, histoire et la question clé : <em>Pourquoi voulez-vous devenir français(e) ?</em>
                  </p>
                  <button
                    type="button"
                    onClick={() => { onClose(); router.push("/audio"); }}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition hover:opacity-90"
                    style={{ background: "var(--cc-primary)", color: "#fff" }}
                  >
                    Découvrir la bibliothèque audio →
                  </button>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={handleStartTraining}
                  className="rounded-2xl px-4 py-3 text-sm font-bold transition hover:opacity-90 sm:px-5"
                  style={{ background: "var(--cc-primary)", color: "#fff" }}
                >
                  {recommendation.ctaLabel}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:opacity-80 sm:px-5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
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
                done || active ? "" : "border",
              ].join(" ")}
              style={
                done || active
                  ? { background: "var(--cc-primary)", color: "#fff" }
                  : { borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }
              }
            >
              {item.id}
            </div>

            <div
              className="text-[11px] sm:text-xs font-medium"
              style={{ color: done || active ? "var(--cc-text)" : "var(--cc-text-disabled)" }}
            >
              {item.label}
            </div>

            {index < items.length - 1 ? (
              <div className="h-px min-w-[12px] flex-1" style={{ background: "var(--cc-border)" }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-3.5 sm:p-4" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
      <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--cc-text-disabled)" }}>
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold leading-5 sm:leading-6" style={{ color: "var(--cc-text)" }}>
        {value}
      </div>
    </div>
  );
}