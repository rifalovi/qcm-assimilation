import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setRole(userId: string, role: "premium" | "elite", stripeData: {
  customerId?: string;
  subscriptionId?: string;
  expiresAt?: string | null;
}) {
  await supabase.from("profiles").update({ role }).eq("id", userId);
  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: stripeData.customerId ?? null,
    stripe_subscription_id: stripeData.subscriptionId ?? null,
    status: "active",
    expires_at: stripeData.expiresAt ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 })
  }

  // ── checkout.session.completed ────────────────────────────────────────
  // Déclenché pour Premium (subscription) ET Élite (payment)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id
    const plan = session.metadata?.plan ?? "premium"

    if (userId) {
      if (plan === "elite" || session.mode === "payment") {
        // Élite — accès à vie, pas d'expiration
        await setRole(userId, "elite", {
          customerId: session.customer as string,
          expiresAt: null,
        })
        console.log(`[webhook] Élite activé pour ${userId}`)
      } else {
        // Premium — expiration dans 3 mois
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        await setRole(userId, "premium", {
          customerId: session.customer as string,
          subscriptionId: session.subscription as string,
          expiresAt,
        })
        console.log(`[webhook] Premium activé pour ${userId} jusqu'au ${expiresAt}`)
      }
    }
  }

  // ── invoice.payment_succeeded — renouvellement Premium ────────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice
    const subId = (invoice as any).subscription as string
    if (subId) {
      const subscription = await stripe.subscriptions.retrieve(subId)
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subId)
        .single()
      if (data?.user_id) {
        const expiresAt = new Date((subscription as any).current_period_end * 1000).toISOString()
        await setRole(data.user_id, "premium", {
          customerId: subscription.customer as string,
          subscriptionId: subId,
          expiresAt,
        })
        console.log(`[webhook] Premium renouvelé pour ${data.user_id} jusqu'au ${expiresAt}`)
      }
    }
  }

  // ── customer.subscription.deleted — annulation Premium ───────────────
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscription.id)
      .single()
    if (data?.user_id) {
      await supabase.from("profiles").update({ role: "freemium" }).eq("id", data.user_id)
      await supabase.from("subscriptions").update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      }).eq("stripe_subscription_id", subscription.id)
      console.log(`[webhook] Premium révoqué pour ${data.user_id}`)
    }
  }

  return NextResponse.json({ received: true })
}
