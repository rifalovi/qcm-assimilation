// app/scroll/page.tsx — SERVER COMPONENT

import { createClient } from "@supabase/supabase-js";
import ScrollStudyClient from "./ScrollStudyClient";
import type { Question } from "../../src/types/questions";

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
      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 p-8 text-center shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl sm:p-10">
          <div className="flex h-1.5 w-full absolute left-0 top-0">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-600" />
          </div>

          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-2xl">
              ⚠️
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-red-200">
              Chargement impossible
            </div>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Erreur de chargement des questions
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              Les données n’ont pas pu être récupérées depuis Supabase. Vérifie la
              configuration de l’environnement avant de relancer la page.
            </p>

            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-sm font-semibold text-red-200">Détail technique</p>
              <p className="mt-2 break-words text-sm text-slate-300">
                {error?.message ?? "Aucune donnée reçue depuis Supabase."}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Vérifiez les variables Supabase sur Netlify.
            </div>
          </div>
        </section>
      </main>
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