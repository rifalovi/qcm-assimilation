"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
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
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold transition hover:opacity-90"
        style={{
          borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)",
          background: "color-mix(in srgb, var(--cc-primary) 8%, var(--cc-surface))",
          color: "var(--cc-primary)",
        }}
      >
        <Bot size={16} />
        Obtenir mon coaching IA personnalisé
      </button>
    );
  }

  if (loading) {
    return (
      <div
        className="mt-4 rounded-2xl border p-5"
        style={{
          borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)",
          background: "color-mix(in srgb, var(--cc-primary) 8%, var(--cc-surface))",
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--cc-primary)", borderTopColor: "transparent" }}
          />
          <span className="text-sm" style={{ color: "var(--cc-primary)" }}>
            Analyse de vos résultats…
          </span>
        </div>
      </div>
    );
  }

  if (error && !showPaywall) {
    return (
      <div
        className="mt-4 rounded-2xl border p-4 text-sm"
        style={{
          borderColor: "color-mix(in srgb, var(--cc-danger) 25%, transparent)",
          background: "color-mix(in srgb, var(--cc-danger) 8%, var(--cc-surface))",
          color: "var(--cc-danger)",
        }}
      >
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className="mt-4 rounded-[1.6rem] border p-5 space-y-4"
      style={{
        borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)",
        background: "color-mix(in srgb, var(--cc-primary) 6%, var(--cc-surface))",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Bot size={18} style={{ color: "var(--cc-primary)" }} />
        <span className="text-base font-bold" style={{ color: "var(--cc-primary)" }}>
          Coaching IA personnalisé
        </span>
      </div>

      {/* Diagnostic */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: "var(--cc-primary)" }}
        >
          Diagnostic
        </p>
        <p className="text-sm leading-relaxed text-justify" style={{ color: "var(--cc-text)" }}>
          {data.diagnosis}
        </p>
      </div>

      {/* Forces & Faiblesses */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: "color-mix(in srgb, var(--cc-success) 25%, transparent)",
            background: "color-mix(in srgb, var(--cc-success) 8%, var(--cc-surface))",
          }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider mb-1"
            style={{ color: "var(--cc-success)" }}
          >
            Point fort
          </p>
          <p className="text-sm leading-relaxed text-justify" style={{ color: "var(--cc-text)" }}>
            {data.strength}
          </p>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: "color-mix(in srgb, var(--cc-danger) 25%, transparent)",
            background: "color-mix(in srgb, var(--cc-danger) 8%, var(--cc-surface))",
          }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider mb-1"
            style={{ color: "var(--cc-danger)" }}
          >
            Point faible
          </p>
          <p className="text-sm leading-relaxed text-justify" style={{ color: "var(--cc-text)" }}>
            {data.weakness}
          </p>
        </div>
      </div>

      {/* Plan d'action */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--cc-warning)" }}
        >
          Plan d'action
        </p>
        <div className="space-y-2.5">
          {data.plan.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: "color-mix(in srgb, var(--cc-warning) 15%, var(--cc-surface))",
                  color: "var(--cc-warning)",
                }}
              >
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: "var(--cc-text)" }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
