import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const PLANS = {
  premium: {
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM!,
    mode: 'subscription' as const,
  },
  elite: {
    priceId: process.env.STRIPE_PRICE_ID_ELITE!,
    mode: 'payment' as const,
  },
}

export const dynamic = 'force-dynamic'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  })
  
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let plan = 'premium'
  try {
    const body = await req.json()
    if (body?.plan === 'elite') plan = 'elite'
  } catch {}

  const { priceId, mode } = PLANS[plan as keyof typeof PLANS] ?? PLANS.premium

  const session = await stripe.checkout.sessions.create({
    mode,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    customer_email: user.email,
    metadata: { plan, userId: user.id },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=true&plan=${plan}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
  })

  return NextResponse.json({ url: session.url })
}
