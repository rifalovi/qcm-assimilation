"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Check, Zap, Shield, Star } from "lucide-react";
import { useUser } from "../components/UserContext";
import { createClient } from "@/lib/supabase/client";
import PricingCard from "@/components/PricingCard";

// ─── Nouveau modèle tarifaire (validé) ────────────────────────────────────────
const PLANS = [
  {
    id: "decouverte",
    name: "Mode Découverte",
    tagline: "Commencer sans engagement",
    badge: undefined as string | undefined,
    price: "Offert",
    period: undefined as string | undefined,
    mention: undefined as string | undefined,
    highlighted: false,
    ctaLabel: "Commencer gratuitement",
    ctaAction: "decouverte",
    features: [
      { label: "20 questions par session (avec compte)", included: true  },
      { label: "Niveau 1 uniquement",               included: true  },
      { label: "Correction immédiate",              included: true  },
      { label: "Mode entraînement",                 included: true  },
      { label: "Examen blanc",                      included: false },
      { label: "Explications détaillées",           included: false },
      { label: "Coach IA personnalisé",             included: false },
      { label: "Bibliothèque audio",                included: false },
    ],
  },
  {
    id: "express",
    name: "Pass Express 7 jours",
    tagline: "Examen imminent",
    badge: "Accès immédiat",
    price: "4,99 €",
    period: "/ 7 jours",
    mention: "Idéal si votre entretien est dans moins de 2 semaines",
    highlighted: false,
    ctaLabel: "Choisir le Pass Express",
    ctaAction: "express",
    features: [
      { label: "Questions illimitées (niveaux 1–3)", included: true  },
      { label: "Examen blanc illimité",              included: true  },
      { label: "Explications détaillées par IA",    included: true  },
      { label: "Coach IA personnalisé",             included: true  },
      { label: "Bibliothèque audio complète",       included: true  },
      { label: "Mode fiches — révision par swipe",  included: true  },
      { label: "Accès communauté",                  included: false },
      { label: "Support prioritaire",               included: false },
    ],
  },
  {
    id: "serenite",
    name: "Pass Sérénité 30 jours",
    tagline: "La préparation complète",
    badge: "Recommandé",
    price: "9,99 €",
    period: "/ 30 jours",
    mention: "4× plus de temps pour 2× le prix — le meilleur rapport",
    highlighted: true,
    ctaLabel: "Choisir le Pass Sérénité",
    ctaAction: "serenite",
    features: [
      { label: "Questions illimitées (niveaux 1–3)", included: true  },
      { label: "Examen blanc illimité",              included: true  },
      { label: "Explications détaillées par IA",    included: true  },
      { label: "Coach IA personnalisé",             included: true  },
      { label: "Bibliothèque audio complète",       included: true  },
      { label: "Mode fiches — révision par swipe",  included: true  },
      { label: "Accès communauté",                  included: true  },
      { label: "Support prioritaire",               included: true  },
    ],
  },
] as const;

