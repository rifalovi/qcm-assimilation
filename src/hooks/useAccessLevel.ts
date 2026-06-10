"use client";
// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useAccessLevel.ts
// Hook React — niveau d'accès effectif avec crédits live depuis Supabase.
//
// Appelle la RPC get_access_level() au montage puis expose :
//   • mode            — 'anonymous' | 'freemium' | 'pass' | 'premium'
//   • quota           — ACCESS_QUOTAS[mode] (capacités dérivées)
//   • quiz_credits, ia_explain_credits, ia_assistant_credits, exam_trials
//   • date_epuisement, pass_type, pass_expires_at, recharge_at
//   • isLoading
//   • consumeQuizCredit() — appelle decrement_quiz_credit() et met à jour local
//
// Usage :
//   const { mode, quota, quiz_credits, consumeQuizCredit } = useAccessLevel();
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "../../app/components/UserContext";
import {
  ACCESS_QUOTAS,
  type AccessMode,
  type AccessQuota,
  roleToMode,
} from "../lib/access";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConsumeResult = {
  success:         boolean;
  quiz_credits:    number;
  date_epuisement: string | null;
  recharge_at:     string | null;
  /** Présent si success = false */
  reason?:         'credits_exhausted' | 'rpc_error' | 'not_authenticated';
};

export type AccessLevel = {
  // ── Mode effectif ──────────────────────────────────────────────────────────
  mode:  AccessMode;
  /** Quota complet dérivé du mode — remplace ROLE_LIMITS[role] */
  quota: AccessQuota;

  // ── Crédits live (depuis DB pour freemium, Infinity pour pass/premium) ─────
  quiz_credits:         number;
  ia_explain_credits:   number;
  ia_assistant_credits: number;
  exam_trials:          number;

  // ── Cycle de recharge ──────────────────────────────────────────────────────
  /** ISO string — null si crédits non encore épuisés */
  date_epuisement:  string | null;
  /** ISO string — null si pas de pass actif */
  pass_type:        string | null;
  pass_expires_at:  string | null;
  /** ISO string — date_epuisement + 30j, null si pas d'épuisement */
  recharge_at:      string | null;

  // ── État ───────────────────────────────────────────────────────────────────
  isLoading: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  /**
   * Décrémente quiz_credits de 1 via RPC decrement_quiz_credit().
   * Met à jour les crédits locaux instantanément (optimistic update).
   * À appeler à chaque question de quiz répondue pour un utilisateur freemium.
   * Ne pas appeler pour les modes pass / premium.
   */
  consumeQuizCredit: () => Promise<ConsumeResult>;

  /**
   * Décrémente exam_trials de 1 via RPC decrement_exam_trial().
   * À appeler au démarrage d'un examen blanc pour un utilisateur freemium.
   * Ne pas appeler pour les modes pass / premium.
   */
  consumeExamTrial: () => Promise<{ success: boolean; exam_trials: number }>;

  /**
   * Force un rechargement des crédits depuis la DB.
   * Utile après un achat de pass.
   */
  refresh: () => Promise<void>;
};

// ── Valeurs par défaut (avant que la RPC réponde) ─────────────────────────────

