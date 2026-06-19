-- ════════════════════════════════════════════════════════════════════════════
-- DURCISSEMENT SÉCURITÉ (suite à l'audit)
--  1. Verrou des colonnes sensibles de profiles (anti self-grant rôle/crédits/pass)
--  2. Garde auth.uid() sur les RPC SECURITY DEFINER prenant p_user_id
--  3. EXECUTE des RPC restreint à authenticated/service_role (anon retiré)
--  4. search_path fixe sur 4 fonctions trigger
--  5. Index sur clés étrangères (montée en charge)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Verrou colonnes profiles ─────────────────────────────────────────────
REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT  UPDATE (
  username, updated_at, voice_preference, city, postal_code, country,
  has_seen_location_modal, first_name, last_name, display_name_preference
) ON public.profiles TO authenticated;

-- ── 2. RPC avec garde auth.uid() (logique métier inchangée) ─────────────────

CREATE OR REPLACE FUNCTION public.get_access_level(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_profile           public.profiles%ROWTYPE;
  v_active_pass_type  text;
  v_active_pass_exp   timestamptz;
  v_mode              text;
  v_recharge_at       timestamptz;
BEGIN
  IF auth.role() <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'unauthorized: user_id mismatch';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'mode','anonymous','quiz_credits',5,'ia_explain_credits',1,
      'ia_assistant_credits',1,'exam_trials',0,'date_epuisement',null,
      'pass_type',null,'pass_expires_at',null,'recharge_at',null);
  END IF;

  SELECT type, expires_at INTO v_active_pass_type, v_active_pass_exp
  FROM public.passes
  WHERE user_id = p_user_id AND status = 'active' AND expires_at > now()
  ORDER BY expires_at DESC LIMIT 1;

  IF v_active_pass_type IS NOT NULL THEN
    RETURN jsonb_build_object(
      'mode','pass','role',v_profile.role,'quiz_credits',null,
      'ia_explain_credits',null,'ia_assistant_credits',null,'exam_trials',null,
      'date_epuisement',null,'pass_type',v_active_pass_type,
      'pass_expires_at',v_active_pass_exp,'recharge_at',null);
  END IF;

  IF v_profile.date_epuisement IS NOT NULL THEN
    v_recharge_at := v_profile.date_epuisement + INTERVAL '30 days';
  END IF;

  IF v_profile.role IN ('premium','elite','moderator','admin','super_admin') THEN
    v_mode := 'premium';
  ELSE
    v_mode := 'freemium';
  END IF;

  RETURN jsonb_build_object(
    'mode',v_mode,'role',v_profile.role,'quiz_credits',v_profile.quiz_credits,
    'ia_explain_credits',v_profile.ia_explain_credits,
    'ia_assistant_credits',v_profile.ia_assistant_credits,
    'exam_trials',v_profile.exam_trials,'date_epuisement',v_profile.date_epuisement,
    'pass_type',v_profile.pass_type,'pass_expires_at',v_profile.pass_expires_at,
    'recharge_at',v_recharge_at);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_quiz_credit(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_profile     public.profiles%ROWTYPE;
  v_new_credits int;
  v_epuisement  timestamptz;
BEGIN
  IF auth.role() <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'unauthorized: user_id mismatch';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id; END IF;

  IF v_profile.date_epuisement IS NOT NULL
     AND now() >= v_profile.date_epuisement + INTERVAL '30 days' THEN
    UPDATE public.profiles SET quiz_credits = 20, date_epuisement = NULL, updated_at = now()
    WHERE id = p_user_id;
    v_profile.quiz_credits := 20; v_profile.date_epuisement := NULL;
  END IF;

  IF v_profile.quiz_credits <= 0 THEN
    RETURN jsonb_build_object('success',false,'reason','credits_exhausted','quiz_credits',0,
      'date_epuisement',v_profile.date_epuisement,
      'recharge_at',v_profile.date_epuisement + INTERVAL '30 days');
  END IF;

  v_new_credits := v_profile.quiz_credits - 1;
  UPDATE public.profiles SET
    quiz_credits = v_new_credits,
    date_epuisement = CASE WHEN v_new_credits = 0 THEN now() ELSE date_epuisement END,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING quiz_credits, date_epuisement INTO v_new_credits, v_epuisement;

  RETURN jsonb_build_object('success',true,'quiz_credits',v_new_credits,'date_epuisement',v_epuisement,
    'recharge_at',CASE WHEN v_epuisement IS NOT NULL THEN v_epuisement + INTERVAL '30 days' ELSE null END);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_exam_trial(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_new     int;
BEGIN
  IF auth.role() <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'unauthorized: user_id mismatch';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id; END IF;

  IF v_profile.exam_trials <= 0 THEN
    RETURN jsonb_build_object('success',false,'reason','exam_exhausted','exam_trials',0);
  END IF;

  v_new := v_profile.exam_trials - 1;
  UPDATE public.profiles SET exam_trials = v_new, updated_at = now() WHERE id = p_user_id;
  RETURN jsonb_build_object('success',true,'exam_trials',v_new);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_ia_assistant_credit(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_credits    int;
  v_epuisement timestamptz;
BEGIN
  IF auth.role() <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'unauthorized: user_id mismatch';
  END IF;

  SELECT ia_assistant_credits, ia_assistant_epuisement INTO v_credits, v_epuisement
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id; END IF;

  IF v_epuisement IS NOT NULL AND now() >= v_epuisement + INTERVAL '30 days' THEN
    UPDATE public.profiles SET ia_assistant_credits = 10, ia_assistant_epuisement = NULL, updated_at = now()
    WHERE id = p_user_id;
    v_credits := 10; v_epuisement := NULL;
  END IF;

  IF v_credits <= 0 THEN
    RETURN jsonb_build_object('success',false,'reason','credits_exhausted','ia_assistant_credits',0,
      'recharge_at', v_epuisement + INTERVAL '30 days');
  END IF;

  v_credits := v_credits - 1;
  UPDATE public.profiles SET
    ia_assistant_credits = v_credits,
    ia_assistant_epuisement = CASE WHEN v_credits = 0 THEN now() ELSE ia_assistant_epuisement END,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success',true,'ia_assistant_credits',v_credits,
    'recharge_at', CASE WHEN v_credits = 0 THEN now() + INTERVAL '30 days' ELSE NULL END);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_ia_explain_credit(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_credits    int;
  v_epuisement timestamptz;
BEGIN
  IF auth.role() <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'unauthorized: user_id mismatch';
  END IF;

  SELECT ia_explain_credits, ia_explain_epuisement INTO v_credits, v_epuisement
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil introuvable pour user_id = %', p_user_id; END IF;

  IF v_epuisement IS NOT NULL AND now() >= v_epuisement + INTERVAL '30 days' THEN
    UPDATE public.profiles SET ia_explain_credits = 10, ia_explain_epuisement = NULL, updated_at = now()
    WHERE id = p_user_id;
    v_credits := 10; v_epuisement := NULL;
  END IF;

  IF v_credits <= 0 THEN
    RETURN jsonb_build_object('success',false,'reason','credits_exhausted','ia_explain_credits',0,
      'recharge_at', v_epuisement + INTERVAL '30 days');
  END IF;

  v_credits := v_credits - 1;
  UPDATE public.profiles SET
    ia_explain_credits = v_credits,
    ia_explain_epuisement = CASE WHEN v_credits = 0 THEN now() ELSE ia_explain_epuisement END,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success',true,'ia_explain_credits',v_credits,
    'recharge_at', CASE WHEN v_credits = 0 THEN now() + INTERVAL '30 days' ELSE NULL END);
END;
$function$;

-- ── 3. EXECUTE restreint (retire anon/PUBLIC) ───────────────────────────────
REVOKE EXECUTE ON FUNCTION
  public.get_access_level(uuid), public.decrement_quiz_credit(uuid),
  public.decrement_exam_trial(uuid), public.decrement_ia_assistant_credit(uuid),
  public.decrement_ia_explain_credit(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.get_access_level(uuid), public.decrement_quiz_credit(uuid),
  public.decrement_exam_trial(uuid), public.decrement_ia_assistant_credit(uuid),
  public.decrement_ia_explain_credit(uuid)
TO authenticated, service_role;

-- ── 4. search_path fixe sur fonctions trigger ───────────────────────────────
ALTER FUNCTION public.set_updated_at()        SET search_path = public;
ALTER FUNCTION public.handle_new_user()       SET search_path = public;
ALTER FUNCTION public.handle_new_report()     SET search_path = public;
ALTER FUNCTION public.handle_user_confirmed() SET search_path = public;

-- ── 5. Index sur clés étrangères ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bans_banned_by                    ON public.bans(banned_by);
CREATE INDEX IF NOT EXISTS idx_comments_user_id                  ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_custom_created_by ON public.email_templates_custom(created_by);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id                 ON public.feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_created_by             ON public.flashcards(created_by);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id               ON public.forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user_id             ON public.forum_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_question_comments_user_id         ON public.question_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_question_interactions_user_id     ON public.question_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id                 ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id              ON public.testimonials(user_id);
