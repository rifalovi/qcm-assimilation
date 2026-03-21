import { createClient } from "@/lib/supabase/client";
import { saveResultToSupabase } from "../../src/lib/saveResult";

type QcmUser = {
  pseudo: string;
  email: string;
};

type StoredResult = {
  meta?: {
    level?: 1 | 2 | 3;
    themes?: Array<"Valeurs" | "Institutions" | "Histoire" | "Société">;
    mode?: "train" | "exam";
  };
  questions?: any[];
  answers?: Record<string, string | null>;
  result?: {
    correct: number;
    total: number;
    details?: any;
  };
};

function loadLocalUser(): QcmUser | null {
  try {
    const raw = localStorage.getItem("qcm_user");
    return raw ? (JSON.parse(raw) as QcmUser) : null;
  } catch {
    return null;
  }
}

function loadStoredResult(key: string): StoredResult | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredResult) : null;
  } catch {
    return null;
  }
}

export async function mergeLocalAccountToAuthenticatedUser() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { merged: false, reason: "no-auth-user" };

  const authEmail = user.email.trim().toLowerCase();
  const localUser = loadLocalUser();

  if (!localUser?.email) {
    return { merged: false, reason: "no-local-user" };
  }

  const localEmail = localUser.email.trim().toLowerCase();

  if (localEmail !== authEmail) {
    return { merged: false, reason: "email-mismatch" };
  }

  // 1) Mettre à jour le profil avec le pseudo local si utile
  const username = localUser.pseudo?.trim() || user.user_metadata?.username || "";

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("profile upsert error:", profileError);
  }

  // 2) Migrer les résultats locaux vers Supabase si disponibles
  const trainKey = `last_result:train:${authEmail}`;
  const examKey = `last_result:exam:${authEmail}`;

  const trainResult = loadStoredResult(trainKey);
  const examResult = loadStoredResult(examKey);

  const migratedModes: string[] = [];

  for (const [mode, payload] of [
    ["train", trainResult],
    ["exam", examResult],
  ] as const) {
    if (!payload?.result || !payload?.questions || !payload?.answers) continue;

    const correct = payload.result.correct ?? 0;
    const total = payload.result.total ?? 0;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = correct >= 32;

    try {
      await saveResultToSupabase({
        email: authEmail,
        pseudo: username,
        mode,
        score_correct: correct,
        score_total: total,
        score_percent: percent,
        passed,
        level: payload.meta?.level ?? 1,
        themes: payload.meta?.themes ?? [],
        answers: payload.answers,
        questions: payload.questions,
        details: payload.result.details ?? [],
      });

      migratedModes.push(mode);
    } catch (e) {
      console.error(`failed to migrate ${mode} result`, e);
    }
  }

  // 3) Réécrire qcm_user proprement
  localStorage.setItem(
    "qcm_user",
    JSON.stringify({
      pseudo: username,
      email: authEmail,
    })
  );

  // 4) Marquer la fusion pour éviter de la refaire inutilement
  localStorage.setItem(
    `account_merged:${authEmail}`,
    JSON.stringify({
      at: new Date().toISOString(),
      migratedModes,
    })
  );

  return {
    merged: true,
    email: authEmail,
    migratedModes,
  };
}