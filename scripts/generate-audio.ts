/**
 * scripts/generate-audio.ts
 *
 * Phase 2 — Synthèse vocale ElevenLabs + upload Supabase Storage
 * Génère 2 fichiers par épisode : [slug]-male.mp3 et [slug]-female.mp3
 *
 * Usage :
 *   npx ts-node scripts/generate-audio.ts                  # les deux voix
 *   npx ts-node scripts/generate-audio.ts --voice male     # seulement masculin
 *   npx ts-node scripts/generate-audio.ts --voice female   # seulement féminin
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Charge .env.local automatiquement — plus besoin de source ou dotenv/config
config({ path: path.resolve(process.cwd(), ".env.local") });

// ─── Config ────────────────────────────────────────────────────────────────
const SCRIPTS_PATH = path.resolve("audio_content/scripts.json");
const DONE_PATH    = path.resolve("audio_content/generated.json");
const DELAY_MS     = 1200;

const VOICES = {
  male: {
    id: process.env.ELEVENLABS_VOICE_ID_MALE!,
    settings: {
      stability: 0.55,
      similarity_boost: 0.80,
      style: 0.20,
      use_speaker_boost: true,
    },
  },
  female: {
    id: process.env.ELEVENLABS_VOICE_ID_FEMALE!,
    settings: {
      stability: 0.50,
      similarity_boost: 0.75,
      style: 0.25,
      use_speaker_boost: true,
    },
  },
} as const;

type VoiceGender = keyof typeof VOICES;

// ─── Types ─────────────────────────────────────────────────────────────────
type ScriptEntry = {
  id: string;
  episode_slug: string;
  episode_title: string;
  script_text: string;
};

type DoneEntry = { id: string; gender: VoiceGender };

// ─── Utilitaires ───────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadDone(): Set<string> {
  if (!fs.existsSync(DONE_PATH)) return new Set();
  const data = JSON.parse(fs.readFileSync(DONE_PATH, "utf-8")) as DoneEntry[];
  return new Set(data.map((d) => `${d.id}:${d.gender}`));
}

function saveDone(done: Set<string>) {
  const entries: DoneEntry[] = [...done].map((key) => {
    const [id, gender] = key.split(":");
    return { id, gender: gender as VoiceGender };
  });
  fs.writeFileSync(DONE_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

function parseVoiceArg(): VoiceGender | "both" {
  const idx = process.argv.indexOf("--voice");
  if (idx === -1) return "both";
  const val = process.argv[idx + 1];
  if (val === "male" || val === "female") return val;
  console.warn(`⚠️  Valeur --voice invalide : "${val}". Défaut : both`);
  return "both";
}

// ─── ElevenLabs TTS ────────────────────────────────────────────────────────
async function synthesize(rawText: string, gender: VoiceGender): Promise<Buffer> {
  const text = rawText
    .replace(/\[PRÉSENTATION\]|\[QUESTION\]|\[PAUSE\]|\[RÉPONSE\]|\[EXPLICATION\]|\[ATTENTION\]|\[À RETENIR\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const voice = VOICES[gender];
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: voice.settings,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `ElevenLabs [${gender}] ${response.status} : ${await response.text()}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

// ─── Upload Supabase Storage ───────────────────────────────────────────────
async function upload(
  supabase: ReturnType<typeof createClient<any, any, any>>,  // eslint-disable-line @typescript-eslint/no-explicit-any
  buffer: Buffer,
  slug: string,
  gender: VoiceGender
) {
  const { error } = await supabase.storage
    .from("audio")
    .upload(`episodes/${slug}-${gender}.mp3`, buffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) throw new Error(`Upload [${gender}] échoué : ${error.message}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const missing = [
    "ELEVENLABS_API_KEY",
    "ELEVENLABS_VOICE_ID_MALE",
    "ELEVENLABS_VOICE_ID_FEMALE",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((k) => !process.env[k]);

  if (missing.length > 0) {
    console.error(`❌  Variables manquantes : ${missing.join(", ")}`);
    process.exit(1);
  }

  if (!fs.existsSync(SCRIPTS_PATH)) {
    console.error("❌  scripts.json introuvable. Lance d'abord generate-scripts.ts");
    process.exit(1);
  }

  const voiceArg = parseVoiceArg();
  const genders: VoiceGender[] = voiceArg === "both" ? ["male", "female"] : [voiceArg];
  const scripts: ScriptEntry[] = JSON.parse(fs.readFileSync(SCRIPTS_PATH, "utf-8"));
  const done = loadDone();

  const tasks = scripts.flatMap((entry) =>
    genders
      .filter((g) => !done.has(`${entry.id}:${g}`))
      .map((gender) => ({ entry, gender }))
  );

  if (tasks.length === 0) {
    console.log("✅  Tous les audios sont déjà générés.");
    return;
  }

  console.log(`📋  ${scripts.length} scripts × ${genders.length} voix`);
  console.log(`🔊  ${tasks.length} fichier(s) à synthétiser\n`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (let i = 0; i < tasks.length; i++) {
    const { entry, gender } = tasks[i];
    const label = gender === "male" ? "♂ Masculin" : "♀ Féminin";
    console.log(`[${i + 1}/${tasks.length}] ${label} — ${entry.episode_title}`);

    try {
      console.log("    🎙️   Synthèse...");
      const buffer = await synthesize(entry.script_text, gender);
      console.log(`    ✅  MP3 (${Math.round(buffer.length / 1024)} Ko)`);

      console.log(`    ☁️   Upload → episodes/${entry.episode_slug}-${gender}.mp3`);
      await upload(supabase, buffer, entry.episode_slug, gender);

      done.add(`${entry.id}:${gender}`);
      saveDone(done);
      console.log("    ✅  OK\n");
    } catch (err) {
      console.error("    ❌  Erreur :", err);
      console.log("    ⏭️   Ignoré\n");
    }

    if (i < tasks.length - 1) await sleep(DELAY_MS);
  }

  console.log(`🎉  ${done.size} fichiers dans Supabase Storage bucket "audio"`);
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
