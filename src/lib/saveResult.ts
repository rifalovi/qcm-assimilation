import { supabase } from "./supabaseClient";

type SaveResultPayload = {
  email: string;
  pseudo: string;
  mode: "train" | "exam";
  score_correct: number;
  score_total: number;
  score_percent: number;
  passed: boolean;
  level: number;
  themes: string[];
  answers: Record<string, string | null>;
  questions: any[];
  details: any[];
};

export async function saveResultToSupabase(payload: SaveResultPayload) {
  try {
    const { error } = await supabase.from("results").insert([payload]);
    if (error) console.error("Supabase save error:", error.message);
  } catch (e) {
    console.error("Supabase unreachable:", e);
  }
}

export async function loadLastResultFromSupabase(
  email: string,
  mode: "train" | "exam"
) {
  try {
    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .eq("mode", mode)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
}

export async function hasAnyResult(email: string): Promise<boolean> {
  try {
    const { count } = await supabase
      .from("results")
      .select("id", { count: "exact", head: true })
      .eq("email", email.trim().toLowerCase());

    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

type SaveFeedbackPayload = {
  email?: string;
  pseudo?: string;
  rating: number;
  comment?: string;
  page: string;
  score_percent?: number | null;
  user_id?: string | null;
};

export async function saveFeedbackToSupabase(payload: SaveFeedbackPayload) {
  try {
    const cleanPayload = {
      email: payload.email?.trim().toLowerCase() || "",
      pseudo: payload.pseudo?.trim() || "Anonyme",
      rating: payload.rating,
      comment: payload.comment?.trim() || "",
      page: payload.page?.trim() || "app",
      score_percent: payload.score_percent ?? null,
      user_id: payload.user_id ?? null,
    };

    const { error } = await supabase.from("feedbacks").insert([cleanPayload]);

    if (error) {
      console.error("Supabase feedback error:", error.message);
      throw error;
    }
  } catch (e) {
    console.error("Supabase feedback unreachable:", e);
    throw e;
  }
}

export async function loadLastResultsFromSupabase(
  email: string,
  mode: "train" | "exam",
  limit = 5
) {
  try {
    const { data, error } = await supabase
      .from("results")
      .select("id, score_correct, score_total, score_percent, passed, level, themes, created_at")
      .eq("email", email.trim().toLowerCase())
      .eq("mode", mode)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function loadLeaderboard(mode: "train" | "exam", limit = 10) {
  try {
    const { data, error } = await supabase
      .from("results")
      .select("pseudo, email, score_correct, score_total, score_percent, passed, level, created_at")
      .eq("mode", mode)
      .eq("passed", true)
      .order("score_percent", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(50);

    if (error || !data) return [];

    const best = new Map<string, typeof data[0]>();
    for (const row of data) {
      const existing = best.get(row.email);
      if (!existing || row.score_percent > existing.score_percent) {
        best.set(row.email, row);
      }
    }

    return Array.from(best.values())
      .sort((a, b) => b.score_percent - a.score_percent)
      .slice(0, limit);
  } catch {
    return [];
  }
}
