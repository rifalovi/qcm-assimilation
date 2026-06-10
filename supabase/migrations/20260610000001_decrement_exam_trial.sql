-- Décrément atomique des essais d'examen blanc (exam_trials) pour le gating freemium.
-- Calqué sur decrement_quiz_credit. Refuse à 0 (success=false).

CREATE OR REPLACE FUNCTION public.decrement_exam_trial(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_new     int;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id;
  END IF;

  -- Essais d'examen blanc épuisés
  IF v_profile.exam_trials <= 0 THEN
    RETURN jsonb_build_object(
      'success',     false,
      'reason',      'exam_exhausted',
      'exam_trials', 0
    );
  END IF;

  -- Décrément atomique
  v_new := v_profile.exam_trials - 1;

  UPDATE public.profiles SET
    exam_trials = v_new,
    updated_at  = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success',     true,
    'exam_trials', v_new
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.decrement_exam_trial(uuid) TO authenticated;
