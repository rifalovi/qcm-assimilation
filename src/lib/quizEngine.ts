import { QUESTIONS, Question, Theme, Level, ChoiceKey } from "../data/questions";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateQuiz(params: { level: Level; themes: Theme[]; count: number }): Question[] {
  const pool = QUESTIONS.filter((q) => q.level === params.level && params.themes.includes(q.theme));
  if (pool.length < params.count) {
    throw new Error(`Banque insuffisante: ${pool.length} dispo, ${params.count} demandées.`);
  }
  return shuffle(pool).slice(0, params.count);
}

export function scoreQuiz(args: { questions: Question[]; answers: Record<string, ChoiceKey | null> }) {
  let correct = 0;

  const details = args.questions.map((q: Question) => {
    const user = args.answers[q.id] ?? null;
    const ok = user === q.answer;
    if (ok) correct++;

    return {
      id: q.id,
      theme: q.theme,
      question: q.question,
      user,
      correct: q.answer,
      ok,
      explanation: q.explanation,
      choices: q.choices,
    };
  });

  return { correct, total: args.questions.length, details };
}
export function computeAdvancedStats(
  questions: Question[],
  answers: Record<string, ChoiceKey>
) {
  const themeStats: Record<string, { correct: number; total: number }> = {};
  const errors: Record<string, number> = {};

  for (const q of questions) {
    if (!themeStats[q.theme]) {
      themeStats[q.theme] = { correct: 0, total: 0 };
    }

    themeStats[q.theme].total++;

    if (answers[q.id] === q.answer) {
      themeStats[q.theme].correct++;
    } else {
      errors[q.id] = (errors[q.id] || 0) + 1;
    }
  }

  return { themeStats, errors };
}
export function computeExpertScore(score: number, level: number) {
  const multiplier = level === 3 ? 1.4 : level === 2 ? 1.2 : 1;
  return Math.round(score * multiplier);
}
export function getRank(percent: number) {
  if (percent >= 90) return "🏆 Expert Naturalisation";
  if (percent >= 75) return "🥇 Très bon niveau";
  if (percent >= 60) return "🥈 Niveau correct";
  if (percent >= 50) return "🥉 Niveau fragile";
  return "⚠️ Insuffisant";
}