function getDefaultCredits(mode: AccessMode) {
  const q = ACCESS_QUOTAS[mode];
  return {
    quiz_credits:         Number.isFinite(q.quiz)         ? q.quiz         : 999,
    ia_explain_credits:   Number.isFinite(q.ia_explain)   ? q.ia_explain   : 999,
    ia_assistant_credits: Number.isFinite(q.ia_assistant) ? q.ia_assistant : 999,
    exam_trials:          Number.isFinite(q.exam)         ? q.exam         : 999,
    date_epuisement:      null as string | null,
    pass_type:            null as string | null,
    pass_expires_at:      null as string | null,
    recharge_at:          null as string | null,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAccessLevel(): AccessLevel {
  const { role, isAuthenticated, loading: userLoading } = useUser();
  const supabase = createClient();

  // Mode synchrone initial (évite le flash de contenu verrouillé)
  const initialMode = roleToMode(role, false);

  const [mode, setMode] = useState<AccessMode>(initialMode);
  const [credits, setCredits] = useState(getDefaultCredits(initialMode));
  const [isLoading, setIsLoading] = useState(true);

  // Ref pour éviter les appels concurrent lors des re-renders rapides
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchAccessLevel = useCallback(async () => {
    // Annule un fetch précédent encore en cours
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMode('anonymous');
        setCredits(getDefaultCredits('anonymous'));
        return;
      }

      const { data, error } = await supabase.rpc('get_access_level', {
        p_user_id: user.id,
      });

      if (error || !data) {
        // Fallback synchrone depuis le rôle — ne bloque pas l'UI
        console.warn('[useAccessLevel] RPC error, falling back to role:', error?.message);
        const fallbackMode = roleToMode(role, false);
        setMode(fallbackMode);
        setCredits(getDefaultCredits(fallbackMode));
        return;
      }

      const newMode = data.mode as AccessMode;
      setMode(newMode);
      setCredits({
        quiz_credits:         data.quiz_credits         ?? getDefaultCredits(newMode).quiz_credits,
        ia_explain_credits:   data.ia_explain_credits   ?? getDefaultCredits(newMode).ia_explain_credits,
        ia_assistant_credits: data.ia_assistant_credits ?? getDefaultCredits(newMode).ia_assistant_credits,
        exam_trials:          data.exam_trials          ?? getDefaultCredits(newMode).exam_trials,
        date_epuisement:      data.date_epuisement      ?? null,
        pass_type:            data.pass_type            ?? null,
        pass_expires_at:      data.pass_expires_at      ?? null,
        recharge_at:          data.recharge_at          ?? null,
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      console.warn('[useAccessLevel] fetch failed:', err);
      const fallbackMode = roleToMode(role, false);
      setMode(fallbackMode);
      setCredits(getDefaultCredits(fallbackMode));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userLoading) return;
    fetchAccessLevel();
  }, [userLoading, fetchAccessLevel]);

  // ── consumeQuizCredit ──────────────────────────────────────────────────────

  const consumeQuizCredit = useCallback(async (): Promise<ConsumeResult> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, quiz_credits: 0, date_epuisement: null, recharge_at: null, reason: 'not_authenticated' };
    }

    // Optimistic update — on décrémente localement immédiatement
    const prevCredits = credits.quiz_credits;
    setCredits(prev => ({ ...prev, quiz_credits: Math.max(0, prev.quiz_credits - 1) }));

    try {
      const { data, error } = await supabase.rpc('decrement_quiz_credit', {
        p_user_id: user.id,
      });

      if (error || !data) {
        // Rollback de l'optimistic update
        setCredits(prev => ({ ...prev, quiz_credits: prevCredits }));
        return { success: false, quiz_credits: prevCredits, date_epuisement: null, recharge_at: null, reason: 'rpc_error' };
      }

      // Sync avec la valeur DB confirmée
      setCredits(prev => ({
        ...prev,
        quiz_credits:    data.quiz_credits,
        date_epuisement: data.date_epuisement ?? null,
        recharge_at:     data.recharge_at     ?? null,
      }));

      return {
        success:         data.success,
        quiz_credits:    data.quiz_credits,
        date_epuisement: data.date_epuisement ?? null,
        recharge_at:     data.recharge_at     ?? null,
        reason:          data.success ? undefined : 'credits_exhausted',
      };
    } catch {
      // Rollback
      setCredits(prev => ({ ...prev, quiz_credits: prevCredits }));
      return { success: false, quiz_credits: prevCredits, date_epuisement: null, recharge_at: null, reason: 'rpc_error' };
    }
  }, [credits.quiz_credits, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── consumeExamTrial ───────────────────────────────────────────────────────

  const consumeExamTrial = useCallback(async (): Promise<{ success: boolean; exam_trials: number }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, exam_trials: 0 };

    const prev = credits.exam_trials;
    setCredits(p => ({ ...p, exam_trials: Math.max(0, p.exam_trials - 1) }));

    try {
      const { data, error } = await supabase.rpc('decrement_exam_trial', { p_user_id: user.id });
      if (error || !data) {
        setCredits(p => ({ ...p, exam_trials: prev }));
        return { success: false, exam_trials: prev };
      }
      setCredits(p => ({ ...p, exam_trials: data.exam_trials }));
      return { success: data.success, exam_trials: data.exam_trials };
    } catch {
      setCredits(p => ({ ...p, exam_trials: prev }));
      return { success: false, exam_trials: prev };
    }
  }, [credits.exam_trials, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Retour ────────────────────────────────────────────────────────────────

  return {
    mode,
    quota:           ACCESS_QUOTAS[mode],
    ...credits,
    isLoading,
    consumeQuizCredit,
    consumeExamTrial,
    refresh:         fetchAccessLevel,
  };
}
