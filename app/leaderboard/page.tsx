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
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-600" />
          </div>

          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative p-5 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-slate-400">
                  République Française
                </div>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  🏆 Classement général
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                  Compare les meilleurs scores enregistrés en mode examen blanc
                  ou en mode entraînement.
                </p>
              </div>

              <Button variant="secondary" onClick={() => router.push("/")}>
                Retour accueil
              </Button>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          {(["exam", "train"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                mode === m
                  ? "border-blue-400/30 bg-blue-500/15 text-blue-200 shadow-[0_10px_30px_rgba(37,99,235,0.12)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              {m === "exam" ? "Examen blanc" : "Entraînement"}
            </button>
          ))}
        </section>

        <section className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 shadow-[0_18px_45px_rgba(2,8,23,0.28)]">
          {loading ? (
            <div className="p-6 text-sm text-slate-300">Chargement…</div>
          ) : data.length === 0 ? (
            <div className="p-6 text-sm text-slate-300">
              Aucun résultat validé pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-4 text-left font-medium text-slate-400">#</th>
                    <th className="px-4 py-4 text-left font-medium text-slate-400">Pseudo</th>
                    <th className="px-4 py-4 text-left font-medium text-slate-400">Score</th>
                    <th className="px-4 py-4 text-left font-medium text-slate-400">Statut</th>
                    <th className="px-4 py-4 text-left font-medium text-slate-400">Niveau</th>
                    <th className="px-4 py-4 text-left font-medium text-slate-400">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((e, i) => (
                    <tr
                      key={`${e.email}-${i}`}
                      className="border-b border-white/5 transition hover:bg-white/[0.04]"
                    >
                      <td className="px-4 py-4 font-bold text-white">
                        {MEDALS[i] ?? `#${i + 1}`}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">{e.pseudo}</div>
                        <div className="text-xs text-slate-500">{e.email}</div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold text-blue-300">
                          {e.score_correct}/{e.score_total}
                        </span>{" "}
                        <span className="text-slate-400">({e.score_percent}%)</span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            e.passed
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                              : "border-red-400/20 bg-red-500/10 text-red-200"
                          }`}
                        >
                          {e.passed ? "Validé" : "Non validé"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-300">Niveau {e.level}</td>

                      <td className="px-4 py-4 text-slate-400">
                        {new Date(e.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        ·{" "}
                        {new Date(e.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}