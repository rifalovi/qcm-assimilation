"use client";

import type { Theme } from "@/data/questions";

type ThemeStats = Record<Theme, { correct: number; total: number }>;

// Couleur d'accent selon le score — alignée sur les tokens de thème (clair/sombre).
function getTone(percent: number): string {
  if (percent >= 75) return "var(--cc-success)";
  if (percent >= 50) return "var(--cc-warning)";
  return "var(--cc-danger)";
}

export default function StatsDashboard({ themeStats }: { themeStats: ThemeStats }) {
  return (
    <div className="grid gap-4">
      {Object.entries(themeStats).map(([theme, data]) => {
        const percent = data.total ? Math.round((data.correct / data.total) * 100) : 0;
        const tone = getTone(percent);

        return (
          <div
            key={theme}
            className="rounded-[1.6rem] border p-5 transition-colors duration-300"
            style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold" style={{ color: "var(--cc-text)" }}>
                {theme}
              </h3>
              <span
                className="rounded-full border px-2.5 py-1 text-sm font-bold"
                style={{
                  borderColor: `color-mix(in srgb, ${tone} 30%, transparent)`,
                  background: `color-mix(in srgb, ${tone} 12%, var(--cc-surface))`,
                  color: tone,
                }}
              >
                {percent}%
              </span>
            </div>

            <div
              className="h-3 w-full overflow-hidden rounded-full"
              style={{ background: "var(--cc-border)" }}
            >
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${percent}%`, background: tone }}
              />
            </div>

            <div className="mt-3 text-sm font-medium" style={{ color: tone }}>
              {data.correct}/{data.total} bonnes réponses
            </div>
          </div>
        );
      })}
    </div>
  );
}
