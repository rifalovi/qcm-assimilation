import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, error: "Token manquant" }, { status: 400 });
  }

  // En développement, bypass Turnstile (les clés de test ne valident pas côté API)
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({ success: true });
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });

  const data = await res.json();
  return NextResponse.json({ success: data.success });
}
