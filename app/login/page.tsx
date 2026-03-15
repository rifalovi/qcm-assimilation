"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://qcm-assimilation-fr.netlify.app/auth/callback?type=recovery",
    });

    if (error) {
      setError("Erreur : " + error.message);
    } else {
      setForgotSent(true);
    }

    setLoading(false);
  }

  if (forgotMode) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="hidden lg:block">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 p-8 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
              <div className="flex h-1.5 w-full">
                <div className="flex-1 bg-blue-600" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-red-600" />
              </div>

              <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

              <div className="relative pt-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                  Récupération sécurisée
                </div>

                <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white">
                  Retrouvez l’accès à votre compte en quelques instants.
                </h1>

                <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                  Entrez votre adresse email pour recevoir un lien de réinitialisation
                  et reprendre rapidement votre préparation dans de bonnes conditions.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Lien envoyé vers votre email",
                    "Réinitialisation simple et sécurisée",
                    "Retour rapide vers vos entraînements",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-sm">
                        ✓
                      </span>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.45)] sm:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  🔐 Mot de passe oublié
                </div>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                  Réinitialiser le mot de passe
                </h1>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
              </div>

              {forgotSent ? (
                <div className="rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-4 text-sm text-green-200">
                  <p className="mb-1 font-semibold">Email envoyé !</p>
                  <p>
                    Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser
                    votre mot de passe.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ton@email.com"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
                    />
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50"
                  >
                    {loading ? "Envoi..." : "Envoyer le lien"}
                  </button>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-slate-400">
                <button
                  onClick={() => {
                    setForgotMode(false);
                    setForgotSent(false);
                    setError(null);
                  }}
                  className="font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
                >
                  Retour à la connexion
                </button>
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 p-8 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
            <div className="flex h-1.5 w-full">
              <div className="flex-1 bg-blue-600" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-red-600" />
            </div>

            <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative pt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                Connexion sécurisée
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white">
                Heureux de vous revoir sur votre plateforme d’entraînement.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                Connectez-vous pour retrouver vos résultats, suivre votre progression
                et poursuivre votre préparation dans les meilleures conditions.
              </p>

              <div className="mt-8 grid gap-4">
                {[
                  {
                    title: "Historique des résultats",
                    text: "Retrouvez vos derniers scores et mesurez votre évolution.",
                  },
                  {
                    title: "Expérience plus complète",
                    text: "Accédez plus facilement à vos sessions et à vos statistiques.",
                  },
                  {
                    title: "Préparation continue",
                    text: "Reprenez là où vous vous étiez arrêté, sans repartir de zéro.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.45)] sm:p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                👋 Bon retour
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                Connexion
              </h1>

              <p className="mt-2 text-sm leading-7 text-slate-400">
                Connectez-vous pour retrouver votre espace personnel.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-200">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setError(null);
                    }}
                    className="text-xs font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
              >
                S'inscrire gratuitement
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}