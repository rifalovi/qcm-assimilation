export type Level = 1 | 2 | 3;
export type Theme = "Valeurs" | "Institutions" | "Histoire" | "Société";
export type ChoiceKey = "A" | "B" | "C" | "D";

export type Question = {
  id: string;
  level: Level;
  theme: Theme;
  question: string;
  choices: { key: ChoiceKey; label: string }[];
  answer: ChoiceKey;
  explanation: string;
};

export function makeQuestion(
  id: string,
  level: Level,
  theme: Theme,
  question: string,
  A: string,
  B: string,
  C: string,
  D: string,
  answer: ChoiceKey,
  explanation: string
): Question {
  return {
    id,
    level,
    theme,
    question,
    choices: [
      { key: "A", label: A },
      { key: "B", label: B },
      { key: "C", label: C },
      { key: "D", label: D },
    ],
    answer,
    explanation,
  };
}