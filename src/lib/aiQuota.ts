// Gestion des quotas IA par rôle

type Role = "anonymous" | "freemium" | "premium" | "elite" | "moderator" | "admin" | "super_admin";

export type AiMode = "explain" | "coach" | "assistant";

// Quotas journaliers par rôle pour chaque mode
export const AI_QUOTAS: Record<string, Record<AiMode, number>> = {
  anonymous: { explain: 3, coach: 0, assistant: 3 },
  freemium: { explain: 10, coach: 3, assistant: 10 },
  premium: { explain: 999, coach: 999, assistant: 999 },
  elite: { explain: 999, coach: 999, assistant: 999 },
  moderator: { explain: 999, coach: 999, assistant: 999 },
  admin: { explain: 999, coach: 999, assistant: 999 },
  super_admin: { explain: 999, coach: 999, assistant: 999 },
};

export function getQuotaForRole(role: Role, mode: AiMode): number {
  return AI_QUOTAS[role]?.[mode] ?? 0;
}

export function isUnlimitedRole(role: string): boolean {
  return ['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(role);
}

export function getQuotaLabel(mode: AiMode): string {
  switch (mode) {
    case 'explain': return 'explications IA';
    case 'coach': return 'analyses de résultats';
    case 'assistant': return 'questions assistant';
  }
}
