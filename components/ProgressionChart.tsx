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

type Props = {
  entries: Entry[];
};

export default function ProgressionChart({ entries }: Props) {
  if (entries.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Progression</h2>
        <p className="mt-2 text-sm text-slate-500">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">Progression</h2>
      <p className="mt-1 text-sm text-slate-500">
        Évolution de ton score sur tes derniers tests
      </p>

      <div className="mt-6" style={{ width: "100%", height: 200 }}>
  <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
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
    border: "1px solid #e2e8f0",
    fontSize: "12px",
  }}
/>
            {/* Ligne de validation à 80% (32/40) */}
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