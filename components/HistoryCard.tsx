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
    <div className="rounded-[1.8rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)] sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">
            Historique — {mode === "exam" ? "Examen blanc" : "Entraînement"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">Tes 5 derniers tests</p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
          {entries.length} résultat{entries.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {entries.map((e, i) => (
          <div
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/[0.08]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-5 shrink-0 text-xs font-semibold text-slate-500">
                #{i + 1}
              </span>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">
                  {e.score_correct}/{e.score_total}{" "}
                  <span className="text-slate-400">({e.score_percent}%)</span>
                </div>

                <div className="truncate text-xs text-slate-400">
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
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                e.passed
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                  : "border-red-400/20 bg-red-500/10 text-red-200"
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