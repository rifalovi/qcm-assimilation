// app/api/stripe/checkout/route.ts
// Crée une Stripe Checkout Session pour l'achat d'un Pass.
//
// Sécurité :
//   • Requiert un utilisateur authentifié (Supabase auth)
//   • Prix lus depuis les variables d'environnement (jamais en dur)
//   • Metadata user_id + pass_type attachés à la session → lus par le webhook
//   • customer_creation: 'always' → Customer Stripe créé pour portal access
//
// Variables d'environnement requises :
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_ID_EXPRESS   (Pass Express  7j / 4,99 €)
//   STRIPE_PRICE_ID_SERENITE  (Pass Sérénité 30j / 9,99 €)
//   NEXT_PUBLIC_SITE_URL

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// ── Client Stripe ─────────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// ── Price IDs depuis les variables d'environnement ────────────────────────────
// Ne jamais hardcoder les prix ou les IDs — seul le Dashboard Stripe fait foi.

const PRICE_IDS = {
  express:  process.env.STRIPE_PRICE_ID_EXPRESS,
  serenite: process.env.STRIPE_PRICE_ID_SERENITE,
} as const;

type PassType = keyof typeof PRICE_IDS;

// ── Handler POST ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parser le body
  let passType: PassType;
  try {
    const body = await req.json() as { type?: unknown };
    if (body?.type !== "express" && body?.type !== "serenite") {
      return NextResponse.json(
        { error: "type doit être 'express' ou 'serenite'" },
        { status: 400 }
      );
    }
    passType = body.type as PassType;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  // 2. Vérifier l'authentification Supabase
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 3. Vérifier que le Price ID est configuré
  const priceId = PRICE_IDS[passType];
  if (!priceId) {
    console.error(
      `[stripe/checkout] Env var manquante : STRIPE_PRICE_ID_${passType.toUpperCase()}`
    );
    return NextResponse.json(
      { error: "Prix non configuré — contacter le support" },
      { status: 500 }
    );
  }

  // 4. Créer la Checkout Session
  try {
    const session = await stripe.checkout.sessions.create({
      // ── Mode paiement unique (pas subscription) ──────────────────────────
      mode: "payment",
      payment_method_types: ["card"],

      // ── Produit ──────────────────────────────────────────────────────────
      line_items: [{ price: priceId, quantity: 1 }],

      // ── Customer ──────────────────────────────────────────────────────────
      // 'always' → crée un Customer Stripe même en mode payment,
      // nécessaire pour que le Customer Portal fonctionne ensuite.
      customer_creation: "always",
      customer_email:    user.email ?? undefined,

      // ── Metadata → lue par le webhook pour identifier user + pass ─────────
      metadata: {
        user_id:   user.id,
        pass_type: passType,
      },
      // client_reference_id comme backup (redondant mais utile pour Stripe Dashboard)
      client_reference_id: user.id,

      // ── URLs de retour ───────────────────────────────────────────────────
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?pass=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?pass=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
