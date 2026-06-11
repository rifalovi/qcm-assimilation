-- Crédits IA : recharge à +30 jours (alignée sur le quiz) + gate anonyme serveur.
--
-- - Ajoute ia_assistant_epuisement / ia_explain_epuisement (timestamptz)
-- - Réécrit decrement_ia_assistant_credit / decrement_ia_explain_credit avec
--   recharge automatique à épuisement + 30 jours (base 10) et renvoi recharge_at
-- - Ajoute ai_anon_quota (compteur IP/jour) + consume_anon_ai_credit() pour
--   gater les requêtes IA anonymes côté serveur (anti-abus / coût OpenAI)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ia_assistant_epuisement timestamptz,
  ADD COLUMN IF NOT EXISTS ia_explain_epuisement   timestamptz;

CREATE OR REPLACE FUNCTION public.decrement_ia_assistant_credit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_credits    int;
  v_epuisement timestamptz;
BEGIN
  SELECT ia_assistant_credits, ia_assistant_epuisement
    INTO v_credits, v_epuisement
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id;
  END IF;

  IF v_epuisement IS NOT NULL AND now() >= v_epuisement + INTERVAL '30 days' THEN
    UPDATE public.profiles
      SET ia_assistant_credits = 10, ia_assistant_epuisement = NULL, updated_at = now()
    WHERE id = p_user_id;
    v_credits := 10; v_epuisement := NULL;
  END IF;

  IF v_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success', false, 'reason', 'credits_exhausted',
      'ia_assistant_credits', 0,
      'recharge_at', v_epuisement + INTERVAL '30 days'
    );
  END IF;

  v_credits := v_credits - 1;
  UPDATE public.profiles SET
    ia_assistant_credits    = v_credits,
    ia_assistant_epuisement = CASE WHEN v_credits = 0 THEN now() ELSE ia_assistant_epuisement END,
    updated_at              = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true, 'ia_assistant_credits', v_credits,
    'recharge_at', CASE WHEN v_credits = 0 THEN now() + INTERVAL '30 days' ELSE NULL END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_ia_explain_credit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_credits    int;
  v_epuisement timestamptz;
BEGIN
  SELECT ia_explain_credits, ia_explain_epuisement
    INTO v_credits, v_epuisement
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id;
  END IF;

  IF v_epuisement IS NOT NULL AND now() >= v_epuisement + INTERVAL '30 days' THEN
    UPDATE public.profiles
      SET ia_explain_credits = 10, ia_explain_epuisement = NULL, updated_at = now()
    WHERE id = p_user_id;
    v_credits := 10; v_epuisement := NULL;
  END IF;

  IF v_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success', false, 'reason', 'credits_exhausted',
      'ia_explain_credits', 0,
      'recharge_at', v_epuisement + INTERVAL '30 days'
    );
  END IF;

  v_credits := v_credits - 1;
  UPDATE public.profiles SET
    ia_explain_credits    = v_credits,
    ia_explain_epuisement = CASE WHEN v_credits = 0 THEN now() ELSE ia_explain_epuisement END,
    updated_at            = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true, 'ia_explain_credits', v_credits,
    'recharge_at', CASE WHEN v_credits = 0 THEN now() + INTERVAL '30 days' ELSE NULL END
  );
END;
$function$;

CREATE TABLE IF NOT EXISTS public.ai_anon_quota (
  ip    text  NOT NULL,
  day   date  NOT NULL DEFAULT current_date,
  count int   NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, day)
);
ALTER TABLE public.ai_anon_quota ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_anon_ai_credit(p_ip text, p_limit int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.ai_anon_quota (ip, day, count)
  VALUES (p_ip, current_date, 1)
  ON CONFLICT (ip, day)
    DO UPDATE SET count = public.ai_anon_quota.count + 1
    WHERE public.ai_anon_quota.count < p_limit
  RETURNING count INTO v_count;

  IF v_count IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'anon_limit');
  END IF;

  RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.consume_anon_ai_credit(text, int) TO anon, authenticated;
