-- ═══════════════════════════════════════════════════════════════════════════
-- Migration  : 20260525000001_passes_and_quotas.sql
-- Projet     : qcm-assimilation (veqqvqnhmhfhxwniuzvw)
-- Phase      : 4.1 — Système monétisation (quotas, passes, RPCs)
-- Date       : 2026-05-25
-- Statut     : EN ATTENTE VALIDATION — ne pas exécuter sans GO Carlos
-- ═══════════════════════════════════════════════════════════════════════════
--
-- CONTEXTE
-- ─────────
-- Trois modes d'accès :
--   Mode 1 (anonymous) — contrôlé côté app uniquement (pas de ligne en DB)
--     quiz=5, scroll=5, exam=0, ia_explain=1, ia_assistant=1
--   Mode 2 (freemium) — crédits épuisables, recharge automatique à J+30
--     quiz=20 TOTAL, scroll=999, exam=1, ia_explain=10, ia_assistant=10
--   Mode 3 (pass / premium) — tout illimité
--
-- PASSES STRIPE :
--   Pass Express   — 7 jours  @ 4,99 €  → type = 'express'
--   Pass Sérénité  — 30 jours @ 9,99 €  → type = 'serenite'
--
-- CONTENU
-- ────────
--   §1  Colonnes quotas sur public.profiles
--   §2  Table public.passes + index + RLS
--   §3  RPC public.get_access_level(uuid) → jsonb
--   §4  RPC public.decrement_quiz_credit(uuid) → jsonb
--   §5  Vérifications post-application (commentées)
--   §6  Script de rollback (commenté)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- §1  COLONNES QUOTAS SUR public.profiles
-- ──────────────────────────────────────────────────────────────────────────
-- Toutes les colonnes utilisent IF NOT EXISTS → migration idempotente.
-- Les DEFAULT s'appliquent immédiatement aux lignes existantes (freemium → 20 crédits).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiz_credits          int          NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS ia_explain_credits    int          NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS ia_assistant_credits  int          NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS exam_trials           int          NOT NULL DEFAULT 1,
  -- NULL = crédits non encore épuisés.
  -- Renseigné quand quiz_credits tombe à 0.
  -- Recharge déclenchée quand now() >= date_epuisement + INTERVAL '30 days'.
  ADD COLUMN IF NOT EXISTS date_epuisement       timestamptz,
  -- Pass actif (lecture rapide sans JOIN sur passes)
  ADD COLUMN IF NOT EXISTS pass_type             text         CHECK (pass_type IN ('express', 'serenite')),
  ADD COLUMN IF NOT EXISTS pass_expires_at       timestamptz;

-- Contrainte d'intégrité : pas de pass_expires_at sans pass_type, et réciproquement
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_pass_consistency;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pass_consistency CHECK (
    (pass_type IS NULL AND pass_expires_at IS NULL)
    OR
    (pass_type IS NOT NULL AND pass_expires_at IS NOT NULL)
  );

COMMENT ON COLUMN public.profiles.quiz_credits
  IS 'Crédits quiz restants (freemium : 20 total, recharge J+30 après date_epuisement)';
COMMENT ON COLUMN public.profiles.ia_explain_credits
  IS 'Crédits explication IA restants (freemium : 10)';
COMMENT ON COLUMN public.profiles.ia_assistant_credits
  IS 'Crédits assistant IA restants (freemium : 10)';
COMMENT ON COLUMN public.profiles.exam_trials
  IS 'Nombre d''examens blancs restants (freemium : 1 d''essai)';
COMMENT ON COLUMN public.profiles.date_epuisement
  IS 'Horodatage quand quiz_credits a atteint 0 — recharge automatique à date_epuisement + 30j';
COMMENT ON COLUMN public.profiles.pass_type
  IS 'Type de pass actif : express (7j, 4,99€) ou serenite (30j, 9,99€)';
COMMENT ON COLUMN public.profiles.pass_expires_at
  IS 'Date d''expiration du pass actif — NULL si aucun pass';


-- ──────────────────────────────────────────────────────────────────────────
-- §2  TABLE public.passes (historique complet des achats Stripe)
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.passes (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- 'express'  = Pass Express   7 jours  @ 4,99 €
  -- 'serenite' = Pass Sérénité 30 jours  @ 9,99 €
  type               text         NOT NULL CHECK (type IN ('express', 'serenite')),

  starts_at          timestamptz  NOT NULL DEFAULT now(),
  expires_at         timestamptz  NOT NULL,  -- starts_at + 7j ou + 30j selon type

  stripe_session_id  text,        -- Checkout Session (cs_live_...)
  stripe_payment_id  text,        -- PaymentIntent   (pi_live_...)
  amount_eur         numeric(6,2),-- Montant réellement encaissé (4.99 ou 9.99)

  -- 'active'    — pass en cours de validité
  -- 'expired'   — expiré (mis à jour par webhook Stripe ou cron)
  -- 'cancelled' — remboursé / litige
  status             text         NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'expired', 'cancelled')),

  created_at         timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.passes                   IS 'Historique des passes d''accès achetés via Stripe';
