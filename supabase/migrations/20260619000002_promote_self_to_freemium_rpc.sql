-- Promotion self anonymous → freemium (remplace l'UPDATE client retiré par le
-- verrou colonnes). Sécurisée : n'agit que sur l'appelant et seulement s'il est
-- encore 'anonymous'. Couvre les inscriptions OAuth/magic-link.
CREATE OR REPLACE FUNCTION public.promote_self_to_freemium()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  UPDATE public.profiles
     SET role = 'freemium', updated_at = now()
   WHERE id = auth.uid() AND role = 'anonymous';
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.promote_self_to_freemium() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.promote_self_to_freemium() TO authenticated;
