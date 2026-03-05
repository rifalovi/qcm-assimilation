"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

type Entry = {
  score_percent: number;
  score_correct: number;
  score_total: number;
  passed: boolean;
  created_at: string;
};

type Props = { entries: Entry[] };

// Détecte le dark mode côté client
function isDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function ProgressionChart({ entries }: Props) {
  const dark = isDark();

  // Couleurs adaptées au mode
  const gridColor   = dark ? "#334155" : "#f1f5f9";
  const tickColor   = dark ? "#64748b" : "#94a3b8";
  const tooltipBg   = dark ? "#1e293b" : "#ffffff";
  const tooltipBorder = dark ? "#334155" : "#e2e8f0";
  const tooltipText = dark ? "#f1f5f9" : "#0f172a";

  if (entries.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Progression</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Fais au moins 2 tests pour voir ta progression.
        </p>
      </div>
    );
  }

  const data = [...entries].reverse().map((e, i) => ({
    name: `#${i + 1}`,
    score: e.score_percent,
    date: new Date(e.created_at).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short",
    }),
  }));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Progression</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Évolution de ton score sur tes derniers tests
      </p>

      <div className="mt-6" style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
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
                borderRadius: "12px",
                border: `1px solid ${tooltipBorder}`,
                backgroundColor: tooltipBg,
                color: tooltipText,
                fontSize: "12px",
              }}
            />
            <ReferenceLine
              y={80}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{
                value: "Seuil validation",
                position: "insideTopRight",
                fontSize: 11,
                fill: "#22c55e",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ fill: "#2563eb", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