COMMENT ON COLUMN public.passes.type              IS 'express (7j, 4,99€) | serenite (30j, 9,99€)';
COMMENT ON COLUMN public.passes.stripe_session_id IS 'ID Stripe Checkout Session (cs_live_...)';
COMMENT ON COLUMN public.passes.stripe_payment_id IS 'ID Stripe PaymentIntent (pi_live_...)';
COMMENT ON COLUMN public.passes.amount_eur        IS 'Montant réellement payé en euros';
COMMENT ON COLUMN public.passes.status            IS 'active | expired | cancelled';

-- Index pour les requêtes fréquentes (lookup par user, statut, expiration)
CREATE INDEX IF NOT EXISTS idx_passes_user_id    ON public.passes (user_id);
CREATE INDEX IF NOT EXISTS idx_passes_status     ON public.passes (status);
CREATE INDEX IF NOT EXISTS idx_passes_expires_at ON public.passes (expires_at);

-- Row Level Security
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;

-- Un utilisateur lit uniquement ses propres passes
CREATE POLICY "passes_select_own"
  ON public.passes
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT : uniquement le service role (webhook Stripe, API routes server-side)
-- En pratique, le webhook appelle Supabase avec la service_role key → bypass RLS total.
-- Cette policy bloque tout INSERT direct depuis le client.
-- (Pas de WITH CHECK = INSERT refusé pour les JWT normaux)

-- Pas de UPDATE ni DELETE autorisés côté client :
-- l'expiration est gérée par webhook Stripe ou cron job server-side.


-- ──────────────────────────────────────────────────────────────────────────
-- §3  RPC public.get_access_level(p_user_id uuid) → jsonb
-- ──────────────────────────────────────────────────────────────────────────
-- Retourne le niveau d'accès effectif et tous les compteurs.
-- STABLE = lecture seule, résultat mis en cache dans une même transaction.
-- SECURITY DEFINER = lit profiles sans contrainte RLS (usage server-side).
-- À appeler depuis API routes ou Server Components avec la service_role key.

CREATE OR REPLACE FUNCTION public.get_access_level(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile     public.profiles%ROWTYPE;
  v_mode        text;
  v_recharge_at timestamptz;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  -- Utilisateur non authentifié / sans profil → mode anonymous
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'mode',                 'anonymous',
      'quiz_credits',         5,
      'ia_explain_credits',   1,
      'ia_assistant_credits', 1,
      'exam_trials',          0,
      'date_epuisement',      null,
      'pass_type',            null,
      'pass_expires_at',      null,
      'recharge_at',          null
    );
  END IF;

  -- Date de prochaine recharge (si crédits épuisés)
  IF v_profile.date_epuisement IS NOT NULL THEN
    v_recharge_at := v_profile.date_epuisement + INTERVAL '30 days';
  END IF;

  -- Mode effectif (ordre de priorité : pass > premium > freemium)
  IF v_profile.pass_expires_at IS NOT NULL
     AND v_profile.pass_expires_at > now() THEN
    v_mode := 'pass';
  ELSIF v_profile.role IN ('premium', 'elite', 'moderator', 'admin', 'super_admin') THEN
    v_mode := 'premium';
  ELSE
    v_mode := 'freemium';
  END IF;

  RETURN jsonb_build_object(
    'mode',                 v_mode,
    'role',                 v_profile.role,
    'quiz_credits',         v_profile.quiz_credits,
    'ia_explain_credits',   v_profile.ia_explain_credits,
    'ia_assistant_credits', v_profile.ia_assistant_credits,
    'exam_trials',          v_profile.exam_trials,
    'date_epuisement',      v_profile.date_epuisement,
    'pass_type',            v_profile.pass_type,
    'pass_expires_at',      v_profile.pass_expires_at,
    'recharge_at',          v_recharge_at
  );
END;
$$;

COMMENT ON FUNCTION public.get_access_level(uuid) IS
  'Retourne le mode d''accès effectif (anonymous|freemium|pass|premium) et tous les compteurs. Usage server-side uniquement.';


-- ──────────────────────────────────────────────────────────────────────────
-- §4  RPC public.decrement_quiz_credit(p_user_id uuid) → jsonb
-- ──────────────────────────────────────────────────────────────────────────
-- Décrémente atomiquement quiz_credits de 1.
-- Comportements :
--   • Si recharge disponible (now >= date_epuisement + 30j) → reset à 20 puis décrémente
--   • Si quiz_credits = 0 et recharge pas encore dispo → retourne success:false
--   • Si quiz_credits tombe à 0 après décrément → set date_epuisement = now()
-- VOLATILE = modifie des données.
-- SECURITY DEFINER = bypass RLS pour UPDATE atomique.
-- À appeler UNIQUEMENT depuis les API routes server-side (jamais depuis le client directement).

CREATE OR REPLACE FUNCTION public.decrement_quiz_credit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile     public.profiles%ROWTYPE;
  v_new_credits int;
  v_epuisement  timestamptz;
