"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "../components/UserContext";
import { createClient } from "@/lib/supabase/client";

// ─── Plans ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "anonymous",
    name: "Explorateur",
    price: "—",
    period: "",
    badge: null,
    badgeColor: "",
    description: "Découvrez sans engagement",
    icon: "🧭",
    accent: "border-slate-600/30 bg-slate-800/40",
    highlight: false,
    features: [
      { label: "10 questions par session",     ok: true  },
      { label: "Niveau 1 uniquement",          ok: true  },
      { label: "5 cartes Scroll par thème",    ok: true  },
      { label: "Bibliothèque audio",           ok: false },
      { label: "Examen blanc",                 ok: false },
      { label: "Historique & statistiques",    ok: false },
      { label: "Tous les niveaux",             ok: false },
      { label: "Contenu exclusif expert",      ok: false },
      { label: "Espace communauté",             ok: false },
    ],
    cta: "Continuer sans compte",
    ctaAction: "anonymous",
    ctaStyle: "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
  },
  {
    id: "freemium",
    name: "Freemium",
    price: "0€",
    period: "",
    badge: "Gratuit",
    badgeColor: "bg-slate-600 text-white",
    description: "Compte gratuit pour démarrer",
    icon: "✨",
    accent: "border-slate-500/30 bg-slate-800/60",
    highlight: false,
    features: [
      { label: "20 questions par session",          ok: true  },
      { label: "Niveau 1 uniquement",               ok: true  },
      { label: "10 cartes Scroll par thème",        ok: true  },
      { label: "2 épisodes audio gratuits / thème", ok: true  },
      { label: "Examen blanc (1 essai)",            ok: true  },
      { label: "Historique des résultats",          ok: true  },
      { label: "Statistiques détaillées",           ok: false },
      { label: "Contenu exclusif expert",           ok: false },
      { label: "Espace communauté Premium",         ok: false },
    ],
    cta: "Créer un compte gratuit",
    ctaAction: "register",
    ctaStyle: "border border-white/15 bg-white/8 text-slate-200 hover:bg-white/15",
  },
  {
    id: "premium",
    name: "Premium",
    price: "19,99€",
    period: "/3 mois",
    badge: "⭐ Recommandé",
    badgeColor: "bg-blue-600 text-white",
    description: "La préparation complète — durée idéale",
    icon: "🎯",
    accent: "border-blue-400/40 bg-gradient-to-b from-blue-900/40 to-slate-900/60",
    highlight: true,
    features: [
      { label: "40 questions par session",     ok: true },
      { label: "Tous les niveaux (1, 2, 3)",   ok: true },
      { label: "400 cartes Scroll complètes",  ok: true },
      { label: "100 épisodes audio complets",  ok: true },
      { label: "Examen blanc illimité",        ok: true },
      { label: "Historique complet",           ok: true },
      { label: "Statistiques détaillées",      ok: true },
      { label: "Contenu exclusif expert",      ok: false },
      { label: "Communauté (témoignages, forum, messages)", ok: true },
    ],
    cta: "Commencer ma préparation",
    ctaAction: "premium",
    ctaStyle: "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_8px_24px_rgba(37,99,235,0.4)]",
  },
  {
    id: "elite",
    name: "Élite",
    price: "49,99€",
    period: "accès à vie",
    badge: "👑 Accès à vie",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950",
    description: "Tout Premium + contenu exclusif expert",
    icon: "👑",
    accent: "border-amber-400/40 bg-gradient-to-b from-amber-900/20 to-slate-900/60",
    highlight: false,
    features: [
      { label: "Tout ce qu'inclut Premium",         ok: true, bold: true },
      { label: "Accès à vie — paiement unique",     ok: true, bold: true },
      { label: "Conseils d'experts en naturalisation", ok: true },
      { label: "Nouvelles questions en avant-première", ok: true },
      { label: "Mises à jour futures incluses",     ok: true },
      { label: "Badge profil exclusif Élite",       ok: true },
      { label: "Accès prioritaire nouvelles features", ok: true },
      { label: "Support prioritaire dédié",         ok: true },
      { label: "Communauté (témoignages, forum, messages)", ok: true, bold: true },
    ],
    cta: "Obtenir l'accès à vie",
    ctaAction: "elite",
    ctaStyle: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold hover:brightness-110 shadow-[0_8px_24px_rgba(245,158,11,0.35)]",
  },
];

