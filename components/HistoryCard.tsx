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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">
        Historique — {mode === "exam" ? "Examen blanc" : "Entraînement"}
      </h2>
      <p className="mt-1 text-sm text-slate-500">Tes 5 derniers tests</p>

      <div className="mt-4 space-y-3">
        {entries.map((e, i) => (
          <div
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-4">#{i + 1}</span>
              <div>
                <div className="text-sm font-semibold">
                  {e.score_correct}/{e.score_total}{" "}
                  <span className="text-slate-500">({e.score_percent}%)</span>
                </div>
                <div className="text-xs text-slate-400">
                  Niveau {e.level} •{" "}
                  {new Date(e.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                e.passed
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {e.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}