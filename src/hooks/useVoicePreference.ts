/**
 * src/hooks/useVoicePreference.ts
 *
 * Hook React pour gérer la préférence de voix (male / female).
 *
 * Stratégie :
 * - Lecture  → localStorage en premier (instantané), fallback Supabase
 * - Écriture → localStorage immédiatement + sync Supabase en background
 *
 * Usage :
 *   const { voice, setVoice, loading } = useVoicePreference();
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

export type VoiceGender = "male" | "female";

const STORAGE_KEY = "qcm_voice_preference";
const DEFAULT_VOICE: VoiceGender = "female";

// ─── Client Supabase léger (côté client) ──────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useVoicePreference() {
  const [voice, setVoiceState] = useState<VoiceGender>(DEFAULT_VOICE);
  const [loading, setLoading] = useState(true);

  // ── Initialisation : localStorage d'abord, puis Supabase ───────────────
  useEffect(() => {
    async function init() {
      // 1. Lire localStorage (instantané)
      const cached = localStorage.getItem(STORAGE_KEY) as VoiceGender | null;
      if (cached === "male" || cached === "female") {
        setVoiceState(cached);
      }

      // 2. Sync depuis Supabase (source de vérité)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("voice_preference")
          .eq("id", user.id)
          .single();

        if (
          profile?.voice_preference === "male" ||
          profile?.voice_preference === "female"
        ) {
          // Supabase est la source de vérité — on écrase le localStorage
          setVoiceState(profile.voice_preference);
          localStorage.setItem(STORAGE_KEY, profile.voice_preference);
        }
      } catch {
        // Silencieux — on garde la valeur localStorage
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // ── Setter : localStorage immédiat + sync Supabase en background ────────
  const setVoice = useCallback(async (newVoice: VoiceGender) => {
    // Mise à jour UI instantanée
    setVoiceState(newVoice);
    localStorage.setItem(STORAGE_KEY, newVoice);

    // Sync Supabase en arrière-plan (pas d'attente)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase
        .from("profiles")
        .update({ voice_preference: newVoice })
        .eq("id", user.id);
    } catch {
      // Silencieux — localStorage reste cohérent même si la sync échoue
    }
  }, []);

  return { voice, setVoice, loading };
}