// ─── Effet psychologique ───────────────────────────────────────────────────
// Principe de l'ancrage : le prix Élite à 49,99€ rend Premium à 19,99€
// très attractif (effet de compromis de Simonson).
// Le badge "Recommandé" sur Premium renforce ce biais de confirmation.

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
    if (action === "anonymous") { router.push("/"); return; }
    if (action === "register")  { router.push("/register"); return; }

    setLoading(action);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/register?redirect=${action}`);
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">

      {/* ── Header ── */}
      <div className={`mb-12 text-center transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        <div className="mx-auto mb-6 flex h-1.5 w-24 overflow-hidden rounded-full">
          <div className="flex-1 bg-blue-600"/>
          <div className="flex-1 bg-white"/>
          <div className="flex-1 bg-red-600"/>
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
          Choisissez votre <span className="text-blue-400">préparation</span>
        </h1>
        <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
          90 jours suffisent pour réussir votre entretien civique. Commencez aujourd'hui.
        </p>
        {role !== "anonymous" && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
            Plan actuel : {role === "freemium" ? "✨ Freemium" : role === "premium" ? "🎯 Premium" : "👑 Élite"}
          </div>
        )}
      </div>

      {/* ── Grille des plans ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan, i) => {
          const isCurrent = plan.id === role;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[1.8rem] border p-5 transition-all duration-500 ${plan.accent} ${
                plan.highlight ? "ring-2 ring-blue-400/40 shadow-[0_0_50px_rgba(37,99,235,0.15)]" : ""
              } ${isCurrent ? "ring-2 ring-emerald-400/30" : ""}`}
              style={{ transitionDelay: `${i * 80}ms`, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${plan.badgeColor}`}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && !plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                  Votre plan
                </div>
              )}
              {isCurrent && plan.badge && (
                <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                  Votre plan
                </div>
              )}

              {/* Header */}
              <div className="mb-4">
                <div className="text-2xl mb-2">{plan.icon}</div>
                <h2 className="text-base font-extrabold text-white">{plan.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className={`text-2xl font-extrabold ${plan.price === "—" ? "text-slate-500" : "text-white"}`}>
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-sm font-semibold text-slate-300 mb-0.5">{plan.period}</span>}
                </div>
                {plan.id === "premium" && (
                  <p className="mt-1 text-[10px] text-blue-300/70">≈ 6,66€/mois · annulable à tout moment</p>
                )}
                {plan.id === "elite" && (
                  <p className="mt-1 text-[10px] text-amber-300/70">Paiement unique · pas d'abonnement</p>
                )}
              </div>

              {/* Features */}
              <ul className="mb-5 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 shrink-0 ${f.ok ? "text-emerald-400" : "text-slate-600"}`}>
                      {f.ok ? "✓" : "✗"}
                    </span>
                    <span className={`leading-4 ${"bold" in f && f.bold ? "font-semibold text-white" : f.ok ? "text-slate-200" : "text-slate-500"}`}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCTA(plan.ctaAction)}
                disabled={isCurrent || loading === plan.ctaAction}
                className={`w-full rounded-2xl py-3 text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                  isCurrent ? "border border-white/10 bg-white/5 text-slate-500" : plan.ctaStyle
                }`}
              >
                {isCurrent ? "Plan actuel"
                  : loading === plan.ctaAction ? "Redirection..."
                  : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Bandeau psychologique ── */}
      <div className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-500/8 px-6 py-4 text-center">
        <p className="text-sm text-slate-300">
          💡 <span className="font-semibold text-white">La majorité de nos candidats réussissent en moins de 8 semaines</span> avec Premium.
          L'accès 3 mois est largement suffisant — et à ~6,66€/mois c'est moins cher qu'un café.
        </p>
      </div>

      {/* ── Comparatif détaillé ── */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-800/60 p-6">
        <h2 className="text-base font-bold text-white mb-5">Comparatif complet</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-slate-400 font-medium w-1/3">Fonctionnalité</th>
                <th className="text-center py-2 px-2 text-slate-500 font-medium">Explorateur</th>
                <th className="text-center py-2 px-2 text-slate-400 font-medium">Freemium</th>
                <th className="text-center py-2 px-2 text-blue-300 font-bold">Premium</th>
                <th className="text-center py-2 px-2 text-amber-300 font-bold">Élite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ["Questions / session",    "10",        "20",         "40",         "40"],
                ["Niveaux",                "1",         "1",          "1, 2, 3",    "1, 2, 3"],
                ["Cartes Scroll",          "5/thème",   "10/thème",   "400",        "400"],
                ["Épisodes audio",         "—",         "2/thème",    "100",        "100"],
                ["Examen blanc",           "—",         "1 essai",    "Illimité",   "Illimité"],
                ["Historique",             "—",         "✓",          "✓",          "✓"],
                ["Statistiques",           "—",         "—",          "✓",          "✓"],
                ["Durée d'accès",          "Illimité",  "Illimité",   "3 mois",     "À vie"],
                ["Contenu expert exclusif","—",         "—",          "—",          "✓"],
                ["Mises à jour futures",   "—",         "—",          "—",          "✓ incluses"],
                ["Badge Élite",            "—",         "—",          "—",          "✓"],
                ["Support",                "—",         "Standard",   "Standard",   "Prioritaire"],
                ["Communauté",             "—",         "—",          "✓ Complet",  "✓ Complet"],
              ].map(([feature, anon, free, prem, elite]) => (
                <tr key={String(feature)}>
                  <td className="py-2 pr-4 text-slate-300">{feature}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{anon}</td>
                  <td className="py-2 px-2 text-center text-slate-400">{free}</td>
                  <td className="py-2 px-2 text-center text-blue-300 font-medium">{prem}</td>
                  <td className="py-2 px-2 text-center text-amber-300 font-medium">{elite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-800/60 p-6">
        <h2 className="text-base font-bold text-white mb-4">Questions fréquentes</h2>
        <div className="space-y-4 text-sm">
          {[
            {
              q: "Quelle est la différence entre Premium et Élite ?",
              a: "Premium donne un accès complet pendant 3 mois — idéal pour se préparer à l'entretien. Élite est un accès à vie avec en plus du contenu exclusif : conseils d'experts en naturalisation, nouvelles questions en avant-première, mises à jour futures incluses et un badge profil exclusif."
            },
            {
              q: "Puis-je annuler Premium ?",
              a: "Oui, à tout moment depuis votre espace compte. L'accès reste actif jusqu'à la fin de la période de 3 mois payée."
            },
            {
              q: "3 mois suffisent-ils vraiment ?",
              a: "Oui — la majorité de nos candidats réussissent leur entretien en 6 à 8 semaines de préparation régulière. 3 mois sont largement suffisants, voire généreux."
            },
            {
              q: "Élite inclut-il les futures mises à jour ?",
              a: "Oui, l'accès Élite inclut toutes les mises à jour et nouveaux contenus que nous ajouterons à l'application, sans frais supplémentaires."
            },
            {
              q: "Puis-je passer de Freemium à Premium directement ?",
              a: "Oui, cliquez sur 'Commencer ma préparation' et vous serez redirigé vers le paiement sécurisé Stripe. Vos données et historique sont conservés."
            },
          ].map((item) => (
            <div key={item.q} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
              <p className="font-semibold text-white">{item.q}</p>
              <p className="mt-1 text-slate-400 leading-6">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-white transition">
          ← Retour
        </button>
      </div>
    </main>
  );
}
