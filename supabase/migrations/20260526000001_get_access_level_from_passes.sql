-- ──────────────────────────────────────────────────────────────────────────────
-- Migration : get_access_level() lit passes directement
-- ──────────────────────────────────────────────────────────────────────────────
-- Problème corrigé :
--   Si le webhook Stripe insère dans passes mais échoue sur
--   UPDATE profiles (pass_type, pass_expires_at), l'utilisateur
--   perdait l'accès car get_access_level() lisait profiles.
--
-- Solution :
--   La table passes EST la source de vérité.
--   profiles.pass_type / pass_expires_at deviennent un cache optionnel.
--   get_access_level() vérifie passes en priorité.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_access_level(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile           public.profiles%ROWTYPE;
  v_active_pass_type  text;
  v_active_pass_exp   timestamptz;
  v_mode              text;
  v_recharge_at       timestamptz;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  -- Utilisateur sans profil → mode anonymous
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

  -- ── Source de vérité : table passes ───────────────────────────────────────
  -- On lit le pass actif directement depuis passes, PAS depuis le cache profiles.
  -- Cela garantit que le webhook peut échouer sur UPDATE profiles sans impact
  -- sur l'accès de l'utilisateur.
  SELECT type, expires_at
  INTO v_active_pass_type, v_active_pass_exp
  FROM public.passes
  WHERE user_id = p_user_id
    AND status   = 'active'
    AND expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1;

  -- ── Mode effectif (priorité : pass > premium > freemium) ──────────────────
  IF v_active_pass_type IS NOT NULL THEN
    -- Pass actif trouvé dans passes → mode pass garanti
    RETURN jsonb_build_object(
      'mode',                 'pass',
      'role',                 v_profile.role,
      'quiz_credits',         null,   -- illimité
      'ia_explain_credits',   null,
      'ia_assistant_credits', null,
      'exam_trials',          null,
      'date_epuisement',      null,
      'pass_type',            v_active_pass_type,
      'pass_expires_at',      v_active_pass_exp,
      'recharge_at',          null
    );
  END IF;

  -- Aucun pass actif : vérifier le rôle et les compteurs
  IF v_profile.date_epuisement IS NOT NULL THEN
    v_recharge_at := v_profile.date_epuisement + INTERVAL '30 days';
  END IF;

  IF v_profile.role IN ('premium', 'elite', 'moderator', 'admin', 'super_admin') THEN
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
    'pass_type',            v_profile.pass_type,       -- cache profiles (peut être désynchronisé)
    'pass_expires_at',      v_profile.pass_expires_at, -- idem
    'recharge_at',          v_recharge_at
  );
END;
$$;

COMMENT ON FUNCTION public.get_access_level(uuid) IS
  'Retourne le mode d''accès effectif. Source de vérité : table passes (pass actif). '
  'profiles.pass_type/pass_expires_at sont un cache optionnel — leur désynchronisation '
  'n''impacte pas l''accès.';
