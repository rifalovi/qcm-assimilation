"use client";

import type { Theme } from "@/data/questions";

type ThemeStats = Record<Theme, { correct: number; total: number }>;

function getBarStyle(percent: number) {
  if (percent >= 75) {
    return {
      bar: "linear-gradient(90deg, #22c55e, #4ade80)",
      text: "text-emerald-200",
      chip: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    };
  }
  if (percent >= 50) {
    return {
      bar: "linear-gradient(90deg, #f59e0b, #facc15)",
      text: "text-amber-200",
      chip: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    };
  }
  return {
    bar: "linear-gradient(90deg, #ef4444, #fb7185)",
    text: "text-red-200",
    chip: "border-red-400/20 bg-red-500/10 text-red-200",
  };
}

export default function StatsDashboard({ themeStats }: { themeStats: ThemeStats }) {
  return (
    <div className="grid gap-4">
      {Object.entries(themeStats).map(([theme, data]) => {
        const percent = data.total ? Math.round((data.correct / data.total) * 100) : 0;
        const style = getBarStyle(percent);

        return (
          <div
            key={theme}
            className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:bg-white/[0.07]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-white">{theme}</h3>
              <span className={`rounded-full border px-2.5 py-1 text-sm font-bold ${style.chip}`}>
                {percent}%
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${percent}%`,
                  background: style.bar,
                }}
              />
            </div>

            <div className={`mt-3 text-sm ${style.text}`}>
              {data.correct}/{data.total} bonnes réponses
            </div>
          </div>
        );
      })}
    </div>
  );
}