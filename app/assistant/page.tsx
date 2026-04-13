"use client";

import { useState } from "react";
import { useUser } from "../components/UserContext";
import AiPaywall from "../components/AiPaywall";
import Link from "next/link";

const CATEGORIES = [
  {
    id: "deposer",
    icon: "📝",
    label: "Déposer une demande",
    description: "Comment constituer et déposer un dossier",
    color: "border-blue-400/20 bg-blue-500/10 text-blue-200",
  },
  {
    id: "suivre",
    icon: "📊",
    label: "Suivre mon dossier",
    description: "Vérifier l'état d'avancement de votre demande",
    color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  },
  {
    id: "entretien",
    icon: "🎤",
    label: "Préparer l'entretien",
    description: "Conseils pour l'entretien de naturalisation",
    color: "border-violet-400/20 bg-violet-500/10 text-violet-200",
  },
  {
    id: "courrier",
    icon: "📬",
    label: "Comprendre un courrier",
    description: "Décrypter une lettre de la préfecture",
    color: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  },
  {
    id: "examen",
    icon: "📋",
    label: "Question sur l'examen civique",
    description: "Informations sur l'épreuve et les modalités",
    color: "border-sky-400/20 bg-sky-500/10 text-sky-200",
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

      if (res.status === 429) {
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      if (res.status === 401) {
        setError("Vous devez être connecté pour utiliser l'assistant.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Erreur lors de la génération de la réponse");
        setLoading(false);
        return;
      }

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
      {/* Header */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)]">
        <div className="flex h-1.5 w-full">
          <div className="flex-1 bg-blue-600" /><div className="flex-1 bg-white" /><div className="flex-1 bg-red-600" />
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🤖</span>
            <div>
              <h1 className="text-xl font-extrabold text-white sm:text-2xl">Assistant démarches</h1>
              <p className="text-sm text-slate-400">Posez vos questions sur les démarches administratives</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sélection catégorie */}
      {!selectedCategory ? (
        <section className="space-y-3">
          <p className="text-sm font-semibold text-slate-300">Choisissez une catégorie :</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${cat.color}`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white">{cat.label}</p>
                  <p className="mt-0.5 text-xs opacity-80">{cat.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* Catégorie sélectionnée + formulaire */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CATEGORIES.find(c => c.id === selectedCategory)?.icon}</span>
                <span className="text-sm font-bold text-white">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </span>
              </div>
              <button
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white"
              >
                Changer de catégorie
              </button>
            </div>

            {/* Alerte hors-sujet */}
            {offTopicMsg && (
              <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-xs text-red-300">!</span>
                <div>
                  <p className="text-sm font-semibold text-red-200">Question hors-sujet</p>
                  <p className="mt-0.5 text-xs text-red-300/80 leading-relaxed">
                    L'assistant est spécialisé dans les démarches administratives en France. Posez une question liée à la naturalisation, l'examen civique, le titre de séjour ou toute autre démarche.
                  </p>
                </div>
                <button onClick={() => setOffTopicMsg(false)} className="shrink-0 text-red-400/60 hover:text-red-300 text-xs">✕</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={question}
                onChange={(e) => { setQuestion(e.target.value); setOffTopicMsg(false); }}
                placeholder="Décrivez votre situation ou posez votre question..."
                className="w-full min-h-[72px] max-h-[200px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400/30"
                style={{ resize: 'vertical' }}
                disabled={loading}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {!isAuthenticated ? '3 questions/jour' : role === 'freemium' ? '10 questions/jour' : 'Illimité'}
                </p>
                <button
                  type="submit"
                  disabled={!question.trim() || loading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? "Analyse..." : "Envoyer"}
                </button>
              </div>
            </form>
          </section>

          {/* Loading */}
          {loading && (
            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
              <div className="flex items-center justify-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                <span className="text-sm text-blue-200">Analyse de votre question...</span>
              </div>
            </div>
          )}

          {/* Paywall */}
          {showPaywall && <AiPaywall mode="assistant" />}

          {showSignupCta && (
            <div className="rounded-2xl border border-blue-400/20 bg-gradient-to-b from-blue-500/10 to-blue-900/10 p-5 text-center">
              <p className="text-lg font-bold text-white mb-2">Vos 3 questions gratuites sont utilisées</p>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Créez un compte gratuit pour poser jusqu'à 10 questions par jour et accéder à toutes les catégories.
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <a href="/register" className="block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
                  Créer un compte gratuit
                </a>
                <a href="/login" className="block rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs text-slate-400 transition hover:text-white">
                  J'ai déjà un compte
                </a>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Résultat */}
          {data && (
            <section className="rounded-[1.6rem] border border-blue-400/20 bg-gradient-to-b from-blue-500/10 to-blue-900/10 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🤖</span>
                <span className="text-base font-bold text-blue-200">Réponse de l'assistant</span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">Résumé</p>
                <p className="text-sm text-slate-200 leading-relaxed text-justify">{data.summary}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">Ce que ça signifie</p>
                <p className="text-sm text-slate-200 leading-relaxed text-justify">{data.what_it_means}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">Ce qu'il faut faire</p>
                <p className="text-sm text-slate-200 leading-relaxed text-justify">{data.what_to_do}</p>
              </div>

              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Points de vigilance</p>
                <p className="text-sm text-amber-100 leading-relaxed text-justify">{data.watch_out}</p>
              </div>

              {data.official_links && data.official_links.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Liens officiels</p>
                  <div className="space-y-1.5">
                    {data.official_links.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-300 hover:text-blue-200 transition truncate"
                      >
                        {link} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Mention obligatoire */}
              <div className="rounded-xl border border-slate-500/20 bg-slate-800/50 p-3 text-center">
                <p className="text-xs text-slate-400">
                  Réponse indicative — vérifiez toujours sur{" "}
                  <a href="https://www.service-public.fr" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                    service-public.fr
                  </a>
                </p>
              </div>

              {/* Nouvelle question */}
              <button
                onClick={() => { setData(null); setQuestion(""); }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Poser une autre question
              </button>
            </section>
          )}
        </>
      )}

      {/* Historique de la session */}
      {history.length > 1 && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Historique de la session</p>
          <div className="space-y-2">
            {history.slice(1).map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition"
                onClick={() => { setSelectedCategory(h.category); setQuestion(h.question); setData(h.data); }}
              >
                <span className="text-sm">{CATEGORIES.find(c => c.id === h.category)?.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{h.question}</p>
                  <p className="text-xs text-slate-400 truncate">{h.data.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
