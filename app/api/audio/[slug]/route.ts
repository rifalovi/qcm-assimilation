/**
 * app/api/audio/[slug]/route.ts
 *
 * Route sécurisée de lecture audio.
 * - Vérifie que l'utilisateur est authentifié et premium
 * - Lit sa préférence de voix (male/female) depuis profiles
 * - Génère une URL Supabase Storage signée valable 60 secondes
 *
 * Appelée par le composant AudioPlayer :
 *   GET /api/audio/la-devise-liberte-egalite-fraternite
 *   → { url: "https://supabase.co/...?token=...&expires=..." }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Durée de validité de l'URL signée en secondes
// 60s suffit pour démarrer la lecture — le fichier audio reste accessible
// en streaming une fois lancé même si l'URL expire
const SIGNED_URL_EXPIRY = 60;

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Client Supabase côté serveur avec cookies de session */
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

/** Client Supabase admin avec service role (pour Storage) */
function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── GET /api/audio/[slug] ────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
  }

  // ── 1. Vérifier la session ──────────────────────────────────────────────
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  // ── 2. Vérifier le rôle premium + lire voice_preference ────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, voice_preference")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Profil introuvable" },
      { status: 403 }
    );
  }

  if (profile.role !== "premium") {
    return NextResponse.json(
      { error: "Accès réservé aux membres Premium" },
      { status: 403 }
    );
  }

  // ── 3. Déterminer le fichier à servir ───────────────────────────────────
  // ?voice= en query param permet à VoiceSelector de prévisualiser
  // une voix spécifique indépendamment de la préférence sauvegardée
  const voiceQuery = new URL(_req.url).searchParams.get("voice");
  const gender: "male" | "female" =
    voiceQuery === "female" ? "female" :
    voiceQuery === "male" ? "male" :
    profile.voice_preference === "female" ? "female" : "male";

  const storagePath = `episodes/${slug}-${gender}.mp3`;

  // ── 4. Générer l'URL signée (60s) ───────────────────────────────────────
  const adminSupabase = createAdminSupabase();
  const { data: signedData, error: signedError } = await adminSupabase.storage
    .from("audio")
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

  if (signedError || !signedData?.signedUrl) {
    console.error("[api/audio] Erreur URL signée :", signedError?.message);
    return NextResponse.json(
      { error: "Fichier audio introuvable ou non encore généré" },
      { status: 404 }
    );
  }

  // ── 5. Retourner l'URL ──────────────────────────────────────────────────
  return NextResponse.json(
    {
      url: signedData.signedUrl,
      gender,
      expiresIn: SIGNED_URL_EXPIRY,
    },
    {
      status: 200,
      headers: {
        // Pas de cache — chaque URL est unique et à usage unique
        "Cache-Control": "no-store",
      },
    }
  );
}
