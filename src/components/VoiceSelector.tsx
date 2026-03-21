/**
 * src/components/VoiceSelector.tsx
 *
 * Composant sélecteur de voix à intégrer dans /account.
 * Affiche un toggle Masculin / Féminin avec aperçu sonore.
 *
 * Usage dans app/account/page.tsx :
 *   import { VoiceSelector } from "@/components/VoiceSelector";
 *   <VoiceSelector />
 */

"use client";

import { useState } from "react";
import { useVoicePreference, type VoiceGender } from "@/hooks/useVoicePreference";

// ─── Données des voix ─────────────────────────────────────────────────────
const VOICE_OPTIONS: {
  gender: VoiceGender;
  label: string;
  description: string;
  icon: string;
  previewSlug: string; // épisode utilisé pour l'aperçu
}[] = [
  {
    gender: "male",
    label: "Voix masculine",
    description: "Ton calme et posé, idéal pour une écoute concentrée",
    icon: "♂",
    previewSlug: "la-devise-liberte-egalite-fraternite",
  },
  {
    gender: "female",
    label: "Voix féminine",
    description: "Ton clair et naturel, proche d'un entretien réel",
    icon: "♀",
    previewSlug: "la-devise-liberte-egalite-fraternite",
  },
];

// ─── Composant ────────────────────────────────────────────────────────────
export function VoiceSelector() {
  const { voice, setVoice, loading } = useVoicePreference();
  const [previewing, setPreviewing] = useState<VoiceGender | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSelect = async (gender: VoiceGender) => {
    if (gender === voice) return;
    await setVoice(gender);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePreview = async (gender: VoiceGender, slug: string) => {
    if (previewing) return; // déjà en cours
    setPreviewing(gender);

    try {
      const res = await fetch(`/api/audio/${slug}?voice=${gender}`);
      if (!res.ok) throw new Error("Aperçu indisponible");

      const { url } = await res.json();
      const audio = new Audio(url);
      audio.onended = () => setPreviewing(null);
      audio.onerror = () => setPreviewing(null);
      // Limiter l'aperçu à 15 secondes
      setTimeout(() => {
        audio.pause();
        setPreviewing(null);
      }, 15000);
      await audio.play();
    } catch {
      setPreviewing(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-[0_20px_50px_rgba(2,8,23,0.24)]">
      {/* En-tête */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Voix de narration</h3>
          <p className="mt-1 text-sm text-slate-400">
            Choisissez la voix pour tous vos épisodes audio
          </p>
        </div>

        {/* Feedback sauvegarde */}
        {saved && (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sauvegardé
          </span>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {VOICE_OPTIONS.map((option) => {
          const isSelected = voice === option.gender;
          const isPreviewingThis = previewing === option.gender;

          return (
            <div
              key={option.gender}
              onClick={() => handleSelect(option.gender)}
              className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                isSelected
                  ? "border-blue-400/30 bg-blue-500/10 shadow-[0_8px_24px_rgba(37,99,235,0.15)]"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
              }`}
            >
              {/* Indicateur sélectionné */}
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-lg font-bold transition-colors ${
                    isSelected
                      ? "border-blue-400/30 bg-blue-500/15 text-blue-300"
                      : "border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  {option.icon}
                </span>

                {/* Radio circle */}
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected
                      ? "border-blue-400 bg-blue-500"
                      : "border-white/20 bg-transparent"
                  }`}
                >
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
              </div>

              <p className={`font-semibold ${isSelected ? "text-white" : "text-slate-300"}`}>
                {option.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {option.description}
              </p>

              {/* Bouton aperçu */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // ne pas déclencher handleSelect
                  handlePreview(option.gender, option.previewSlug);
                }}
                disabled={!!previewing}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40 ${
                  isSelected
                    ? "border-blue-400/20 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {isPreviewingThis ? (
                  <>
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
                    Lecture en cours...
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M2 1.5l9 4.5-9 4.5V1.5z" />
                    </svg>
                    Écouter un aperçu
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <p className="mt-4 text-center text-xs text-slate-500">
        La préférence est synchronisée sur tous vos appareils
      </p>
    </div>
  );
}

