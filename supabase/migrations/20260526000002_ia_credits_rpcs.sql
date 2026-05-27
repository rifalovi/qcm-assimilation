-- ──────────────────────────────────────────────────────────────────────────────
-- Migration : decrement_ia_explain_credit + decrement_ia_assistant_credit
-- ──────────────────────────────────────────────────────────────────────────────
-- Différence vs decrement_quiz_credit :
--   • Pas de date_epuisement — crédits IA non rechargeables automatiquement
--   • Quand credits = 0 → bloqué jusqu'à achat d'un Pass
--   • Même verrou FOR UPDATE pour atomicité
-- ──────────────────────────────────────────────────────────────────────────────

-- §1  decrement_ia_explain_credit
CREATE OR REPLACE FUNCTION public.decrement_ia_explain_credit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits int;
BEGIN
  SELECT ia_explain_credits INTO v_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id;
  END IF;

  IF v_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success',             false,
      'reason',              'credits_exhausted',
      'ia_explain_credits',  0
    );
  END IF;

  UPDATE public.profiles
  SET ia_explain_credits = ia_explain_credits - 1,
      updated_at         = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success',            true,
    'ia_explain_credits', v_credits - 1
  );
END;
$$;

COMMENT ON FUNCTION public.decrement_ia_explain_credit(uuid) IS
  'Décrémente atomiquement ia_explain_credits. '
  'Sans recharge auto — 0 = bloqué jusqu''à achat d''un Pass.';

-- §2  decrement_ia_assistant_credit
CREATE OR REPLACE FUNCTION public.decrement_ia_assistant_credit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits int;
BEGIN
  SELECT ia_assistant_credits INTO v_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id;
  END IF;

  IF v_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success',               false,
      'reason',                'credits_exhausted',
      'ia_assistant_credits',  0
    );
  END IF;

  UPDATE public.profiles
  SET ia_assistant_credits = ia_assistant_credits - 1,
      updated_at           = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success',              true,
    'ia_assistant_credits', v_credits - 1
  );
END;
$$;

COMMENT ON FUNCTION public.decrement_ia_assistant_credit(uuid) IS
  'Décrémente atomiquement ia_assistant_credits. '
  'Sans recharge auto — 0 = bloqué jusqu''à achat d''un Pass.';
