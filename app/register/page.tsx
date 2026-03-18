"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Step = "form" | "otp" | "confirmed";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>(
    searchParams.get("confirmed") ? "confirmed" : "form"
  );
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [username, setUsername] = useState(searchParams.get("pseudo") ?? "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

if (error) {
  if (
    error.message.toLowerCase().includes("already") ||
    error.message.toLowerCase().includes("registered") ||
    error.message.toLowerCase().includes("exists")
  ) {
    setError("Un compte existe déjà avec cet email. Connectez-vous plutôt →");
  } else {
    setError(error.message);
  }
} else {
  setStep("otp");
}
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (error) {
      setError("Code incorrect ou expiré.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ role: "freemium" })
        .eq("id", user.id);
    }

    setStep("confirmed");
    setLoading(false);
  }

  if (step === "confirmed") {
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
                  Compte activé
                </div>

                <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white">
                  Votre espace est prêt. Il ne reste plus qu’à commencer.
                </h1>

                <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                  Votre compte a bien été confirmé. Vous pouvez maintenant vous
                  connecter, retrouver vos résultats et progresser dans de
                  meilleures conditions.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Compte activé avec succès",
                    "Accès à votre espace personnel",
                    "Historique et progression à portée de main",
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
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 text-center shadow-[0_25px_70px_rgba(2,8,23,0.45)] sm:p-8">
              <div className="mb-6 rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-6 text-green-200">
                <p className="mb-3 text-4xl">🎉</p>
                <p className="text-lg font-bold mb-1">Compte confirmé !</p>
                <p className="text-sm leading-7">
                  Bienvenue {username} — vous avez accès à votre espace personnel.
                </p>
              </div>

              <a
                href="/login"
                className="inline-block w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Se connecter maintenant →
              </a>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (step === "otp") {
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
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                  Vérification email
                </div>

                <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white">
                  Une dernière étape pour sécuriser votre compte.
                </h1>

                <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                  Entrez le code reçu à l’adresse indiquée pour confirmer votre
                  inscription et activer votre espace personnel.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Code envoyé à votre adresse email",
                    "Validation rapide de votre inscription",
                    "Activation de votre accès freemium",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-sm">
                        ✦
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
              <div className="mb-6 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  📩 Confirmation
                </div>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                  Confirme ton email
                </h1>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Un code a été envoyé à{" "}
                  <strong className="text-slate-200">{email}</strong>. Entre-le
                  ci-dessous.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Code de confirmation
                  </label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="12345678"
                    maxLength={8}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-2xl tracking-[0.4em] text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
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
                  {loading ? "Vérification..." : "Confirmer mon compte"}
                </button>
              </form>

          <p className="mt-4 text-center text-sm text-slate-400">
  Code non reçu ?{" "}
  <button
    onClick={async () => {
      setError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });
      if (error) {
        setError("Erreur lors du renvoi. Réessaie.");
      } else {
        setError(null);
        alert("Code renvoyé ! Vérifie ta boîte mail.");
      }
    }}
    className="font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
  >
    Renvoyer le code
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
                Inscription gratuite
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white">
                Créez votre compte pour suivre votre progression plus facilement.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                Débloquez votre espace personnel, retrouvez vos résultats et
                préparez-vous dans de meilleures conditions avec une expérience
                plus complète.
              </p>

              <div className="mt-8 grid gap-4">
                {[
                  {
                    title: "Progression plus claire",
                    text: "Conservez vos résultats et visualisez vos efforts au fil du temps.",
                  },
                  {
                    title: "Espace personnel",
                    text: "Retrouvez plus facilement vos sessions, vos scores et vos révisions.",
                  },
                  {
                    title: "Accès immédiat",
                    text: "Une fois l’email confirmé, votre compte est prêt à être utilisé.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-slate-300">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.45)] sm:p-8">
            <div className="mb-6 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                ✨ Nouveau compte
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                Créer un compte
              </h1>

              <p className="mt-2 text-sm leading-7 text-slate-400">
                Gratuit — confirme ton email.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Pseudo
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: carlos92"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>

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
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>

              {error && (
  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
    {error}
    {error.includes("existe déjà") && (
      <a href="/login" className="ml-1 font-semibold text-blue-400 underline hover:text-blue-300">
        Se connecter
      </a>
    )}
  </div>
)}
   
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50"
              >
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-300">
          Chargement...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}