export default function PricingPage() {
  const router = useRouter();
  const { role } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function handleCTA(action: string) {
    if (action === "decouverte") {
      router.push(role === "anonymous" ? "/register" : "/");
      return;
    }

    setLoading(action);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/register?redirect=${action}`);
      setLoading(null);
      return;
    }

    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: action }),
    });
    const { url, error } = await res.json();
    if (error) { setLoading(null); return; }
    window.location.href = url;
  }

  return (
    <main
      className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12"
      style={{ color: "var(--cc-text)" }}
    >
      {/* ── Header ── */}
      <div
        className={`mb-10 text-center transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {/* Tricolore */}
        <div className="mx-auto mb-6 flex h-1.5 w-24 overflow-hidden rounded-full">
          <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
          <div className="flex-1" style={{ background: "var(--cc-surface)" }} />
          <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
        </div>

        <h1 className="text-2xl font-extrabold sm:text-3xl" style={{ color: "var(--cc-text)" }}>
          Choisissez votre{" "}
          <span style={{ color: "var(--cc-primary)" }}>pass de préparation</span>
        </h1>
        <p className="mt-3 text-sm max-w-sm mx-auto" style={{ color: "var(--cc-text-muted)" }}>
          Accès complet à toutes les fonctionnalités. Sans engagement, sans renouvellement automatique.
        </p>
      </div>

      {/* ── Grille 3 plans ── */}
      <div
        className={`grid gap-5 sm:grid-cols-3 transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
        style={{ transitionDelay: "120ms" }}
      >
        {PLANS.map((plan) => {
          const isLoading = loading === plan.ctaAction;
          return (
            <PricingCard
              key={plan.id}
              name={plan.name}
              tagline={plan.tagline}
              badge={plan.badge}
              price={plan.price}
              period={plan.period}
              mention={plan.mention}
              features={[...plan.features]}
              highlighted={plan.highlighted}
              ctaLabel={isLoading ? "Redirection…" : plan.ctaLabel}
              ctaDisabled={isLoading}
              onCta={() => handleCTA(plan.ctaAction)}
            />
          );
        })}
      </div>

      {/* ── Garanties ── */}
      <div
        className={`mt-8 grid gap-4 sm:grid-cols-3 transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
        style={{ transitionDelay: "240ms" }}
      >
        {[
          {
            icon: <Zap size={18} />,
            title: "Accès immédiat",
            desc: "Votre pass est activé dès le paiement. Aucun délai.",
          },
          {
            icon: <Shield size={18} />,
            title: "Sans renouvellement",
            desc: "Paiement unique. L'accès s'arrête proprement à la fin de la période.",
          },
          {
            icon: <Check size={18} />,
            title: "Paiement sécurisé",
            desc: "Stripe • 3D Secure • Aucune donnée bancaire stockée.",
          },
        ].map((g) => (
          <div
            key={g.title}
            className="flex items-start gap-3 rounded-2xl border p-4"
            style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}
          >
            <span
              className="mt-0.5 shrink-0"
              style={{ color: "var(--cc-success)" }}
            >
              {g.icon}
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
                {g.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
                {g.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Encart Découverte ── */}
      <div
        className={`mt-6 rounded-2xl border px-5 py-4 transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
        style={{
          borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)",
          background: "color-mix(in srgb, var(--cc-primary) 5%, var(--cc-surface))",
          transitionDelay: "320ms",
        }}
      >
        <div className="flex items-start gap-3">
          <Star size={16} className="mt-0.5 shrink-0" style={{ color: "var(--cc-primary)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
              Mode Découverte — toujours gratuit
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
              Sans compte : 10 questions de niveau 1 par session, correction immédiate.
              Avec un compte gratuit : 20 questions par session + sauvegarde de progression.
              Accès illimité dans le temps.
            </p>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div
        className={`mt-8 rounded-2xl border p-6 transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
        style={{
          borderColor: "var(--cc-border)",
          background: "var(--cc-surface)",
          transitionDelay: "400ms",
        }}
      >
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--cc-text)" }}>
          Questions fréquentes
        </h2>
        <div className="space-y-4 text-sm">
          {[
            {
              q: "Quelle est la différence entre les deux Pass ?",
              a: "Le Pass Express (7 jours) est fait pour les candidats dont l'entretien est imminent. Le Pass Sérénité (30 jours) offre 4× plus de temps pour 2× le prix — recommandé pour une préparation sereine et complète.",
            },
            {
              q: "Y a-t-il un renouvellement automatique ?",
              a: "Non. Les deux pass sont des paiements uniques. L'accès s'arrête proprement à la fin de la période, sans prélèvement surprise.",
            },
            {
              q: "30 jours suffisent-ils pour être prêt ?",
              a: "Oui — la grande majorité des candidats maîtrisent le programme en 3 à 6 semaines avec une pratique régulière. Le Pass Sérénité est largement suffisant.",
            },
            {
              q: "Puis-je commencer sans payer ?",
              a: "Oui. Le Mode Découverte est entièrement gratuit et sans limite dans le temps. Sans compte : 10 questions de niveau 1 par session. Avec un compte gratuit : 20 questions, correction immédiate et sauvegarde de progression.",
            },
            {
              q: "Comment fonctionne le paiement ?",
              a: "Paiement sécurisé via Stripe (3D Secure). Aucune donnée bancaire n'est stockée sur nos serveurs. Virement, Carte Bleue, Visa, Mastercard acceptés.",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="pb-4 last:pb-0"
              style={{ borderBottom: "1px solid var(--cc-border)" }}
            >
              <p className="font-semibold" style={{ color: "var(--cc-text)" }}>
                {item.q}
              </p>
              <p className="mt-1 leading-6" style={{ color: "var(--cc-text-muted)" }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => router.back()}
          className="text-sm transition hover:opacity-70"
          style={{ color: "var(--cc-text-muted)" }}
        >
          ← Retour
        </button>
      </div>
    </main>
  );
}
