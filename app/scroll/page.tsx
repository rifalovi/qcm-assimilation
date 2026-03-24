// app/scroll/page.tsx — SERVER COMPONENT
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ScrollStudyClient from "./ScrollStudyClient";
import type { Question } from "../../src/types/questions";

export const dynamic = "force-dynamic";

const LIMITS = {
  anonymous: 5,  // 5 cartes par thème
  freemium: 10,  // 10 cartes par thème
  premium: 999,  // tout
};

interface PageProps {
  searchParams: Promise<{ theme?: string }>;
}

export default async function ScrollPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const preselectedTheme = params.theme ? decodeURIComponent(params.theme) : null;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser();

  // Récupérer le rôle depuis profiles
  let role: "anonymous" | "freemium" | "premium" | "elite" = "anonymous";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "freemium";
  }

  const limit = LIMITS[role];

  // Charger toutes les questions
  const { data, error } = await supabase
    .from("questions")
    .select("id, theme, question, best_answer, mcq_variants")
    .order("id", { ascending: true });

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-5xl items-center justify-center px-4 py-8">
        <p className="text-red-400">Erreur de chargement : {error?.message}</p>
      </main>
    );
  }

  // Limiter les questions par thème selon le rôle
  const allQuestions = data as Question[];
  const themes = Array.from(new Set(allQuestions.map((q) => q.theme))).sort();

  const questions = (role === "premium" || role === "elite")
    ? allQuestions
    : themes.flatMap((theme) =>
        allQuestions
          .filter((q) => q.theme === theme)
          .slice(0, limit)
      );

  return (
    <ScrollStudyClient
      questions={questions}
      themes={themes}
      preselectedTheme={preselectedTheme}
      role={role}
      cardsPerTheme={limit}
      totalCards={allQuestions.length}
    />
  );
}