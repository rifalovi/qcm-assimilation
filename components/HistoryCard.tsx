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
    <div
      className="rounded-[1.8rem] border p-5 sm:p-6"
      style={{
        background: "var(--cc-surface)",
        borderColor: "var(--cc-border)",
        boxShadow: "var(--cc-shadow)",
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>
            Historique — {mode === "exam" ? "Examen blanc" : "Entraînement"}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>
            Tes 5 derniers tests
          </p>
        </div>

        <div
          className="rounded-full border px-3 py-1 text-xs font-semibold"
          style={{
            borderColor: "var(--cc-border)",
            background: "var(--cc-surface-alt)",
            color: "var(--cc-text-muted)",
          }}
        >
          {entries.length} résultat{entries.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {entries.map((e, i) => (
          <div
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition"
            style={{
              borderColor: "var(--cc-border)",
              background: "var(--cc-surface-alt)",
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="w-5 shrink-0 text-xs font-semibold"
                style={{ color: "var(--cc-text-disabled)" }}
              >
                #{i + 1}
              </span>

              <div className="min-w-0">
                <div className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
                  {e.score_correct}/{e.score_total}{" "}
                  <span style={{ color: "var(--cc-text-muted)" }}>({e.score_percent}%)</span>
                </div>

                <div className="truncate text-xs" style={{ color: "var(--cc-text-muted)" }}>
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
              className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={
                e.passed
                  ? {
                      borderColor: "color-mix(in srgb, var(--cc-success) 30%, transparent)",
                      background: "var(--cc-success-soft)",
                      color: "var(--cc-success)",
                    }
                  : {
                      borderColor: "color-mix(in srgb, var(--cc-danger) 30%, transparent)",
                      background: "var(--cc-danger-soft)",
                      color: "var(--cc-danger)",
                    }
              }
            >
              {e.passed ? "VALIDÉ" : "NON VALIDÉ"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
