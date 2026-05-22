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
        <section className="relative overflow-hidden rounded-[2rem] border shadow-lg" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
          {/* Drapeau français */}
          <div className="flex h-1.5 w-full">
            <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
            <div className="flex-1 bg-white" />
            <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
          </div>

          <div className="relative p-5 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[11px] uppercase tracking-widest" style={{ color: "var(--cc-text-disabled)" }}>
                  République Française
                </div>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--cc-text)" }}>
                  🏆 Classement général
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7" style={{ color: "var(--cc-text-muted)" }}>
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
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={mode === m
                ? { borderColor: "var(--cc-primary)", background: "var(--cc-primary-soft)", color: "var(--cc-primary)" }
                : { borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }
              }
            >
              {m === "exam" ? "Examen blanc" : "Entraînement"}
            </button>
          ))}
        </section>

        <section className="overflow-hidden rounded-[1.8rem] border shadow-md" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
          {loading ? (
            <div className="p-6 text-sm" style={{ color: "var(--cc-text-muted)" }}>Chargement…</div>
          ) : data.length === 0 ? (
            <div className="p-6 text-sm" style={{ color: "var(--cc-text-muted)" }}>
              Aucun résultat validé pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
                    <th className="px-4 py-4 text-left font-medium" style={{ color: "var(--cc-text-muted)" }}>#</th>
                    <th className="px-4 py-4 text-left font-medium" style={{ color: "var(--cc-text-muted)" }}>Pseudo</th>
                    <th className="px-4 py-4 text-left font-medium" style={{ color: "var(--cc-text-muted)" }}>Score</th>
                    <th className="px-4 py-4 text-left font-medium" style={{ color: "var(--cc-text-muted)" }}>Statut</th>
                    <th className="px-4 py-4 text-left font-medium" style={{ color: "var(--cc-text-muted)" }}>Niveau</th>
                    <th className="px-4 py-4 text-left font-medium" style={{ color: "var(--cc-text-muted)" }}>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((e, i) => (
                    <tr
                      key={`${e.email}-${i}`}
                      className="border-b transition"
                      style={{ borderColor: "var(--cc-border)" }}
                    >
                      <td className="px-4 py-4 font-bold" style={{ color: "var(--cc-text)" }}>
                        {MEDALS[i] ?? `#${i + 1}`}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-semibold" style={{ color: "var(--cc-text)" }}>{e.pseudo}</div>
                        <div className="text-xs" style={{ color: "var(--cc-text-disabled)" }}>{e.email}</div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold" style={{ color: "var(--cc-primary)" }}>
                          {e.score_correct}/{e.score_total}
                        </span>{" "}
                        <span style={{ color: "var(--cc-text-muted)" }}>({e.score_percent}%)</span>
                      </td>

                      <td className="px-4 py-4">
                        <span className={e.passed ? "cc-badge cc-badge-success" : "cc-badge cc-badge-danger"}>
                          {e.passed ? "Validé" : "Non validé"}
                        </span>
                      </td>

                      <td className="px-4 py-4" style={{ color: "var(--cc-text-muted)" }}>Niveau {e.level}</td>

                      <td className="px-4 py-4" style={{ color: "var(--cc-text-disabled)" }}>
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
