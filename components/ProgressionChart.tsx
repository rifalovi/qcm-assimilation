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
  const gridColor = "rgba(148,163,184,0.14)";
  const tickColor = "#94a3b8";
  const tooltipBg = "#0f172a";
  const tooltipBorder = "rgba(148,163,184,0.18)";
  const tooltipText = "#f8fafc";

  if (entries.length < 2) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)] sm:p-6">
        <h2 className="text-lg font-bold text-white">Progression</h2>
        <p className="mt-2 text-sm text-slate-400">
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
    <div className="rounded-[1.8rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)] sm:p-6">
      <h2 className="text-lg font-bold text-white">Progression</h2>
      <p className="mt-1 text-sm text-slate-400">
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
                boxShadow: "0 18px 45px rgba(2,8,23,0.35)",
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
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6, fill: "#60a5fa" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}