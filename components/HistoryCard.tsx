"use client";

type HistoryEntry = {
  id: string;
  score_correct: number;
  score_total: number;
  score_percent: number;
  passed: boolean;
  level: number;
  themes: string[];
  created_at: string;
};

type Props = {
  entries: HistoryEntry[];
  mode: "train" | "exam";
};

export default function HistoryCard({ entries, mode }: Props) {
  if (!entries.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        Historique — {mode === "exam" ? "Examen blanc" : "Entraînement"}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tes 5 derniers tests</p>

      <div className="mt-4 space-y-3">
        {entries.map((e, i) => (
          <div key={e.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 dark:text-slate-500 w-4">#{i + 1}</span>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {e.score_correct}/{e.score_total}{" "}
                  <span className="text-slate-500 dark:text-slate-400">({e.score_percent}%)</span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  Niveau {e.level} •{" "}
                  {new Date(e.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
              e.passed
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
            }`}>
              {e.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
