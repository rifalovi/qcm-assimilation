"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

type Entry = {
  score_percent: number;
  score_correct: number;
  score_total: number;
  passed: boolean;
  created_at: string;
};

type Props = { entries: Entry[] };

export default function ProgressionChart({ entries }: Props) {
  // Recharts requires concrete color strings — these reference CSS vars at runtime.
  const gridColor = "var(--cc-border)";
  const tickColor = "var(--cc-text-muted)";
  const tooltipBg = "var(--cc-surface)";
  const tooltipBorder = "var(--cc-border)";
  const tooltipText = "var(--cc-text)";
  const lineColor = "var(--cc-primary)";
  const successColor = "var(--cc-success)";

  if (entries.length < 2) {
    return (
      <div
        className="rounded-[1.8rem] border p-5 sm:p-6"
        style={{
          background: "var(--cc-surface)",
          borderColor: "var(--cc-border)",
          boxShadow: "var(--cc-shadow)",
        }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>
          Progression
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--cc-text-muted)" }}>
          Fais au moins 2 tests pour voir ta progression.
        </p>
      </div>
    );
  }

  const data = [...entries].reverse().map((e, i) => ({
    name: `#${i + 1}`,
    score: e.score_percent,
    date: new Date(e.created_at).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div
      className="rounded-[1.8rem] border p-5 sm:p-6"
      style={{
        background: "var(--cc-surface)",
        borderColor: "var(--cc-border)",
        boxShadow: "var(--cc-shadow)",
      }}
    >
      <h2 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>
        Progression
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>
        Évolution de ton score sur tes derniers tests
      </p>

      <div className="mt-6" style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Score"]}
              labelFormatter={(_label, payload) =>
                payload?.[0] ? (payload[0].payload as any).date : _label
              }
              contentStyle={{
                borderRadius: "14px",
                border: `1px solid ${tooltipBorder}`,
                backgroundColor: tooltipBg,
                color: tooltipText,
                fontSize: "12px",
                boxShadow: "var(--cc-shadow)",
              }}
            />
            <ReferenceLine
              y={80}
              stroke={successColor}
              strokeDasharray="4 4"
              label={{
                value: "Seuil validation",
                position: "insideTopRight",
                fontSize: 11,
                fill: successColor,
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke={lineColor}
              strokeWidth={3}
              dot={{ fill: lineColor, r: 4 }}
              activeDot={{ r: 6, fill: lineColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
