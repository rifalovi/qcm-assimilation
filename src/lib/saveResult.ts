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

export async function loadLastResultFromSupabase(email: string, mode: "train" | "exam") {
  try {
    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .eq("mode", mode)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error || !data) return null;
    return data;
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
  score_percent?: number;
};

export async function saveFeedbackToSupabase(payload: SaveFeedbackPayload) {
  try {
    const { error } = await supabase.from("feedbacks").insert([payload]);
    if (error) console.error("Supabase feedback error:", error.message);
  } catch (e) {
    console.error("Supabase feedback unreachable:", e);
  }
}