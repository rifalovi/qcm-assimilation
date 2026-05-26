// app/api/stripe/webhook/route.ts
// Reçoit les événements Stripe et active les Passes en base.
//
// Sécurité :
//   • Signature Stripe vérifiée avec STRIPE_WEBHOOK_SECRET (constructEvent)
//   • Corps lu en texte brut (req.text()) — ne jamais parser en JSON avant la vérif
//   • Client Supabase avec service role key (bypass RLS) pour écrire en base
//   • Idempotence : vérification que stripe_session_id n'existe pas déjà dans passes
//   • Seul l'événement checkout.session.completed est traité
//
// Variables d'environnement requises :
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   (obtenu via `stripe listen` ou Dashboard → Webhooks)
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ── Client Stripe ─────────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// ── Client Supabase avec service role (bypass RLS) ───────────────────────────
// N'utiliser QUE dans les routes serveur de confiance (webhook, admin).

function makeSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── Durées des passes ─────────────────────────────────────────────────────────

const PASS_DURATION_DAYS: Record<string, number> = {
  express:  7,
  serenite: 30,
};

// ── Handler POST ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Lire le corps brut — OBLIGATOIRE avant constructEvent
  const rawBody = await req.text();

  // 2. Récupérer la signature Stripe
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("[stripe/webhook] En-tête stripe-signature manquant");
    return NextResponse.json(
      { error: "En-tête stripe-signature manquant" },
      { status: 400 }
    );
  }

  // 3. Vérifier la signature — rejette tout corps altéré ou replay
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe/webhook] Signature invalide :", err);
    return NextResponse.json(
      { error: "Signature webhook invalide" },
      { status: 400 }
    );
  }

  // 4. Ignorer les événements non pertinents (retourner 200 pour que Stripe arrête de retenter)
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // 5. Extraire les métadonnées
  const userId   = session.metadata?.user_id;
  const passType = session.metadata?.pass_type;

  if (!userId || !passType) {
    console.error(
      "[stripe/webhook] Métadonnées manquantes sur la session :",
      session.id
    );
    // Retourner 200 pour éviter les retentatives Stripe sur une session mal formée
    return NextResponse.json({ received: true });
  }

  if (!PASS_DURATION_DAYS[passType]) {
    console.error(
      `[stripe/webhook] Type de pass inconnu "${passType}" sur la session :`,
      session.id
    );
    return NextResponse.json({ received: true });
  }

  const supabase = makeSupabaseAdmin();

  // 6. Idempotence — ne pas créer deux fois le même pass
  const { data: existing, error: checkError } = await supabase
    .from("passes")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (checkError) {
    console.error("[stripe/webhook] Erreur vérification idempotence :", checkError);
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }

  if (existing) {
    // Déjà traité — répondre 200 pour stopper les retentatives
    console.info("[stripe/webhook] Session déjà traitée :", session.id);
    return NextResponse.json({ received: true });
  }

  // 7. Calculer les dates d'activation
  const startsAt   = new Date();
  const expiresAt  = new Date(startsAt);
  expiresAt.setDate(expiresAt.getDate() + PASS_DURATION_DAYS[passType]);

  // 8. Insérer dans la table passes
  const { error: insertError } = await supabase
    .from("passes")
    .insert({
      user_id:            userId,
      type:               passType,
      starts_at:          startsAt.toISOString(),
      expires_at:         expiresAt.toISOString(),
      stripe_session_id:  session.id,
      stripe_payment_id:  session.payment_intent as string ?? null,
      amount_eur:         session.amount_total != null
                            ? session.amount_total / 100
                            : null,
      status:             "active",
    });

  if (insertError) {
    console.error("[stripe/webhook] Erreur insertion pass :", insertError);
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }

  // 9. Synchroniser le cache profil (best-effort — non critique)
  //
  // Architecture : get_access_level() lit la table passes directement comme
  // source de vérité. profiles.pass_type / pass_expires_at sont un cache
  // dénormalisé pour d'éventuels usages futurs (dashboard admin, etc.).
  //
  // Si cet UPDATE échoue, l'utilisateur a QUAND MÊME accès à son pass car
  // get_access_level() a déjà trouvé son pass dans la table passes (§6 ci-dessus).
  // On log l'erreur pour investigation mais on ne bloque pas la réponse.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      pass_type:       passType,
      pass_expires_at: expiresAt.toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    // Non-critique : le pass est actif dans passes, l'accès est garanti.
    // Investiguer si cette erreur devient récurrente.
    console.warn(
      "[stripe/webhook] Cache profil non synchronisé (non-critique) :",
      updateError,
      `| user: ${userId} | pass: ${passType}`
    );
  }

  console.info(
    `[stripe/webhook] Pass ${passType} activé pour user ${userId}`,
    `| expires: ${expiresAt.toISOString()}`,
    `| session: ${session.id}`
  );

  return NextResponse.json({ received: true });
}
