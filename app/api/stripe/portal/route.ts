// app/api/stripe/portal/route.ts
// Crée une session Stripe Customer Portal pour gérer / annuler un Pass.
//
// Sécurité :
//   • Requiert un utilisateur authentifié (Supabase auth)
//   • Recherche le Customer Stripe par email — ne jamais accepter un customer_id du client
//   • Retourne 404 si aucun Customer trouvé (empêche l'accès à un portal arbitraire)
//
// Variables d'environnement requises :
//   STRIPE_SECRET_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
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

// ── Handler POST ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Vérifier l'authentification Supabase
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

  if (!user.email) {
    return NextResponse.json(
      { error: "Adresse email requise pour accéder au portail" },
      { status: 400 }
    );
  }

  // 2. Chercher le Customer Stripe associé à cet email
  // Ne jamais accepter un customer_id envoyé par le client — toujours résoudre depuis l'email auth.
  let customerId: string;
  try {
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (!customers.data.length) {
      return NextResponse.json(
        { error: "Aucun compte Stripe trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    customerId = customers.data[0].id;
  } catch (err) {
    console.error("[stripe/portal] Erreur recherche customer :", err);
    return NextResponse.json(
      { error: "Erreur lors de la recherche du compte Stripe" },
      { status: 500 }
    );
  }

  // 3. Créer la session Customer Portal
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe/portal] Erreur création session portail :", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du portail de facturation" },
      { status: 500 }
    );
  }
}
