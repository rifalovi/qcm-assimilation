export * from "./types";

import type { Question } from "./types";
import { VALEURS_L1, VALEURS_L2, VALEURS_L3 } from "./valeurs";
import { INSTITUTIONS_L1, INSTITUTIONS_L2, INSTITUTIONS_L3 } from "./institutions";
import { HISTOIRE_L1, HISTOIRE_L3 } from "./histoire";
import { SOCIETE_L1, SOCIETE_L2, SOCIETE_L3 } from "./societe";

export const QUESTIONS: Question[] = [
  ...VALEURS_L1,
  ...VALEURS_L2,
  ...VALEURS_L3,

  ...INSTITUTIONS_L1,
  ...INSTITUTIONS_L2,
  ...INSTITUTIONS_L3,

  ...HISTOIRE_L1,
  ...HISTOIRE_L3,

  ...SOCIETE_L1,
  ...SOCIETE_L2,
  ...SOCIETE_L3,
];