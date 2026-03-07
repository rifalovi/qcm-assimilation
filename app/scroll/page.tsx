// app/scroll/page.tsx — SERVER COMPONENT

import { createClient } from "@supabase/supabase-js";
import ScrollStudyClient from "./ScrollStudyClient";
import type { Question } from "../../src/types/questions";

// ⚠️ OBLIGATOIRE : searchParams rend la page dynamique
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  searchParams: Promise<{ theme?: string }>;
}

export default async function ScrollPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const preselectedTheme = params.theme ? decodeURIComponent(params.theme) : null;

  const { data, error } = await supabase
    .from("questions")
    .select("id, theme, question, best_answer, mcq_variants")
    .order("id", { ascending: true });

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b0f1a] text-white flex-col gap-4">
        <p className="text-red-400 font-bold text-lg">Erreur de chargement</p>
        <p className="text-slate-400 text-sm">{error?.message}</p>
        <p className="text-slate-500 text-xs">Vérifiez les variables Supabase sur Netlify.</p>
      </div>
    );
  }

  const questions = data as Question[];
  const themes = Array.from(new Set(questions.map((q) => q.theme))).sort();

  return (
    <ScrollStudyClient
      questions={questions}
      themes={themes}
      preselectedTheme={preselectedTheme}
    />
  );
}
