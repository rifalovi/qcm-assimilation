// ─────────────────────────────────────────────────────────────────────────────
// src/lib/access.ts
// Source de vérité unique pour les quotas et capacités d'accès.
// Remplace ROLE_LIMITS dans app/components/UserContext.tsx.
//
// Trois modes d'accès effectifs (indépendants du rôle DB brut) :
//   anonymous — sans compte
//   freemium  — compte gratuit (crédits quiz épuisables, recharge J+30)
//   pass      — Pass Express (7j/4,99€) ou Pass Sérénité (30j/9,99€) actif
//   premium   — rôle premium / elite / moderator / admin / super_admin
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

export type AccessMode = 'anonymous' | 'freemium' | 'pass' | 'premium';

/** Tous les rôles bruts stockés dans profiles.role */
export type UserRole =
  | 'anonymous'
  | 'freemium'
  | 'premium'
  | 'elite'
  | 'moderator'
  | 'admin'
  | 'super_admin';

export type AccessQuota = {
  // ── Quotas numériques ──────────────────────────────────────────────────────
  /** Questions quiz autorisées (freemium : 20 total épuisables ; pass/premium : Infinity) */
  quiz:         number;
  /** Cartes visible en mode scroll (par thème) */
  scroll:       number;
  /** Nombre d'examens blancs autorisés */
  exam:         number;
  /** Crédits explication IA */
  ia_explain:   number;
  /** Crédits assistant IA (messages) */
  ia_assistant: number;

  // ── Capacités booléennes (utilisées par les composants existants) ──────────
  /** Peut lancer un examen blanc */
  canExam:            boolean;
  /** Voit les explications après réponse */
  canSeeExplanations: boolean;
  /** Voit les statistiques par thème dans les résultats */
  canSeeThemeStats:   boolean;
  /** Niveaux de difficulté autorisés */
  levels:             readonly (1 | 2 | 3)[];
};

// ── Quotas validés ────────────────────────────────────────────────────────────

export const ACCESS_QUOTAS = {
  anonymous: {
    quiz:               5,
    scroll:             5,
    exam:               0,
    ia_explain:         3,
    ia_assistant:       3,
    canExam:            false,
    canSeeExplanations: false,
    canSeeThemeStats:   false,
    levels:             [1] as const,
  },
  freemium: {
    quiz:               20,   // total épuisable — recharge automatique à date_epuisement + 30j
    scroll:             999,
    exam:               1,    // 1 examen blanc d'essai
    ia_explain:         10,
    ia_assistant:       10,
    canExam:            true,
    canSeeExplanations: false,
    canSeeThemeStats:   false,
    levels:             [1] as const,
  },
  pass: {
    // Pass Express (7j / 4,99€) ou Pass Sérénité (30j / 9,99€)
    quiz:               Infinity,
    scroll:             Infinity,
    exam:               Infinity,
    ia_explain:         Infinity,
    ia_assistant:       Infinity,
    canExam:            true,
    canSeeExplanations: true,
    canSeeThemeStats:   true,
    levels:             [1, 2, 3] as const,
  },
  premium: {
    // Rôles premium / elite / moderator / admin / super_admin
    quiz:               Infinity,
    scroll:             Infinity,
    exam:               Infinity,
    ia_explain:         Infinity,
    ia_assistant:       Infinity,
    canExam:            true,
    canSeeExplanations: true,
    canSeeThemeStats:   true,
    levels:             [1, 2, 3] as const,
  },
} as const satisfies Record<AccessMode, AccessQuota>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Détermine le mode effectif à partir du rôle DB et de la présence d'un pass actif.
 * Utilisé en fallback synchrone avant que la RPC get_access_level() réponde.
 */
export function roleToMode(role: UserRole | string, hasActivePass: boolean): AccessMode {
  if (hasActivePass) return 'pass';
  if (['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(role)) return 'premium';
  if (role === 'freemium') return 'freemium';
  return 'anonymous';
}

/**
 * Retourne le quota pour un rôle DB donné (sans information de pass).
 * Équivalent de l'ancien ROLE_LIMITS[role] — à utiliser pour la migration
 * des composants qui n'ont pas encore adopté useAccessLevel().
 */
export function getAccessQuota(role: UserRole | string): AccessQuota {
  return ACCESS_QUOTAS[roleToMode(role, false)];
}

/**
 * Vérifie si la recharge des crédits quiz est disponible.
 * Recharge = date_epuisement + 30 jours écoulés.
 *
 * @param date_epuisement — ISO string ou null (null = crédits non épuisés)
 */
export function isRechargeAvailable(date_epuisement: string | null): boolean {
  if (!date_epuisement) return false;
  const rechargeAt = new Date(date_epuisement);
  rechargeAt.setDate(rechargeAt.getDate() + 30);
  return new Date() >= rechargeAt;
}

/**
 * Formate la date de recharge pour affichage UI.
 * Ex : "recharge le 24 juin"
 */
export function formatRechargeDate(date_epuisement: string | null): string | null {
  if (!date_epuisement) return null;
  const rechargeAt = new Date(date_epuisement);
  rechargeAt.setDate(rechargeAt.getDate() + 30);
  return rechargeAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}
