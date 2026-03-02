"use client";

import type { Theme } from "@/data/questions";

type ThemeStats = Record<Theme, { correct: number; total: number }>;

export default function StatsDashboard({ themeStats }: { themeStats: ThemeStats }) {
  return (
    <div className="grid gap-6">
      {Object.entries(themeStats).map(([theme, data]) => {
        const percent = data.total ? Math.round((data.correct / data.total) * 100) : 0;

        return (
          <div
            key={theme}
            className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-sm p-6 shadow-lg transition hover:shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{theme}</h3>
              <span className="text-base font-bold">{percent}%</span>
            </div>

            <div className="h-3 w-full rounded-full bg-slate-200">
              <div
                className={`h-3 rounded-full transition-all ${
                  percent >= 75 ? "bg-green-500" : percent >= 50 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-2 text-sm text-slate-600">
              {data.correct}/{data.total} bonnes réponses
            </div>
          </div>
        );
      })}
    </div>
  );
}