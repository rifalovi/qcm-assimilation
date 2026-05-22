"use client";

import { useState } from "react";
import { useUser } from "../components/UserContext";
import AiPaywall from "../components/AiPaywall";

const CATEGORIES = [
  {
    id: "deposer",
    icon: "📝",
    label: "Déposer une demande",
    description: "Comment constituer et déposer un dossier",
  },
  {
    id: "suivre",
    icon: "📊",
    label: "Suivre mon dossier",
    description: "Vérifier l'état d'avancement de votre demande",
  },
  {
    id: "entretien",
    icon: "🎤",
    label: "Préparer l'entretien",
    description: "Conseils pour l'entretien de naturalisation",
  },
  {
    id: "courrier",
    icon: "📬",
    label: "Comprendre un courrier",
    description: "Décrypter une lettre de la préfecture",
  },
  {
    id: "examen",
    icon: "📋",
    label: "Question sur l'examen civique",
    description: "Informations sur l'épreuve et les modalités",
  },
];

type AssistantData = {
  summary: string;
  what_it_means: string;
  what_to_do: string;
  watch_out: string;
  official_links: string[];
};

export default function AssistantPage() {
  const { role, isAuthenticated } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [data, setData] = useState<AssistantData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSignupCta, setShowSignupCta] = useState(false);
  const [offTopicMsg, setOffTopicMsg] = useState(false);
  const [history, setHistory] = useState<Array<{ category: string; question: string; data: AssistantData }>>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !question.trim()) return;

    // Quota anonyme côté client
    if (!isAuthenticated) {
      const today = new Date().toDateString();
      const key = "ai_assistant_anon_usage";
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
    setOffTopicMsg(false);
    setData(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "assistant",
          category: CATEGORIES.find(c => c.id === selectedCategory)?.label ?? selectedCategory,
          userQuestion: question.trim(),
        }),
      });

      if (res.status === 429) { setShowPaywall(true); setLoading(false); return; }
      if (res.status === 401) { setError("Vous devez être connecté pour utiliser l'assistant."); setLoading(false); return; }
      if (!res.ok) { setError("Erreur lors de la génération de la réponse"); setLoading(false); return; }

      const json = await res.json();
      const result = json.data as AssistantData & { off_topic?: boolean };

      if (result.off_topic) {
        setOffTopicMsg(true);
        setQuestion("");
        setLoading(false);
        return;
      }

      setData(result);
      setHistory(prev => [{ category: selectedCategory, question, data: result }, ...prev]);
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedCategory(null);
    setQuestion("");
    setData(null);
    setError(null);
    setShowPaywall(false);
    setShowSignupCta(false);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">

      {/* ── Header ── */}
      <section
        className="overflow-hidden rounded-2xl border"
        style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)", boxShadow: "var(--cc-shadow)" }}
      >
        {/* Bande tricolore */}
        <div className="flex h-1">
          <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
          <div className="flex-1" style={{ background: "var(--cc-surface)" }} />
          <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl" style={{ color: "var(--cc-text)" }}>
                Assistant démarches
              </h1>
              <p className="text-sm" style={{ color: "var(--cc-text-muted)" }}>
                Posez vos questions sur les démarches administratives
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sélection catégorie ── */}
      {!selectedCategory ? (
        <section className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
            Choisissez une catégorie :
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex items-start gap-3 rounded-xl border p-4 text-left transition hover:-translate-y-0.5"
                style={{
                  background: "var(--cc-surface)",
                  borderColor: "var(--cc-border)",
                  boxShadow: "var(--cc-shadow-sm)",
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--cc-primary)")}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--cc-border)")}
              >
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>{cat.label}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--cc-text-muted)" }}>{cat.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* ── Catégorie sélectionnée + formulaire ── */}
          <section
            className="rounded-2xl border p-5"
            style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CATEGORIES.find(c => c.id === selectedCategory)?.icon}</span>
                <span className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>
                  {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </span>
              </div>
              <button
                onClick={resetForm}
                className="rounded-lg border px-3 py-1.5 text-xs transition"
                style={{
                  borderColor: "var(--cc-border)",
                  color: "var(--cc-text-muted)",
                  background: "var(--cc-surface-alt)",
                }}
              >
                Changer de catégorie
              </button>
            </div>

            {/* Alerte hors-sujet */}
            {offTopicMsg && (
              <div className="cc-notice cc-notice-danger mb-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--cc-danger)" }}>
                    Question hors-sujet
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
                    L'assistant est spécialisé dans les démarches administratives en France. Posez une question
                    liée à la naturalisation, l'examen civique, le titre de séjour ou toute autre démarche.
                  </p>
                </div>
                <button
                  onClick={() => setOffTopicMsg(false)}
                  className="shrink-0 text-xs"
                  style={{ color: "var(--cc-text-disabled)" }}
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={question}
                onChange={(e) => { setQuestion(e.target.value); setOffTopicMsg(false); }}
                placeholder="Décrivez votre situation ou posez votre question..."
                className="w-full min-h-[72px] max-h-[200px]"
                style={{ resize: "vertical" }}
                disabled={loading}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs" style={{ color: "var(--cc-text-disabled)" }}>
                  {!isAuthenticated ? "3 questions/jour" : role === "freemium" ? "10 questions/jour" : "Illimité"}
                </p>
                <button
                  type="submit"
                  disabled={!question.trim() || loading}
                  className="cc-btn cc-btn-primary"
                >
                  {loading ? "Analyse..." : "Envoyer →"}
                </button>
              </div>
            </form>
          </section>

          {/* ── Loading ── */}
          {loading && (
            <div
              className="rounded-2xl border p-5"
              style={{ background: "var(--cc-primary-soft)", borderColor: "var(--cc-primary)" }}
            >
              <div className="flex items-center justify-center gap-3">
                <div
                  className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: "var(--cc-primary)" }}
                />
                <span className="text-sm" style={{ color: "var(--cc-primary)" }}>
                  Analyse de votre question...
                </span>
              </div>
            </div>
          )}

          {/* ── Paywall ── */}
          {showPaywall && <AiPaywall mode="assistant" />}

          {/* ── CTA inscription ── */}
          {showSignupCta && (
            <div
              className="rounded-2xl border p-5 text-center"
              style={{ background: "var(--cc-primary-soft)", borderColor: "var(--cc-primary)" }}
            >
              <p className="text-lg font-bold mb-2" style={{ color: "var(--cc-text)" }}>
                Vos 3 questions gratuites sont utilisées
              </p>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
                Créez un compte gratuit pour poser jusqu'à 10 questions par jour et accéder à toutes les catégories.
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <a href="/register" className="cc-btn cc-btn-primary w-full justify-center">
                  Créer un compte gratuit
                </a>
                <a href="/login" className="cc-btn cc-btn-secondary w-full justify-center">
                  J'ai déjà un compte
                </a>
              </div>
            </div>
          )}

          {/* ── Erreur ── */}
          {error && (
            <div className="cc-notice cc-notice-danger">
              <p className="text-sm" style={{ color: "var(--cc-danger)" }}>{error}</p>
            </div>
          )}

          {/* ── Résultat ── */}
          {data && (
            <section
              className="rounded-2xl border p-5 space-y-4"
              style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)", boxShadow: "var(--cc-shadow)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🤖</span>
                <span className="text-base font-bold" style={{ color: "var(--cc-primary)" }}>
                  Réponse de l'assistant
                </span>
              </div>

              <div
                className="rounded-xl border p-4"
                style={{ background: "var(--cc-surface-alt)", borderColor: "var(--cc-border)" }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--cc-primary)" }}>
                  Résumé
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--cc-text)" }}>
                  {data.summary}
                </p>
              </div>

              <div
                className="rounded-xl border p-4"
                style={{ background: "var(--cc-surface-alt)", borderColor: "var(--cc-border)" }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--cc-info)" }}>
                  Ce que ça signifie
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--cc-text)" }}>
                  {data.what_it_means}
                </p>
              </div>

              <div
                className="rounded-xl border p-4"
                style={{ background: "var(--cc-success-soft)", borderColor: "var(--cc-success)" }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--cc-success)" }}>
                  Ce qu'il faut faire
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--cc-text)" }}>
                  {data.what_to_do}
                </p>
              </div>

              <div
                className="rounded-xl border p-4"
                style={{ background: "var(--cc-warning-soft)", borderColor: "var(--cc-warning)" }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--cc-warning)" }}>
                  Points de vigilance
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--cc-text)" }}>
                  {data.watch_out}
                </p>
              </div>

              {data.official_links && data.official_links.length > 0 && (
                <div
                  className="rounded-xl border p-4"
                  style={{ background: "var(--cc-surface-alt)", borderColor: "var(--cc-border)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--cc-info)" }}>
                    Liens officiels
                  </p>
                  <div className="space-y-1.5">
                    {data.official_links.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm truncate"
                        style={{ color: "var(--cc-primary)" }}
                      >
                        {link} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Mention obligatoire */}
              <div
                className="rounded-xl border p-3 text-center"
                style={{ background: "var(--cc-surface-alt)", borderColor: "var(--cc-border)" }}
              >
                <p className="text-xs" style={{ color: "var(--cc-text-muted)" }}>
                  Réponse indicative — vérifiez toujours sur{" "}
                  <a
                    href="https://www.service-public.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    service-public.fr
                  </a>
                </p>
              </div>

              {/* Nouvelle question */}
              <button
                onClick={() => { setData(null); setQuestion(""); }}
                className="cc-btn cc-btn-secondary w-full justify-center"
              >
                Poser une autre question
              </button>
            </section>
          )}
        </>
      )}

      {/* ── Historique de la session ── */}
      {history.length > 1 && (
        <section
          className="rounded-2xl border p-4"
          style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: "var(--cc-text-muted)" }}
          >
            Historique de la session
          </p>
          <div className="space-y-2">
            {history.slice(1).map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl border p-3 cursor-pointer transition"
                style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
                onClick={() => { setSelectedCategory(h.category); setQuestion(h.question); setData(h.data); }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--cc-primary)")}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--cc-border)")}
              >
                <span className="text-sm">{CATEGORIES.find(c => c.id === h.category)?.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--cc-text)" }}>
                    {h.question}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--cc-text-muted)" }}>
                    {h.data.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