BEGIN
  -- FOR UPDATE : verrouillage ligne pour éviter les race conditions
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id;
  END IF;

  -- ── Vérification recharge ──────────────────────────────────────────
  -- Si les crédits ont été épuisés ET que 30 jours se sont écoulés :
  -- on recharge à 20 avant de décrémenter.
  IF v_profile.date_epuisement IS NOT NULL
     AND now() >= v_profile.date_epuisement + INTERVAL '30 days'
  THEN
    UPDATE public.profiles SET
      quiz_credits    = 20,
      date_epuisement = NULL,
      updated_at      = now()
    WHERE id = p_user_id;

    -- Mettre à jour la variable locale pour la suite
    v_profile.quiz_credits    := 20;
    v_profile.date_epuisement := NULL;
  END IF;

  -- ── Crédits épuisés (et recharge pas encore disponible) ───────────
  IF v_profile.quiz_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success',         false,
      'reason',          'credits_exhausted',
      'quiz_credits',    0,
      'date_epuisement', v_profile.date_epuisement,
      'recharge_at',     v_profile.date_epuisement + INTERVAL '30 days'
    );
  END IF;

  -- ── Décrément ─────────────────────────────────────────────────────
  v_new_credits := v_profile.quiz_credits - 1;

  UPDATE public.profiles SET
    quiz_credits    = v_new_credits,
    -- Si on vient d'atteindre 0 : enregistrer la date d'épuisement
    date_epuisement = CASE
                        WHEN v_new_credits = 0 THEN now()
                        ELSE date_epuisement   -- conserver l'existant si déjà set
                      END,
    updated_at      = now()
  WHERE id = p_user_id
  RETURNING quiz_credits, date_epuisement
    INTO v_new_credits, v_epuisement;

  RETURN jsonb_build_object(
    'success',         true,
    'quiz_credits',    v_new_credits,
    'date_epuisement', v_epuisement,
    'recharge_at',     CASE
                         WHEN v_epuisement IS NOT NULL
                         THEN v_epuisement + INTERVAL '30 days'
                         ELSE null
                       END
  );
END;
$$;

COMMENT ON FUNCTION public.decrement_quiz_credit(uuid) IS
  'Décrémente atomiquement quiz_credits (1 par appel). Recharge auto à J+30. Set date_epuisement si = 0. Usage server-side uniquement.';

COMMIT;


-- ══════════════════════════════════════════════════════════════════════════
-- §5  VÉRIFICATIONS POST-APPLICATION
--     Lancer ces requêtes APRÈS le COMMIT pour valider la migration.
-- ══════════════════════════════════════════════════════════════════════════

-- 5a) Colonnes ajoutées sur profiles
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name   = 'profiles'
--   AND column_name  IN (
--     'quiz_credits','ia_explain_credits','ia_assistant_credits',
--     'exam_trials','date_epuisement','pass_type','pass_expires_at'
--   )
-- ORDER BY column_name;
-- Attendu : 7 lignes, toutes présentes.

-- 5b) Table passes créée avec RLS activé
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'passes';
-- Attendu : 1 ligne, rowsecurity = true.

-- 5c) Policies RLS sur passes
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'passes';
-- Attendu : 1 policy SELECT (passes_select_own).

-- 5d) Test get_access_level sur un user freemium existant
-- SELECT public.get_access_level('<UUID_USER_FREEMIUM>');
-- Attendu :
-- {
--   "mode": "freemium",
--   "role": "freemium",
--   "quiz_credits": 20,
--   "ia_explain_credits": 10,
--   "ia_assistant_credits": 10,
--   "exam_trials": 1,
--   "date_epuisement": null,
--   "pass_type": null,
--   "pass_expires_at": null,
--   "recharge_at": null
-- }

-- 5e) Test decrement_quiz_credit (décrémente 19 → 19)
-- SELECT public.decrement_quiz_credit('<UUID_USER_FREEMIUM>');
-- Attendu : {"success": true, "quiz_credits": 19, "date_epuisement": null, "recharge_at": null}

-- 5f) Vérifier la contrainte pass_consistency
-- UPDATE public.profiles SET pass_type = 'express' WHERE id = '<UUID>';
-- Attendu : ERROR — violates check constraint "profiles_pass_consistency"
-- (pass_expires_at manquant)


-- ══════════════════════════════════════════════════════════════════════════
-- §6  ROLLBACK (si la migration pose problème)
--     Décommenter et exécuter manuellement.
-- ══════════════════════════════════════════════════════════════════════════

-- BEGIN;
--
-- DROP FUNCTION IF EXISTS public.decrement_quiz_credit(uuid);
-- DROP FUNCTION IF EXISTS public.get_access_level(uuid);
--
-- DROP TABLE IF EXISTS public.passes;
--
-- ALTER TABLE public.profiles
--   DROP CONSTRAINT IF EXISTS profiles_pass_consistency,
--   DROP COLUMN IF EXISTS quiz_credits,
--   DROP COLUMN IF EXISTS ia_explain_credits,
--   DROP COLUMN IF EXISTS ia_assistant_credits,
--   DROP COLUMN IF EXISTS exam_trials,
--   DROP COLUMN IF EXISTS date_epuisement,
--   DROP COLUMN IF EXISTS pass_type,
--   DROP COLUMN IF EXISTS pass_expires_at;
--
-- COMMIT;
