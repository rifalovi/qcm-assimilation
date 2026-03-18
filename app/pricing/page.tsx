"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "../components/UserContext";
import { createClient } from "@/lib/supabase/client";

const PLANS = [
  {
    id: "anonymous",
    name: "Sans compte",
    price: "0€",
    period: "",
    description: "Découvrez l'application sans engagement",
    icon: "👤",
    color: "border-slate-400/20 bg-slate-500/10",
    badge: null,
    features: [
      { label: "10 questions par session", ok: true },
      { label: "Niveau 1 uniquement", ok: true },
      { label: "5 cartes Scroll par thème", ok: true },
      { label: "Examen blanc", ok: false },
      { label: "Historique des résultats", ok: false },
      { label: "Statistiques détaillées", ok: false },
      { label: "Tous les niveaux", ok: false },
    ],
    cta: "Continuer sans compte",
    ctaAction: "anonymous",
  },
  {
    id: "freemium",
    name: "Freemium",
    price: "0€",
    period: "",
    description: "Compte gratuit pour suivre ta progression",
    icon: "✨",
    color: "border-blue-400/20 bg-blue-500/10",
    badge: "Gratuit",
    features: [
      { label: "20 questions par session", ok: true },
      { label: "Niveau 1 uniquement", ok: true },
      { label: "10 cartes Scroll par thème", ok: true },
      { label: "Historique des résultats", ok: true },
      { label: "Examen blanc", ok: false },
      { label: "Statistiques détaillées", ok: false },
      { label: "Tous les niveaux", ok: false },
    ],
    cta: "Créer un compte gratuit",
    ctaAction: "register",
  },
  {
    id: "premium",
    name: "Premium",
    price: "9,99€",
    period: "/mois",
    description: "Accès complet pour maximiser tes chances",
    icon: "👑",
    color: "border-amber-400/30 bg-amber-500/10",
    badge: "Recommandé",
    features: [
      { label: "40 questions par session", ok: true },
      { label: "Tous les niveaux (1, 2, 3)", ok: true },
      { label: "280 cartes Scroll complètes", ok: true },
      { label: "Examen blanc illimité", ok: true },
      { label: "Historique complet", ok: true },
      { label: "Statistiques détaillées", ok: true },
      { label: "Support prioritaire", ok: true },
    ],
    cta: "Passer en Premium",
    ctaAction: "premium",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { role } = useUser();
  const [loading, setLoading] = useState(false);

  async function handleCTA(action: string) {
    if (action === "anonymous") {
      router.push("/");
    } else if (action === "register") {
      router.push("/register");
    } else if (action === "premium") {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Pas de compte → créer un compte puis payer
        router.push("/register?redirect=premium");
      } else {
        // A un compte → aller directement au checkout Stripe
        const res = await fetch("/api/create-checkout", { method: "POST" });
        const { url, error } = await res.json();
        if (error) { setLoading(false); return; }
        window.location.href = url;
      }
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex h-1.5 w-32 mx-auto mb-6 overflow-hidden rounded-full">
          <div className="flex-1 bg-blue-600"/>
          <div className="flex-1 bg-white"/>
          <div className="flex-1 bg-red-600"/>
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
          Abonnements & <span className="text-blue-400">Tarifs</span>
        </h1>
        <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
          Choisissez le plan adapté à votre préparation à l'examen civique français 2026.
        </p>
        {role !== "anonymous" && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
            Plan actuel : {role === "freemium" ? "✨ Freemium" : "👑 Premium"}
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="grid gap-5 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === role;
          const isRecommended = plan.badge === "Recommandé";
          return (
            <div
              key={plan.id}
              className={`relative rounded-[2rem] border p-6 transition ${plan.color} ${
                isRecommended ? "ring-2 ring-amber-400/30 shadow-[0_0_40px_rgba(251,191,36,0.1)]" : ""
              } ${isCurrent ? "ring-2 ring-blue-400/30" : ""}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold ${
                  isRecommended
                    ? "bg-amber-500 text-slate-950"
                    : "bg-blue-500 text-white"
                }`}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white">
                  Votre plan
                </div>
              )}

              {/* Header plan */}
              <div className="mb-5">
                <div className="text-3xl mb-2">{plan.icon}</div>
                <h2 className="text-lg font-extrabold text-white">{plan.name}</h2>
                <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-slate-400 mb-1">{plan.period}</span>}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    <span className={f.ok ? "text-emerald-400" : "text-slate-600"}>
                      {f.ok ? "✓" : "✗"}
                    </span>
                    <span className={f.ok ? "text-slate-200" : "text-slate-500"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCTA(plan.ctaAction)}
                disabled={isCurrent || loading}
                className={`w-full rounded-2xl py-3 text-sm font-bold transition ${
                  isCurrent
                    ? "border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed"
                    : isRecommended
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_8px_24px_rgba(251,191,36,0.25)]"
                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                {isCurrent ? "Plan actuel" : loading && plan.ctaAction === "premium" ? "Redirection..." : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ rapide */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-slate-800/60 p-6">
        <h2 className="text-base font-bold text-white mb-4">Questions fréquentes</h2>
        <div className="space-y-4 text-sm">
          {[
            {
              q: "Puis-je annuler mon abonnement Premium ?",
              a: "Oui, à tout moment depuis votre espace compte. L'accès Premium reste actif jusqu'à la fin de la période payée."
            },
            {
              q: "Puis-je passer directement en Premium sans compte gratuit ?",
              a: "Oui ! Cliquez sur 'Passer en Premium', créez votre compte et payez en une seule étape."
            },
            {
              q: "Mes données sont-elles sauvegardées si je passe de gratuit à Premium ?",
              a: "Oui, tout votre historique et vos résultats sont conservés lors du passage en Premium."
            },
          ].map((item) => (
            <div key={item.q} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
              <p className="font-semibold text-white">{item.q}</p>
              <p className="mt-1 text-slate-400">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Retour */}
      <div className="mt-6 text-center">
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-white transition"
        >
          ← Retour
        </button>
      </div>
    </main>
  );
}