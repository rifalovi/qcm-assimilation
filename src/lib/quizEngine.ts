import { QUESTIONS, Question, Theme, Level, ChoiceKey } from "../data/questions";

/**
 * Mélange un tableau avec l’algorithme de Fisher-Yates.
 * Retourne une nouvelle copie sans modifier le tableau d’origine.
 */
function shuffleArray<T>(items: T[]): T[] {
  const array = [...items];

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

/**
 * Génère un quiz aléatoire à partir du niveau, des thèmes et du nombre demandé.
 */
export function generateQuiz(params: {
  level: Level;
  themes: Theme[];
  count: number;
}): Question[] {
  const { level, themes, count } = params;

  const allPool = QUESTIONS.filter(
    (q) => q.level === level && themes.includes(q.theme)
  );

  if (allPool.length < count) {
    throw new Error(
      `Banque insuffisante : ${allPool.length} disponible(s), ${count} demandé(s).`
    );
  }

  const seen = getSeenIds();
  let pool = allPool.filter(q => !seen.has(q.id));
  if (pool.length < count) { resetSeenIds(); pool = [...allPool]; }
  return shuffleArray(pool).slice(0, count);
}

const SEEN_KEY = 'qcm_seen_ids';

function getSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveSeenIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

export function resetSeenIds() {
  if (typeof window !== 'undefined') localStorage.removeItem(SEEN_KEY);
}

export function markQuestionsAsSeen(ids: string[]) {
  const seen = getSeenIds();
  ids.forEach(id => seen.add(id));
  saveSeenIds(seen);
}


/**
 * Corrige le quiz et retourne le score détaillé.
 */
export function scoreQuiz(args: {
  questions: Question[];
  answers: Record<string, ChoiceKey | null>;
}) {
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

  return {
    correct,
    total: args.questions.length,
    details,
  };
}

/**
 * Calcule des statistiques avancées par thème + les erreurs par question.
 */
export function computeAdvancedStats(
  questions: Question[],
  answers: Record<string, ChoiceKey | null>
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

/**
 * Score expert pondéré selon le niveau.
 */
export function computeExpertScore(score: number, level: number) {
  const multiplier = level === 3 ? 1.4 : level === 2 ? 1.2 : 1;
  return Math.round(score * multiplier);
}

/**
 * Classement lisible pour l’utilisateur.
 */
export function getRank(percent: number) {
  if (percent >= 90) return "🏆 Excellent Niveau";
  if (percent >= 75) return "🥇 Très bon niveau";
  if (percent >= 60) return "🥈 Niveau correct";
  if (percent >= 50) return "🥉 Niveau fragile";
  return "⚠️ Insuffisant";
}