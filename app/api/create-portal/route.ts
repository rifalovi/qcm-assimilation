import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = 'force-dynamic'

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });

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
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = sub?.stripe_customer_id;

  if (!customerId && user.email) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
  }

  if (!customerId) {
    return NextResponse.json({ error: "Aucun abonnement trouve" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: process.env.NEXT_PUBLIC_SITE_URL + "/account",
  });

  return NextResponse.json({ url: session.url });
}
