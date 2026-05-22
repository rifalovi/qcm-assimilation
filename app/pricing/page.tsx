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
    highlight: false,
    features: [
      { label: "10 questions par session",     ok: true  },
      { label: "Niveau 1 uniquement",          ok: true  },
      { label: "5 cartes Scroll par thème",    ok: true  },
      { label: "3 questions IA / jour",        ok: true  },
      { label: "Bibliothèque audio",           ok: false },
      { label: "Examen blanc",                 ok: false },
      { label: "Coach IA personnalisé",        ok: false },
      { label: "Assistant démarches IA",       ok: false },
      { label: "Espace communauté",            ok: false },
    ],
    cta: "Continuer sans compte",
    ctaAction: "anonymous",
    ctaVariant: "secondary",
  },
  {
    id: "freemium",
    name: "Freemium",
    price: "0€",
    period: "",
    badge: "Gratuit",
    badgeColor: "bg",
    description: "Compte gratuit pour démarrer",
    icon: "✨",
    highlight: false,
    features: [
      { label: "20 questions par session",          ok: true  },
      { label: "Niveau 1 uniquement",               ok: true  },
      { label: "10 cartes Scroll par thème",        ok: true  },
      { label: "2 épisodes audio gratuits / thème", ok: true  },
      { label: "Examen blanc (1 essai)",            ok: true  },
      { label: "10 explications IA / jour",         ok: true  },
      { label: "10 questions assistant IA / jour",  ok: true  },
      { label: "Coach IA (3 analyses / jour)",      ok: true  },
      { label: "Espace communauté Premium",         ok: false },
    ],
    cta: "Créer un compte gratuit",
    ctaAction: "register",
    ctaVariant: "secondary",
  },
  {
    id: "premium",
    name: "Premium",
    price: "19,99€",
    period: "/3 mois",
    badge: "⭐ Recommandé",
    badgeColor: "primary",
    description: "La préparation complète — durée idéale",
    icon: "🎯",
    highlight: true,
    features: [
      { label: "40 questions par session",     ok: true },
      { label: "Tous les niveaux (1, 2, 3)",   ok: true },
      { label: "400 cartes Scroll complètes",  ok: true },
      { label: "100 épisodes audio complets",  ok: true },
      { label: "Examen blanc illimité",        ok: true },
      { label: "Explications IA illimitées",   ok: true },
      { label: "Coach IA personnalisé illimité", ok: true },
      { label: "Assistant démarches IA illimité", ok: true },
      { label: "Communauté (témoignages, forum, messages)", ok: true },
    ],
    cta: "Commencer ma préparation",
    ctaAction: "premium",
    ctaVariant: "primary",
  },
  {
    id: "elite",
    name: "Élite",
    price: "49,99€",
    period: "accès à vie",
    badge: "👑 Accès à vie",
    badgeColor: "warning",
    description: "Tout Premium + contenu exclusif expert",
    icon: "👑",
    highlight: false,
    features: [
      { label: "Tout ce qu'inclut Premium",         ok: true, bold: true },
      { label: "Accès à vie — paiement unique",     ok: true, bold: true },
      { label: "IA illimitée (explications, coach, assistant)", ok: true, bold: true },
      { label: "Conseils d'experts en naturalisation", ok: true },
      { label: "Nouvelles questions en avant-première", ok: true },
      { label: "Mises à jour futures incluses",     ok: true },
      { label: "Badge profil exclusif Élite",       ok: true },
      { label: "Support prioritaire dédié",         ok: true },
      { label: "Communauté (témoignages, forum, messages)", ok: true, bold: true },
    ],
    cta: "Obtenir l'accès à vie",
    ctaAction: "elite",
    ctaVariant: "warning",
  },
];

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
    <main
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12"
      style={{ color: "var(--cc-text)" }}
    >

      {/* ── Header ── */}
      <div
        className={`mb-12 text-center transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        {/* Motif tricolore */}
        <div className="mx-auto mb-6 flex h-1.5 w-24 overflow-hidden rounded-full">
          <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
          <div className="flex-1" style={{ background: "var(--cc-surface)" }} />
          <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
        </div>
        <h1 style={{ color: "var(--cc-text)" }}>
          Choisissez votre{" "}
          <span style={{ color: "var(--cc-primary)" }}>préparation</span>
        </h1>
        <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: "var(--cc-text-muted)" }}>
          90 jours suffisent pour réussir votre entretien civique. Commencez aujourd'hui.
        </p>
        {role !== "anonymous" && (
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: "var(--cc-primary)",
              background: "var(--cc-primary-soft)",
              color: "var(--cc-primary)",
            }}
          >
            Plan actuel :{" "}
            {role === "freemium" ? "✨ Freemium" : role === "premium" ? "🎯 Premium" : "👑 Élite"}
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
              className="relative flex flex-col rounded-2xl border p-5 transition-all duration-500"
              style={{
                background: plan.highlight
                  ? "var(--cc-primary-soft)"
                  : "var(--cc-surface)",
                borderColor: plan.highlight
                  ? "var(--cc-primary)"
                  : isCurrent
                  ? "var(--cc-success)"
                  : "var(--cc-border)",
                boxShadow: plan.highlight ? "var(--cc-shadow)" : "var(--cc-shadow-sm)",
                transitionDelay: `${i * 80}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                outline: plan.highlight ? "2px solid var(--cc-primary)" : undefined,
                outlineOffset: plan.highlight ? "-1px" : undefined,
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold"
                  style={
                    plan.badgeColor === "primary"
                      ? { background: "var(--cc-primary)", color: "#fff" }
                      : plan.badgeColor === "warning"
                      ? { background: "var(--cc-warning)", color: "#fff" }
                      : { background: "var(--cc-surface-raised)", color: "var(--cc-text-muted)" }
                  }
                >
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div
                  className="absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: "var(--cc-success)" }}
                >
                  Votre plan
                </div>
              )}

              {/* Header */}
              <div className="mb-4">
                <div className="text-2xl mb-2">{plan.icon}</div>
                <h2 className="text-base font-extrabold" style={{ color: "var(--cc-text)" }}>
                  {plan.name}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--cc-text-muted)" }}>
                  {plan.description}
                </p>
                <div className="mt-3 flex items-end gap-1">
                  <span
                    className="text-2xl font-extrabold"
                    style={{ color: plan.price === "—" ? "var(--cc-text-disabled)" : "var(--cc-text)" }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm font-semibold mb-0.5" style={{ color: "var(--cc-text-muted)" }}>
                      {plan.period}
                    </span>
                  )}
                </div>
                {plan.id === "premium" && (
                  <p className="mt-1 text-[10px]" style={{ color: "var(--cc-primary)" }}>
                    ≈ 6,66€/mois · annulable à tout moment
                  </p>
                )}
                {plan.id === "elite" && (
                  <p className="mt-1 text-[10px]" style={{ color: "var(--cc-warning)" }}>
                    Paiement unique · pas d'abonnement
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="mb-5 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-xs">
                    <span
                      className="mt-0.5 shrink-0"
                      style={{ color: f.ok ? "var(--cc-success)" : "var(--cc-text-disabled)" }}
                    >
                      {f.ok ? "✓" : "✗"}
                    </span>
                    <span
                      className="leading-4"
                      style={{
                        color: f.ok ? "var(--cc-text)" : "var(--cc-text-disabled)",
                        fontWeight: "bold" in f && f.bold ? 600 : undefined,
                      }}
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCTA(plan.ctaAction)}
                disabled={isCurrent || loading === plan.ctaAction}
                className="w-full rounded-xl py-3 text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                style={
                  isCurrent
                    ? { background: "var(--cc-surface-raised)", color: "var(--cc-text-disabled)", border: "1px solid var(--cc-border)" }
                    : plan.ctaVariant === "primary"
                    ? { background: "var(--cc-primary)", color: "#fff", border: "1px solid var(--cc-primary)" }
                    : plan.ctaVariant === "warning"
                    ? { background: "var(--cc-warning)", color: "#fff", border: "1px solid var(--cc-warning)" }
                    : { background: "var(--cc-surface)", color: "var(--cc-primary)", border: "1px solid var(--cc-primary)" }
                }
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
      <div
        className="mt-8 rounded-2xl border px-6 py-4 text-center"
        style={{ borderColor: "var(--cc-primary)", background: "var(--cc-primary-soft)" }}
      >
        <p className="text-sm" style={{ color: "var(--cc-text)" }}>
          💡{" "}
          <span className="font-semibold">
            La majorité de nos candidats réussissent en moins de 8 semaines
          </span>{" "}
          avec Premium. L'accès 3 mois est largement suffisant — et à ~6,66€/mois c'est moins cher
          qu'un café.
        </p>
      </div>

      {/* ── Comparatif détaillé ── */}
      <div
        className="mt-8 rounded-2xl border p-6"
        style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}
      >
        <h2 className="text-base font-bold mb-5" style={{ color: "var(--cc-text)" }}>
          Comparatif complet
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--cc-border)" }}>
                <th
                  className="text-left py-2 pr-4 font-medium w-1/3"
                  style={{ color: "var(--cc-text-muted)" }}
                >
                  Fonctionnalité
                </th>
                <th className="text-center py-2 px-2 font-medium" style={{ color: "var(--cc-text-disabled)" }}>
                  Explorateur
                </th>
                <th className="text-center py-2 px-2 font-medium" style={{ color: "var(--cc-text-muted)" }}>
                  Freemium
                </th>
                <th className="text-center py-2 px-2 font-bold" style={{ color: "var(--cc-primary)" }}>
                  Premium
                </th>
                <th className="text-center py-2 px-2 font-bold" style={{ color: "var(--cc-warning)" }}>
                  Élite
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Questions / session",    "10",        "20",         "40",         "40"],
                ["Niveaux",                "1",         "1",          "1, 2, 3",    "1, 2, 3"],
                ["Cartes Scroll",          "5/thème",   "10/thème",   "400",        "400"],
                ["Épisodes audio",         "—",         "2/thème",    "100",        "100"],
                ["Examen blanc",           "—",         "1 essai",    "Illimité",   "Illimité"],
                ["Explications IA",        "3/jour",    "10/jour",    "Illimité",   "Illimité"],
                ["Coach IA",               "—",         "3/jour",     "Illimité",   "Illimité"],
                ["Assistant démarches IA",  "3/jour",   "10/jour",    "Illimité",   "Illimité"],
                ["Durée d'accès",          "Illimité",  "Illimité",   "3 mois",     "À vie"],
                ["Contenu expert exclusif","—",         "—",          "—",          "✓"],
                ["Mises à jour futures",   "—",         "—",          "—",          "✓ incluses"],
                ["Support",                "—",         "Standard",   "Standard",   "Prioritaire"],
                ["Communauté",             "—",         "—",          "✓ Complet",  "✓ Complet"],
              ].map(([feature, anon, free, prem, elite]) => (
                <tr key={String(feature)} style={{ borderBottom: "1px solid var(--cc-border)" }}>
                  <td className="py-2 pr-4" style={{ color: "var(--cc-text)" }}>{feature}</td>
                  <td className="py-2 px-2 text-center" style={{ color: "var(--cc-text-disabled)" }}>{anon}</td>
                  <td className="py-2 px-2 text-center" style={{ color: "var(--cc-text-muted)" }}>{free}</td>
                  <td className="py-2 px-2 text-center font-medium" style={{ color: "var(--cc-primary)" }}>{prem}</td>
                  <td className="py-2 px-2 text-center font-medium" style={{ color: "var(--cc-warning)" }}>{elite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div
        className="mt-6 rounded-2xl border p-6"
        style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}
      >
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--cc-text)" }}>
          Questions fréquentes
        </h2>
        <div className="space-y-4 text-sm">
          {[
            {
              q: "Quelle est la différence entre Premium et Élite ?",
              a: "Premium donne un accès complet pendant 3 mois — idéal pour se préparer à l'entretien. Élite est un accès à vie avec en plus du contenu exclusif : conseils d'experts en naturalisation, nouvelles questions en avant-première, mises à jour futures incluses et un badge profil exclusif.",
            },
            {
              q: "Puis-je annuler Premium ?",
              a: "Oui, à tout moment depuis votre espace compte. L'accès reste actif jusqu'à la fin de la période de 3 mois payée.",
            },
            {
              q: "3 mois suffisent-ils vraiment ?",
              a: "Oui — la majorité de nos candidats réussissent leur entretien en 6 à 8 semaines de préparation régulière. 3 mois sont largement suffisants, voire généreux.",
            },
            {
              q: "Élite inclut-il les futures mises à jour ?",
              a: "Oui, l'accès Élite inclut toutes les mises à jour et nouveaux contenus que nous ajouterons à l'application, sans frais supplémentaires.",
            },
            {
              q: "Qu'est-ce que l'IA Coach et l'Assistant démarches ?",
              a: "Le Coach IA analyse vos résultats de quiz et vous donne un plan de révision personnalisé. L'Assistant démarches répond à vos questions sur la naturalisation, l'entretien civique et les procédures administratives. Les explications IA détaillent chaque erreur de quiz pour vous aider à comprendre en profondeur.",
            },
            {
              q: "Puis-je passer de Freemium à Premium directement ?",
              a: "Oui, cliquez sur 'Commencer ma préparation' et vous serez redirigé vers le paiement sécurisé Stripe. Vos données et historique sont conservés.",
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
          className="text-sm transition"
          style={{ color: "var(--cc-text-muted)" }}
          onMouseOver={(e) => (e.currentTarget.style.color = "var(--cc-text)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "var(--cc-text-muted)")}
        >
          ← Retour
        </button>
      </div>
    </main>
  );
}
