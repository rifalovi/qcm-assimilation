"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadLeaderboard } from "../../src/lib/saveResult";
import Button from "../../components/Button";

type Entry = {
  pseudo: string;
  email: string;
  score_correct: number;
  score_total: number;
  score_percent: number;
  passed: boolean;
  level: number;
  created_at: string;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"train" | "exam">("exam");
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadLeaderboard(mode).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [mode]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-white to-red-600" />
        <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">
              République Française
            </div>
            <h1 className="text-lg font-extrabold mt-0.5">
              🏆 Classement général
            </h1>
          </div>
          <Button variant="secondary" onClick={() => router.push("/")}>
            Retour accueil
          </Button>
        </div>
      </div>

      {/* Toggle mode */}
      <div className="flex gap-2">
        {(["exam", "train"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
              mode === m
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            {m === "exam" ? "Examen blanc" : "Entraînement"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-500 text-sm">Chargement…</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-slate-500 text-sm">
            Aucun résultat validé pour le moment.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-slate-500 font-medium">#</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Pseudo</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Score</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Niveau</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e, i) => (
                <tr
                  key={`${e.email}-${i}`}
                  className="border-b border-slate-50 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-3 font-bold">
                    {MEDALS[i] ?? `#${i + 1}`}
                  </td>
                  <td className="px-4 py-3 font-semibold">{e.pseudo}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-blue-700">
                      {e.score_correct}/{e.score_total}
                    </span>{" "}
                    <span className="text-slate-400">({e.score_percent}%)</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    Niveau {e.level}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                  {new Date(e.created_at).toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}