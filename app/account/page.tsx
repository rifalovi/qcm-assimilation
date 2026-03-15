"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Role = "anonymous" | "freemium" | "premium";

type Profile = {
  username: string;
  role: Role;
};

type Result = {
  id: string;
  score_correct: number;
  score_total: number;
  score_percent: number;
  passed: boolean;
  level: number;
  themes: string[];
  mode: "train" | "exam";
  created_at: string;
};

const ROLE_CONFIG = {
  anonymous: {
    label: "Anonyme",
    color: "border-slate-400/20 bg-slate-500/10 text-slate-200",
    description: "20 questions • Pas de sauvegarde",
    icon: "👤",
  },
  freemium: {
    label: "Freemium",
    color: "border-blue-400/20 bg-blue-500/10 text-blue-200",
    description: "40 questions • Score sauvegardé • Niveau 1",
    icon: "✨",
  },
  premium: {
    label: "Premium",
    color: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    description: "Accès complet • Tous niveaux • Stats détaillées",
    icon: "👑",
  },
};

function StatCard({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string;
  accent?: "blue" | "emerald" | "amber";
}) {
  const styles = {
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  };

  return (
    <div className={`rounded-2xl border p-4 text-center ${styles[accent]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{label}</p>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      const { data: resultsData } = await supabase
        .from("results")
        .select("id, score_correct, score_total, score_percent, passed, level, themes, mode, created_at")
        .eq("email", user.email)
        .order("created_at", { ascending: false })
        .limit(20);

      if (resultsData) setResults(resultsData);
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const role = profile?.role ?? "anonymous";
  const roleConfig = ROLE_CONFIG[role];

  const quickStats = useMemo(() => {
    if (!results.length) return null;
    return {
      totalTests: results.length,
      bestScore: `${Math.max(...results.map((r) => r.score_percent ?? 0)).toFixed(0)}%`,
      passedCount: results.filter((r) => r.passed).length,
    };
  }, [results]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-120px)] max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-8 text-center text-slate-300 shadow-[0_25px_70px_rgba(2,8,23,0.42)]">
          Chargement...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-6">

        {/* ===== BARRE NAVIGATION STICKY ===== */}
        <div className="sticky top-16 z-40 flex justify-end gap-3 pb-2">
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
          >
            ← Accueil
          </Link>
          <Link
            href="/results"
            className="rounded-xl border border-blue-400/20 bg-slate-900/80 px-4 py-2 text-xs font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/10"
          >
            Dernier résultat
          </Link>
        </div>

        {/* ===== PROFIL ===== */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-600" />
          </div>

          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative p-5 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {profile?.username ?? "Mon compte"}
                  </h1>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleConfig.color}`}>
                    <span>{roleConfig.icon}</span>
                    {roleConfig.label}
                  </span>
                </div>
                <p className="mt-2 break-all text-sm text-slate-300">{email}</p>
                <p className="mt-1 text-xs text-slate-400">{roleConfig.description}</p>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Déconnexion
              </button>
            </div>

            {role !== "premium" && (
              <div className="mt-6 rounded-[1.5rem] border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-amber-100">Passer en Premium</p>
                    <p className="mt-1 text-xs text-amber-200/80">
                      Accès complet — tous niveaux, mode examen, statistiques détaillées
                    </p>
                  </div>
                  <button
                    disabled
                    className="rounded-xl border border-amber-400/20 bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 opacity-70"
                  >
                    Bientôt disponible
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===== STATS ===== */}
        {quickStats && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Tests effectués" value={String(quickStats.totalTests)} accent="blue" />
            <StatCard label="Meilleur score" value={quickStats.bestScore} accent="emerald" />
            <StatCard label="Tests réussis" value={String(quickStats.passedCount)} accent="amber" />
          </section>
        )}

        {/* ===== HISTORIQUE ===== */}
        <section className="rounded-[1.8rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_18px_45px_rgba(2,8,23,0.28)]">
          <h2 className="text-lg font-bold text-white">Historique des résultats</h2>

          {results.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">Aucun résultat pour l'instant.</p>
              <Link href="/" className="mt-3 inline-block text-sm font-medium text-blue-400 transition hover:text-blue-300 hover:underline">
                Faire un test →
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {results.map((r) => (
                <div key={r.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.07]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                      r.mode === "exam"
                        ? "border border-red-400/20 bg-red-500/10 text-red-200"
                        : "border border-blue-400/20 bg-blue-500/10 text-blue-200"
                    }`}>
                      {r.mode === "exam" ? "Examen" : "Entraînement"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {r.score_correct}/{r.score_total} — {(r.score_percent ?? 0).toFixed(0)}%
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        Niveau {r.level} • {Array.isArray(r.themes) ? r.themes.join(", ") : r.themes}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      r.passed
                        ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                        : "border border-red-400/20 bg-red-500/10 text-red-200"
                    }`}>
                      {r.passed ? "Réussi" : "Échoué"}
                    </span>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== ACTIONS BAS ===== */}
        <section className="flex flex-wrap gap-3">
          <Link href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
            ← Retour à l'accueil
          </Link>
          <Link href="/results"
            className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-5 py-2.5 text-sm font-medium text-blue-200 transition hover:bg-blue-500/15">
            Voir le dernier résultat
          </Link>
        </section>

      </div>
    </main>
  );
}
