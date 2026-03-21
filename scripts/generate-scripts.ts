/**
 * scripts/generate-scripts.ts
 *
 * Phase 1 — Génération des scripts texte via Claude API
 *
 * Usage :
 *   npx ts-node scripts/generate-scripts.ts
 *
 * Produit :
 *   audio_content/scripts.json
 *
 * Variables d'environnement requises (.env.local) :
 *   ANTHROPIC_API_KEY=sk-ant-...
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "dotenv";
import path from "path";

// Charge .env.local automatiquement
config({ path: path.resolve(process.cwd(), ".env.local") });
import fs from "fs";


// ─── Config ────────────────────────────────────────────────────────────────
const EPISODES_PATH = path.resolve("audio_content/episodes.json");
const OUTPUT_PATH   = path.resolve("audio_content/scripts.json");
const MODEL         = "claude-sonnet-4-5";
const MAX_TOKENS    = 1024;
const DELAY_MS      = 500; // délai entre chaque appel pour éviter le rate-limit

// ─── Types ─────────────────────────────────────────────────────────────────
type Episode = {
  id: string;
  theme_key: string;
  theme_label: string;
  subtheme_key: string;
  subtheme_label: string;
  episode_number: number;
  episode_title: string;
  episode_slug: string;
  duration_target_seconds: number;
  premium: boolean;
  prompt: string;
};

type ScriptEntry = {
  id: string;
  episode_slug: string;
  episode_title: string;
  theme_key: string;
  subtheme_key: string;
  script_text: string;
  generated_at: string;
};

// ─── Utilitaires ───────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripMarkdown(text: string): string {
  // Supprime les balises emoji-titre du format de sortie (🎧, 👮, etc.)
  // et ne garde que le texte brut lisible à voix haute
  return text
    .replace(/🎧 Épisode :.*\n?/g, "")
    .replace(/👮 Agent :\n?/g, "")
    .replace(/❓ Question :\n?/g, "")
    .replace(/⏸️ Pause\n?/g, "... ")
    .replace(/👤 Candidat :\n?/g, "")
    .replace(/📖 Explication :\n?/g, "")
    .replace(/⚠️ Attention :\n?/g, "")
    .replace(/✅ À retenir :\n?/g, "À retenir : ")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  // Vérifier la clé API
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌  ANTHROPIC_API_KEY manquant dans .env.local");
    process.exit(1);
  }

  // Charger les épisodes
  if (!fs.existsSync(EPISODES_PATH)) {
    console.error(`❌  Fichier introuvable : ${EPISODES_PATH}`);
    process.exit(1);
  }

  const episodes: Episode[] = JSON.parse(fs.readFileSync(EPISODES_PATH, "utf-8"));
  console.log(`📋  ${episodes.length} épisodes chargés\n`);

  // Charger les scripts existants (reprise si interruption)
  let existing: ScriptEntry[] = [];
  if (fs.existsSync(OUTPUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));
    console.log(`♻️   ${existing.length} scripts déjà générés — reprise à partir du dernier\n`);
  }

  const existingIds = new Set(existing.map((s) => s.id));
  const toProcess   = episodes.filter((ep) => !existingIds.has(ep.id));

  if (toProcess.length === 0) {
    console.log("✅  Tous les scripts sont déjà générés.");
    return;
  }

  console.log(`🚀  ${toProcess.length} épisode(s) à générer...\n`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const results: ScriptEntry[] = [...existing];

  for (let i = 0; i < toProcess.length; i++) {
    const ep = toProcess[i];
    const idx = `[${i + 1}/${toProcess.length}]`;

    console.log(`${idx} Génération : ${ep.episode_title}`);

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: ep.prompt }],
      });

      const rawText = response.content
        .filter((b: { type: string }) => b.type === "text")
        .map((b: { type: string; text?: string }) => (b as { type: "text"; text: string }).text)
        .join("\n");

      const scriptText = stripMarkdown(rawText);

      const entry: ScriptEntry = {
        id: ep.id,
        episode_slug: ep.episode_slug,
        episode_title: ep.episode_title,
        theme_key: ep.theme_key,
        subtheme_key: ep.subtheme_key,
        script_text: scriptText,
        generated_at: new Date().toISOString(),
      };

      results.push(entry);

      // Sauvegarde incrémentale après chaque épisode
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), "utf-8");
      console.log(`   ✅  OK (${scriptText.length} caractères)`);

    } catch (err) {
      console.error(`   ❌  Erreur pour ${ep.id} :`, err);
      console.log("   ⏭️   Episode ignoré, passage au suivant...\n");
    }

    // Délai anti rate-limit (sauf dernier)
    if (i < toProcess.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n🎉  Terminé ! ${results.length} scripts dans :\n    ${OUTPUT_PATH}`);
  console.log("\n👉  Étape suivante :");
  console.log("    1. Ouvre audio_content/scripts.json et relis les textes");
  console.log("    2. Corrige si besoin");
  console.log("    3. Lance : npx ts-node scripts/generate-audio.ts\n");
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
