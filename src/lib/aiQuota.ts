// Quotas IA — source de vérité unique : ACCESS_QUOTAS (src/lib/access.ts).
//
// Il n'existe que DEUX pools de crédits réels en base (colonnes profiles) :
//   • ia_explain   ← modes "explain" + "coach"
//   • ia_assistant ← modes "assistant" + "chat" (chatbot)
// Les crédits se rechargent à +30 jours (cf. decrement_ia_*_credit).

import { ACCESS_QUOTAS, roleToMode, type UserRole } from "./access";

export type AiMode = "explain" | "coach" | "assistant" | "chat";

/** Mappe un mode IA vers son pool de crédits réel. */
function poolForMode(mode: AiMode): "ia_explain" | "ia_assistant" {
  return mode === "explain" || mode === "coach" ? "ia_explain" : "ia_assistant";
}

/**
 * Quota du pool de crédits IA pour un rôle/mode donné.
 * Dérivé d'ACCESS_QUOTAS — plus aucun chiffre par mode codé en dur ici.
 */
export function getQuotaForRole(role: string, mode: AiMode): number {
  const accessMode = roleToMode(role as UserRole, false);
  const q = ACCESS_QUOTAS[accessMode][poolForMode(mode)];
  return Number.isFinite(q) ? q : 999;
}

export function isUnlimitedRole(role: string): boolean {
  return ["premium", "elite", "moderator", "admin", "super_admin"].includes(role);
}

export function getQuotaLabel(mode: AiMode): string {
  switch (mode) {
    case "explain": return "explications IA";
    case "coach": return "analyses de résultats";
    case "assistant": return "questions assistant";
    case "chat": return "messages chatbot";
  }
}
