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

// Accent violet de l'explication IA (pas de token dédié) — lisible en thème clair et sombre.
const AI = "#7C3AED";

export default function AiExplanationCard({
  questionId, question, userAnswer, correctAnswer, explanation, choices, theme,
}: Props) {
  const { isAuthenticated } = useUser();
  const [data, setData] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSignupCta, setShowSignupCta] = useState(false);

  async function fetchExplanation() {
    // Quota anonyme côté client
    if (!isAuthenticated) {
      const today = new Date().toDateString();
      const key = "ai_explain_anon_usage";
      const raw = localStorage.getItem(key);
      let usage = { date: today, count: 0 };
      if (raw) { try { const p = JSON.parse(raw); if (p.date === today) usage = p; } catch {} }
      if (usage.count >= 3) { setShowSignupCta(true); return; }
      usage.count++;
      localStorage.setItem(key, JSON.stringify(usage));
    }

    setLoading(true);
    setError(null);
    setShowPaywall(false);
    setShowSignupCta(false);

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
        setShowPaywall(true);
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

  if (showSignupCta) {
    return (
      <div
        className="mt-3 rounded-2xl border p-4 text-center"
        style={{ borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)", background: "var(--cc-primary-soft)" }}
      >
        <p className="text-sm font-bold mb-1" style={{ color: "var(--cc-text)" }}>Vos 3 explications gratuites sont utilisées</p>
        <p className="text-xs mb-3" style={{ color: "var(--cc-text-muted)" }}>Créez un compte gratuit pour obtenir 10 explications IA (recharge tous les 30 jours).</p>
        <a
          href="/register"
          className="inline-block rounded-xl px-5 py-2 text-sm font-bold transition hover:opacity-90"
          style={{ background: "var(--cc-primary)", color: "#fff" }}
        >
          Créer un compte gratuit
        </a>
      </div>
    );
  }

  if (!data && !loading) {
    return (
      <button
        onClick={fetchExplanation}
        className="mt-3 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:opacity-80"
        style={{
          borderColor: `color-mix(in srgb, ${AI} 30%, transparent)`,
          background: `color-mix(in srgb, ${AI} 10%, var(--cc-surface))`,
          color: AI,
        }}
      >
        <span>🤖</span>
        Explication IA détaillée
      </button>
    );
  }

  if (loading) {
    return (
      <div
        className="mt-3 rounded-2xl border p-4"
        style={{ borderColor: `color-mix(in srgb, ${AI} 25%, transparent)`, background: `color-mix(in srgb, ${AI} 8%, var(--cc-surface))` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2"
            style={{ borderColor: AI, borderTopColor: "transparent" }}
          />
          <span className="text-sm font-medium" style={{ color: AI }}>Analyse en cours...</span>
        </div>
      </div>
    );
  }

  if (error && !showPaywall) {
    return (
      <div
        className="mt-3 rounded-2xl border p-4 text-sm"
        style={{ borderColor: "color-mix(in srgb, var(--cc-danger) 25%, transparent)", background: "var(--cc-danger-soft)", color: "var(--cc-danger)" }}
      >
        {error}
      </div>
    );
  }

  if (!data) return null;

  const block = (label: string, tone: string, text: string, emphasis = false) => (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: tone }}>{label}</p>
      <p
        className={`text-sm leading-relaxed text-justify${emphasis ? " font-semibold" : ""}`}
        style={{ color: "var(--cc-text)" }}
      >
        {text}
      </p>
    </div>
  );

  return (
    <div
      className="mt-3 rounded-2xl border p-4 space-y-3"
      style={{ borderColor: `color-mix(in srgb, ${AI} 25%, transparent)`, background: `color-mix(in srgb, ${AI} 7%, var(--cc-surface))` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <span className="text-sm font-bold" style={{ color: AI }}>Explication IA</span>
      </div>

      {block("Explication simple", "var(--cc-info)", data.simple_explanation)}
      {block("Pourquoi c'est faux", "var(--cc-danger)", data.why_wrong)}
      {block("Exemple concret", "var(--cc-success)", data.example)}
      {block("Piège à éviter", "var(--cc-warning)", data.trap)}

      <div
        className="rounded-xl border p-3"
        style={{ borderColor: `color-mix(in srgb, ${AI} 25%, transparent)`, background: `color-mix(in srgb, ${AI} 12%, var(--cc-surface))` }}
      >
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: AI }}>À retenir</p>
        <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--cc-text)" }}>{data.remember}</p>
      </div>
    </div>
  );
}
