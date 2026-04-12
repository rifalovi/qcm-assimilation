"use client";

import { useState } from "react";
import { useUser } from "./UserContext";
import AiPaywall from "./AiPaywall";

type CoachData = {
  diagnosis: string;
  strength: string;
  weakness: string;
  plan: string[];
};

interface Props {
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  strengths: string[];
  weaknesses: string[];
  theme?: string;
}

export default function AiCoachCard({
  scorePercent, correctCount, totalQuestions, strengths, weaknesses, theme,
}: Props) {
  const { role } = useUser();
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  async function fetchCoaching() {
    setLoading(true);
    setError(null);
    setShowPaywall(false);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "coach",
          scorePercent,
          correctCount,
          totalQuestions,
          strengths,
          weaknesses,
          theme,
        }),
      });

      if (res.status === 429) {
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Erreur lors de la génération du coaching");
        setLoading(false);
        return;
      }

      const json = await res.json();
      setData(json.data as CoachData);
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  if (showPaywall) {
    return <AiPaywall mode="coach" />;
  }

  if (!data && !loading) {
    return (
      <button
        onClick={fetchCoaching}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-3.5 text-sm font-bold text-sky-200 transition hover:bg-sky-500/20"
      >
        <span>🧠</span>
        Obtenir mon coaching IA personnalisé
      </button>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-5">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <span className="text-sm text-sky-200">Analyse de vos résultats...</span>
        </div>
      </div>
    );
  }

  if (error && !showPaywall) {
    return (
      <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-4 rounded-[1.6rem] border border-sky-400/20 bg-gradient-to-b from-sky-500/10 to-sky-900/10 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🧠</span>
        <span className="text-base font-bold text-sky-200">Coaching IA personnalisé</span>
      </div>

      {/* Diagnostic */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Diagnostic</p>
        <p className="text-sm text-slate-200 leading-relaxed">{data.diagnosis}</p>
      </div>

      {/* Forces & Faiblesses */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">Point fort</p>
          <p className="text-sm text-emerald-100 leading-relaxed">{data.strength}</p>
        </div>
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
          <p className="text-xs font-bold text-red-300 uppercase tracking-wider mb-1">Point faible</p>
          <p className="text-sm text-red-100 leading-relaxed">{data.weakness}</p>
        </div>
      </div>

      {/* Plan d'action */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Plan d'action</p>
        <div className="space-y-2.5">
          {data.plan.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-200">
                {i + 1}
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
