export type EligibilityGoal = "csp" | "cr" | "nat" | "unknown";
export type EligibilityStay = "lt1" | "1to3" | "3to5" | "gt5";

export type Theme = "Valeurs" | "Institutions" | "Histoire" | "Société";
export type Level = 1 | 2 | 3;

export type EligibilityRecommendation = {
  natEarlyWarning?: boolean;
  goal: Exclude<EligibilityGoal, "unknown">;
  title: string;
  shortLabel: string;
  description: string;
  confidenceText: string;
  themes: Theme[];
  recommendedLevel: Level;
  estimatedDuration: string;
  ctaLabel: string;
  badge: string;
  keyPoints: string[];
};

export const ELIGIBILITY_OPTIONS = [
  {
    value: "csp" as const,
    label: "Carte de séjour pluriannuelle",
    description: "Je souhaite stabiliser mon séjour en France.",
  },
  {
    value: "cr" as const,
    label: "Carte de résident (10 ans)",
    description: "Je suis durablement installé(e) en France.",
  },
  {
    value: "nat" as const,
    label: "Naturalisation",
    description: "Je souhaite devenir français(e).",
  },
  {
    value: "unknown" as const,
    label: "Je ne sais pas encore",
    description: "Aide-moi à choisir le bon parcours.",
  },
];

export const STAY_OPTIONS = [
  { value: "lt1" as const, label: "Moins d’1 an" },
  { value: "1to3" as const, label: "Entre 1 et 3 ans" },
  
];

export const RECOMMENDATIONS: Record<
  Exclude<EligibilityGoal, "unknown">,
  EligibilityRecommendation
> = {
  csp: {
    goal: "csp",
    title: "Tu prépares une carte de séjour pluriannuelle",
    shortLabel: "Parcours CSP",
    description:
      "Tu dois surtout maîtriser les bases utiles pour vivre en France au quotidien : valeurs de la République, repères civiques simples et vie en société.",
    confidenceText:
      "Ce parcours est adapté à une première stabilisation du séjour, avec une exigence centrée sur les fondamentaux.",
    themes: ["Valeurs", "Société"],
    recommendedLevel: 1,
    estimatedDuration: "3 à 5 jours",
    ctaLabel: "Commencer mon entraînement CSP",
    badge: "Bases essentielles",
    keyPoints: [
      "Valeurs de la République",
      "Vie en société",
      "Repères civiques simples",
    ],
  },
  cr: {
    goal: "cr",
    title: "Tu prépares une carte de résident",
    shortLabel: "Parcours CR",
    description:
      "Tu dois montrer une compréhension plus solide de la France : valeurs, institutions, histoire et droits/devoirs du quotidien.",
    confidenceText:
      "Ce parcours correspond à une intégration plus durable, avec un niveau intermédiaire attendu.",
    themes: ["Valeurs", "Institutions", "Histoire", "Société"],
    recommendedLevel: 2,
    estimatedDuration: "5 à 10 jours",
    ctaLabel: "Commencer mon entraînement CR",
    badge: "Intermédiaire solide",
    keyPoints: [
      "Valeurs approfondies",
      "Institutions",
      "Repères historiques",
      "Droits et devoirs",
    ],
  },
  nat: {
    goal: "nat",
    title: "Tu prépares la naturalisation",
    shortLabel: "Parcours Naturalisation",
    description:
      "Tu dois maîtriser en profondeur les valeurs, les institutions, l’histoire, les symboles et la culture civique française.",
    confidenceText:
      "Ce parcours vise l’assimilation la plus complète. Tous les thèmes comptent.",
    themes: ["Valeurs", "Institutions", "Histoire", "Société"],
    recommendedLevel: 3,
    estimatedDuration: "10 à 21 jours",
    ctaLabel: "Commencer mon entraînement Naturalisation",
    badge: "Maîtrise approfondie",
    keyPoints: [
      "Valeurs et principes",
      "Institutions détaillées",
      "Histoire et culture civique",
      "Préparation large et exigeante",
    ],
  },
};

export function getRecommendation(
  goal: EligibilityGoal,
  stay?: EligibilityStay
): EligibilityRecommendation | null {
  if (goal === "unknown") return null;

  const base = RECOMMENDATIONS[goal];

  if (!stay) return base;

  if (goal === "csp" && stay === "gt5") {
    return {
      ...base,
      confidenceText:
        "Même avec plusieurs années en France, ce parcours reste pertinent si ta démarche concerne la carte pluriannuelle.",
    };
  }

  if (goal === "cr" && stay === "lt1") {
    return {
      ...base,
      confidenceText:
        "La carte de résident concerne généralement une installation durable. Vérifie bien que cette démarche correspond à ta situation.",
    };
  }

  if (goal === "nat" && (stay === "lt1" || stay === "1to3")) {
    return {
      ...base,
      natEarlyWarning: true,
    } as EligibilityRecommendation & { natEarlyWarning: boolean };
  }

  return base;
}

export function buildQuizSettings(input: {
  level: Level;
  themes: Theme[];
  count: number;
}) {
  return {
    level: input.level,
    themes: input.themes,
    count: input.count,
    mode: "train" as const,
    perQuestion: 20,
  };
}