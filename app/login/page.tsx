"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mergeLocalAccountToAuthenticatedUser } from "@/lib/mergeLocalAccount";

type Mode = "login" | "forgot" | "otp" | "newpassword" | "totp";

function TricolorBar() {
  return (
    <div className="flex h-1 w-full">
      <div className="flex-1 bg-[var(--cc-primary)]" />
      <div className="flex-1 bg-white border-y border-[var(--cc-border)]" />
      <div className="flex-1 bg-[var(--cc-danger)]" />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--cc-primary)] hover:text-[var(--cc-primary-hover)] no-underline hover:underline">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Retour à l'accueil
    </Link>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div role="alert" className="cc-notice cc-notice-error text-sm text-[var(--cc-text)]">{message}</div>
  );
}

function SuccessNotice({ message }: { message: string }) {
  return (
    <div role="status" className="cc-notice cc-notice-success text-sm text-[var(--cc-text)]">{message}</div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectIfAuthenticated() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { router.push("/"); router.refresh(); }
    }
    redirectIfAuthenticated();
  }, [router]);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("not found")
          ? "Aucun compte trouvé avec cet email."
          : "Email ou mot de passe incorrect."
      );
      setLoading(false);
      return;
    }
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const totpFactor = factorsData?.totp?.find(f => f.factor_type === "totp" && f.status === "verified");
    if (totpFactor) { setTotpFactorId(totpFactor.id); setMode("totp"); setLoading(false); return; }
    await mergeLocalAccountToAuthenticatedUser();
    router.push("/"); router.refresh();
  }

  async function handleVerifyTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!totpFactorId) return;
    setLoading(true); setError(null);
    const supabase = createClient();
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactorId });
    if (challengeError || !challengeData) { setError("Erreur lors de la vérification 2FA."); setLoading(false); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: totpFactorId, challengeId: challengeData.id, code: totpCode });
    if (verifyError) { setError("Code incorrect ou expiré."); setLoading(false); return; }
    router.push("/"); router.refresh();
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) { setError("Erreur : " + error.message); setLoading(false); return; }
    setSuccess("Code envoyé. Vérifiez votre boîte de réception.");
    setMode("otp"); setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) { setError("Code incorrect ou expiré."); setLoading(false); return; }
    setMode("newpassword"); setSuccess(null); setLoading(false);
  }

  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setError("Erreur : " + error.message); setLoading(false); return; }
    await supabase.auth.signInWithPassword({ email, password: newPassword });
    await mergeLocalAccountToAuthenticatedUser();
    setSuccess("Mot de passe mis à jour. Redirection en cours…");
    setTimeout(() => { router.push("/"); router.refresh(); }, 1500);
    setLoading(false);
  }

  /* ── Layout partagé ── */
  const pageWrapper = (left: React.ReactNode, right: React.ReactNode) => (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
        {left}
        {right}
      </div>
    </main>
  );

  /* ── Colonne gauche ── */
  const infoColumn = (title: string, subtitle: string, items: string[]) => (
    <section className="hidden lg:block">
      <div className="rounded border border-[var(--cc-border)] bg-white overflow-hidden">
        <TricolorBar />
        <div className="p-8">
          <span className="cc-badge cc-badge-info mb-4 inline-block">Connexion sécurisée</span>
          <h1 className="text-2xl font-bold text-[var(--cc-text)]">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--cc-text)]">{subtitle}</p>
          <ul className="mt-6 space-y-3">
            {items.map(item => (
              <li key={item} className="flex items-start gap-3 rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-[var(--cc-success)]" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm text-[var(--cc-text)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  /* ── Colonne formulaire ── */
  const formColumn = (children: React.ReactNode) => (
    <section className="w-full">
      <div className="rounded border border-[var(--cc-border)] bg-white overflow-hidden">
        <TricolorBar />
        <div className="p-6 sm:p-8">
          {children}
        </div>
      </div>
    </section>
  );

  /* ── MODE TOTP ── */
  if (mode === "totp") {
    return pageWrapper(
      infoColumn(
        "Double authentification",
        "Votre compte est protégé par la double authentification. Ouvrez votre application (Google Authenticator, Authy) et entrez le code à 6 chiffres.",
        ["Code valable 30 secondes", "Ne jamais partager ce code", "Utilisez Google Authenticator ou Authy"]
      ),
      formColumn(
        <>
          <BackLink />
          <span className="cc-badge cc-badge-info mb-4 inline-block">Vérification 2FA</span>
          <h1 className="text-2xl font-bold text-[var(--cc-text)]">Double authentification</h1>
          <p className="mt-2 text-sm text-[var(--cc-text-muted)]">Entrez le code à 6 chiffres de votre application.</p>
          <form onSubmit={handleVerifyTotp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="totp-code" className="mb-1 block text-sm font-bold text-[var(--cc-text)]">Code à 6 chiffres</label>
              <input
                id="totp-code"
                type="text"
                required
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center text-2xl tracking-[0.5em] w-full"
              />
            </div>
            {error && <ErrorNotice message={error} />}
            <button type="submit" disabled={loading || totpCode.length !== 6}
              className="cc-btn cc-btn-primary w-full justify-center">
              {loading ? "Vérification…" : "Valider le code"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm">
            <button onClick={() => { setMode("login"); setError(null); setTotpCode(""); }}
              className="text-[var(--cc-primary)] hover:underline font-medium">
              Retour à la connexion
            </button>
          </p>
        </>
      )
    );
  }

  /* ── MODE FORGOT ── */
  if (mode === "forgot") {
    return pageWrapper(
      infoColumn(
        "Réinitialisation du mot de passe",
        "Entrez votre adresse email pour recevoir un code à 8 chiffres et réinitialiser votre mot de passe directement sur le site.",
        ["Code envoyé par email", "Réinitialisation simple et sécurisée", "Retour rapide à vos entraînements"]
      ),
      formColumn(
        <>
          <BackLink />
          <span className="cc-badge cc-badge-info mb-4 inline-block">Mot de passe oublié</span>
          <h1 className="text-2xl font-bold text-[var(--cc-text)]">Réinitialiser le mot de passe</h1>
          <p className="mt-2 text-sm text-[var(--cc-text-muted)]">Vous recevrez un code à 8 chiffres — aucun lien à cliquer.</p>
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="forgot-email" className="mb-1 block text-sm font-bold text-[var(--cc-text)]">Adresse email</label>
              <input id="forgot-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" className="w-full" />
            </div>
            {error && <ErrorNotice message={error} />}
            <button type="submit" disabled={loading} className="cc-btn cc-btn-primary w-full justify-center">
              {loading ? "Envoi…" : "Envoyer le code"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm">
            <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
              className="text-[var(--cc-primary)] hover:underline font-medium">
              Retour à la connexion
            </button>
          </p>
        </>
      )
    );
  }

  /* ── MODE OTP ── */
  if (mode === "otp") {
    return pageWrapper(
      infoColumn(
        "Vérification en cours",
        `Un code à 8 chiffres a été envoyé à l'adresse ${email}. Vérifiez aussi votre dossier courrier indésirable.`,
        ["Vérifiez votre boîte de réception", "Vérifiez le dossier spam si nécessaire", "Le code expire rapidement"]
      ),
      formColumn(
        <>
          <BackLink />
          <span className="cc-badge cc-badge-info mb-4 inline-block">Code envoyé</span>
          <h1 className="text-2xl font-bold text-[var(--cc-text)]">Entrez votre code</h1>
          {success && <SuccessNotice message={success} />}
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="otp-code" className="mb-1 block text-sm font-bold text-[var(--cc-text)]">Code à 8 chiffres</label>
              <input id="otp-code" type="text" required value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="12345678" maxLength={8}
                className="text-center text-2xl tracking-[0.5em] w-full" />
            </div>
            {error && <ErrorNotice message={error} />}
            <button type="submit" disabled={loading} className="cc-btn cc-btn-primary w-full justify-center">
              {loading ? "Vérification…" : "Valider le code"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-[var(--cc-text-muted)]">
            Code non reçu ?{" "}
            <button onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
              className="text-[var(--cc-primary)] hover:underline font-medium">
              Renvoyer
            </button>
          </p>
        </>
      )
    );
  }

  /* ── MODE NEW PASSWORD ── */
  if (mode === "newpassword") {
    return pageWrapper(
      infoColumn(
        "Dernière étape",
        "Code vérifié. Choisissez maintenant un nouveau mot de passe sécurisé pour votre compte.",
        ["Minimum 8 caractères", "Utilisez une combinaison lettres / chiffres", "Ne réutilisez pas un mot de passe existant"]
      ),
      formColumn(
        <>
          <BackLink />
          <span className="cc-badge cc-badge-success mb-4 inline-block">Code validé</span>
          <h1 className="text-2xl font-bold text-[var(--cc-text)]">Nouveau mot de passe</h1>
          <form onSubmit={handleNewPassword} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-bold text-[var(--cc-text)]">Nouveau mot de passe</label>
              <input id="new-password" type="password" required minLength={8} value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="8 caractères minimum" className="w-full" />
            </div>
            {error && <ErrorNotice message={error} />}
            {success && <SuccessNotice message={success} />}
            <button type="submit" disabled={loading} className="cc-btn cc-btn-primary w-full justify-center">
              {loading ? "Mise à jour…" : "Enregistrer le mot de passe"}
            </button>
          </form>
        </>
      )
    );
  }

  /* ── MODE LOGIN (défaut) ── */
  return pageWrapper(
    infoColumn(
      "Content de vous revoir.",
      "Connectez-vous pour retrouver vos résultats, suivre votre progression et poursuivre votre préparation.",
      [
        "Historique de vos scores et de votre progression",
        "Reprenez là où vous vous étiez arrêté",
        "Accès à votre espace personnel complet",
      ]
    ),
    formColumn(
      <>
        <BackLink />
        <span className="cc-badge cc-badge-info mb-4 inline-block">Espace citoyen</span>
        <h1 className="text-2xl font-bold text-[var(--cc-text)]">Connexion</h1>
        <p className="mt-2 text-sm text-[var(--cc-text-muted)]">
          Connectez-vous pour accéder à votre espace de préparation.
        </p>

        <div className="mt-5 rounded border-l-4 border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3 text-xs text-[var(--cc-text-muted)]">
          Vos données personnelles sont traitées conformément au RGPD.{" "}
          <Link href="/privacy" className="text-[var(--cc-primary)] hover:underline">
            En savoir plus
          </Link>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-bold text-[var(--cc-text)]">Adresse email</label>
            <input id="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.fr" autoComplete="email" className="w-full" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label htmlFor="login-password" className="block text-sm font-bold text-[var(--cc-text)]">Mot de passe</label>
              <button type="button" onClick={() => { setMode("forgot"); setError(null); }}
                className="text-xs text-[var(--cc-primary)] hover:underline">
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] transition-colors"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="cc-notice cc-notice-error text-sm text-[var(--cc-text)]">
              {error}
              {error.includes("Aucun compte") && (
                <> — <Link href="/register" className="font-bold text-[var(--cc-primary)] hover:underline">Créer un compte</Link></>
              )}
              {error.includes("incorrect") && (
                <> — <button type="button" onClick={() => { setMode("forgot"); setError(null); }} className="font-bold text-[var(--cc-primary)] hover:underline">Mot de passe oublié ?</button></>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="cc-btn cc-btn-primary w-full justify-center">
            {loading ? "Connexion…" : "Se connecter"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--cc-border)]" />
            <span className="text-xs text-[var(--cc-text-disabled)]">ou</span>
            <div className="flex-1 h-px bg-[var(--cc-border)]" />
          </div>

          <button type="button" onClick={handleGoogleLogin}
            className="cc-btn cc-btn-secondary w-full justify-center gap-3">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuer avec Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--cc-text-muted)]">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-bold text-[var(--cc-primary)] hover:underline">
            Créer un compte gratuitement
          </Link>
        </p>
      </>
    )
  );
}
