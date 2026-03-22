/**
 * app/api/audio/[slug]/route.ts
 *
 * Route sécurisée de lecture audio.
 * - Vérifie que l'utilisateur est authentifié et premium
 * - Lit sa préférence de voix (male/female) depuis profiles
 * - Génère une URL Supabase Storage signée valable 60 secondes
 * - Redirige directement vers le MP3 signé pour compatibilité <audio>
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SIGNED_URL_EXPIRY = 60;

// ─── Helpers ───────────────────────────────────────────────────────────────

async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );
}

function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── GET /api/audio/[slug] ────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, voice_preference")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });
  }

  if (profile.role !== "premium") {
    return NextResponse.json(
      { error: "Accès réservé aux membres Premium" },
      { status: 403 }
    );
  }

  const voiceQuery = new URL(req.url).searchParams.get("voice");
  const gender: "male" | "female" =
    voiceQuery === "female"
      ? "female"
      : voiceQuery === "male"
      ? "male"
      : profile.voice_preference === "female"
      ? "female"
      : "male";

  const storagePath = `episodes/${slug}-${gender}.mp3`;

  const adminSupabase = createAdminSupabase();
  const { data: signedData, error: signedError } = await adminSupabase.storage
    .from("audio")
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

  if (signedError || !signedData?.signedUrl) {
    console.error("[api/audio] Erreur URL signée :", signedError?.message);
    return NextResponse.json(
      {
        error: "Fichier audio introuvable ou non encore généré",
        slug,
        gender,
        storagePath,
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { url: signedData.signedUrl, gender, expiresIn: SIGNED_URL_EXPIRY },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}