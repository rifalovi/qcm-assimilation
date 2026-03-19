"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "forgot" | "otp" | "newpassword";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
   if (error) {
  setError(
    error.message.toLowerCase().includes("not found")
      ? "Aucun compte trouvé avec cet email."
      : "Email ou mot de passe incorrect."
  );
}
    router.push("/");
    router.refresh();
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      setError("Erreur : " + error.message);
      setLoading(false);
      return;
    }
    setSuccess("Code envoyé ! Vérifie ta boîte mail.");
    setMode("otp");
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) {
      setError("Code incorrect ou expiré.");
      setLoading(false);
      return;
    }
    setMode("newpassword");
    setSuccess(null);
    setLoading(false);
  }

  async function handleNewPassword(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  setError(null);
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    setError("Erreur : " + error.message);
    setLoading(false);
    return;
  }
  // Connexion automatique après reset
  await supabase.auth.signInWithPassword({ email, password: newPassword });
  setSuccess("Mot de passe mis à jour ! Redirection...");
  setTimeout(() => { router.push("/"); router.refresh(); }, 1500);
  setLoading(false);
}

  // ===== MODE FORGOT =====
  if (mode === "forgot") {
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
                  Retrouvez l'accès à votre compte en quelques instants.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                  Entrez votre adresse email pour recevoir un code à 8 chiffres et réinitialiser votre mot de passe sans quitter le site.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    "Code envoyé directement par email",
                    "Réinitialisation simple et sécurisée",
                    "Retour rapide vers vos entraînements",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-sm">✓</span>
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
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Réinitialiser le mot de passe</h1>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Tu recevras un code à 8 chiffres par email — pas de lien à cliquer.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"/>
                </div>
                {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
                <button type="submit" disabled={loading}
                  className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50">
                  {loading ? "Envoi..." : "Envoyer le code"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                  className="font-medium text-blue-400 transition hover:text-blue-300 hover:underline">
                  Retour à la connexion
                </button>
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ===== MODE OTP =====
  if (mode === "otp") {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="hidden lg:block">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 p-8 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
              <div className="flex h-1.5 w-full">
                <div className="flex-1 bg-blue-600" /><div className="flex-1 bg-white" /><div className="flex-1 bg-red-600" />
              </div>
              <div className="relative pt-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                  Vérification en cours
                </div>
                <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white">
                  Entre le code reçu par email.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                  Un code à 8 chiffres a été envoyé à <strong className="text-white">{email}</strong>. Vérifie aussi ton dossier spam.
                </p>
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.45)] sm:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  📩 Code envoyé
                </div>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Entre ton code</h1>
                {success && <div className="mt-3 rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">{success}</div>}
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Code à 8 chiffres</label>
                  <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)}
                    placeholder="12345678" maxLength={8}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-2xl tracking-[0.5em] text-white placeholder:text-slate-600 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"/>
                </div>
                {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
                <button type="submit" disabled={loading}
                  className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50">
                  {loading ? "Vérification..." : "Valider le code"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                Code non reçu ?{" "}
                <button onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
                  className="font-medium text-blue-400 transition hover:text-blue-300 hover:underline">
                  Renvoyer
                </button>
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ===== MODE NEW PASSWORD =====
  if (mode === "newpassword") {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="hidden lg:block">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 p-8 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
              <div className="flex h-1.5 w-full">
                <div className="flex-1 bg-blue-600" /><div className="flex-1 bg-white" /><div className="flex-1 bg-red-600" />
              </div>
              <div className="relative pt-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                  Dernière étape
                </div>
                <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white">
                  Choisis ton nouveau mot de passe.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                  Code vérifié avec succès. Tu peux maintenant définir un nouveau mot de passe sécurisé.
                </p>
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.45)] sm:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  🔑 Nouveau mot de passe
                </div>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Choisir un mot de passe</h1>
              </div>

              <form onSubmit={handleNewPassword} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Nouveau mot de passe</label>
                  <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"/>
                </div>
                {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
                {success && <div className="rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">{success}</div>}
                <button type="submit" disabled={loading}
                  className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50">
                  {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ===== MODE LOGIN (défaut) =====
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
                Heureux de vous revoir sur votre plateforme d'entraînement.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                Connectez-vous pour retrouver vos résultats, suivre votre progression
                et poursuivre votre préparation dans les meilleures conditions.
              </p>
              <div className="mt-8 grid gap-4">
                {[
                  { title: "Historique des résultats", text: "Retrouvez vos derniers scores et mesurez votre évolution." },
                  { title: "Expérience plus complète", text: "Accédez plus facilement à vos sessions et à vos statistiques." },
                  { title: "Préparation continue", text: "Reprenez là où vous vous étiez arrêté, sans repartir de zéro." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
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
            <a href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Retour à l'accueil
            </a>
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                👋 Bon retour
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Connexion</h1>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Connectez-vous pour retrouver votre espace personnel.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"/>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-200">Mot de passe</label>
                  <button type="button" onClick={() => { setMode("forgot"); setError(null); }}
                    className="text-xs font-medium text-blue-400 transition hover:text-blue-300 hover:underline">
                    Mot de passe oublié ?
                  </button>
                </div>
<div className="relative">
  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 focus:ring-2 focus:ring-blue-400/20"
    placeholder="••••••••"
  />
  <button type="button" onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-70 hover:opacity-100 transition">
    {showPassword ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )}
  </button>
</div>
</div>

              {error && (
  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
    {error}
    {error.includes("Aucun compte") && (
      <a href="/register" className="ml-1 font-semibold text-blue-400 underline">
        Créer un compte
      </a>
    )}
    {error.includes("incorrect") && (
      <a href="/login?forgot=true" className="ml-1 font-semibold text-blue-400 underline">
        Mot de passe oublié ?
      </a>
    )}
  </div>
)}
              <button type="submit" disabled={loading}
                className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50">
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Pas encore de compte ?{" "}
              <Link href="/register" className="font-medium text-blue-400 transition hover:text-blue-300 hover:underline">
                S'inscrire gratuitement
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
