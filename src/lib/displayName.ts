// Retourne le nom d'affichage selon la préférence
// Priorité : préférence utilisateur → prénom N. → username → "Membre"
export function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  username: string | null,
  preference: string | null = 'firstname'
): string {
  if (preference === 'username' && username) return username
  if (firstName?.trim()) {
    const lastInitial = lastName ? ' ' + lastName.charAt(0).toUpperCase() + '.' : ''
    return firstName.trim() + lastInitial
  }
  return username ?? 'Membre'
}

export function getInitials(
  firstName: string | null,
  lastName: string | null,
  username: string | null
): string {
  if (firstName) return ((firstName.charAt(0)) + (lastName?.charAt(0) ?? '')).toUpperCase()
  return (username?.charAt(0) ?? 'M').toUpperCase()
}
