"use client";

import { useState } from "react";
import { useUser } from "./UserContext";
import AiPaywall from "./AiPaywall";

type ExplanationData = {
  simple_explanation: string;
  why_wrong: string;
  example: string;
  trap: string;
  remember: string;
};

interface Props {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  choices: { key: string; label: string }[];
  theme: string;
}

export default function AiExplanationCard({
  questionId, question, userAnswer, correctAnswer, explanation, choices, theme,
}: Props) {
  const { role } = useUser();
  const [data, setData] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  async function fetchExplanation() {
    setLoading(true);
    setError(null);
    setShowPaywall(false);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "explain",
          questionId,
          question,
          userAnswer,
          correctAnswer,
          explanation,
          choices,
          theme,
        }),
      });

      if (res.status === 429) {
        const body = await res.json();
        setShowPaywall(true);
        setError(`Quota atteint : ${body.used}/${body.quota}`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Erreur lors de la génération de l'explication");
        setLoading(false);
        return;
      }

      const json = await res.json();
      setData(json.data as ExplanationData);
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  if (showPaywall) {
    return <AiPaywall mode="explain" />;
  }

  if (!data && !loading) {
    return (
      <button
        onClick={fetchExplanation}
        className="mt-3 flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20"
      >
        <span>🤖</span>
        Explication IA détaillée
      </button>
    );
  }

  if (loading) {
    return (
      <div className="mt-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
          <span className="text-sm text-violet-200">Analyse en cours...</span>
        </div>
      </div>
    );
  }

  if (error && !showPaywall) {
    return (
      <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-3 rounded-2xl border border-violet-400/20 bg-gradient-to-b from-violet-500/10 to-violet-900/10 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <span className="text-sm font-bold text-violet-200">Explication IA</span>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">Explication simple</p>
        <p className="text-sm text-slate-200 leading-relaxed">{data.simple_explanation}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs font-bold text-red-300 uppercase tracking-wider mb-1">Pourquoi c'est faux</p>
        <p className="text-sm text-slate-200 leading-relaxed">{data.why_wrong}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">Exemple concret</p>
        <p className="text-sm text-slate-200 leading-relaxed">{data.example}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Piège à éviter</p>
        <p className="text-sm text-slate-200 leading-relaxed">{data.trap}</p>
      </div>

      <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3">
        <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">À retenir</p>
        <p className="text-sm font-semibold text-white leading-relaxed">{data.remember}</p>
      </div>
    </div>
  );
}
