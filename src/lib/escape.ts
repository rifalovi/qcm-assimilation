/**
 * Échappe une chaîne pour usage sûr dans les filtres Supabase
 * (.ilike, .or avec pattern). Retire les caractères spéciaux PostgREST :
 * virgules, parenthèses, pourcent (wildcard), underscore (wildcard simple),
 * backslash (échappement), et apostrophes non doublées.
 */
export function escapeSupabasePattern(input: string, maxLen = 100): string {
  if (!input) return ''
  return input
    .slice(0, maxLen)
    .replace(/[%_\\,()'"]/g, '')
    .trim()
}
