-- La vue conversation_previews agrégeait le dernier message de TOUTES les
-- conversations en bypassant la RLS (SECURITY DEFINER → advisor ERROR + fuite).
-- En security_invoker, la RLS de direct_messages s'applique : chaque utilisateur
-- ne voit que ses propres conversations. Comportement applicatif préservé.
ALTER VIEW public.conversation_previews SET (security_invoker = on);
