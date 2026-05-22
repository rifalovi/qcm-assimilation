"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/posthog";
import { mergeLocalAccountToAuthenticatedUser } from "@/lib/mergeLocalAccount";

type Step = "form" | "otp" | "confirmed";

function TricolorBar() {
  return (
    <div className="flex h-1 w-full">
      <div className="flex-1 bg-[var(--cc-primary)]" />
      <div className="flex-1 bg-white border-y border-[var(--cc-border)]" />
      <div className="flex-1 bg-[var(--cc-danger)]" />
    </div>
  );
}

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>(searchParams.get("confirmed") ? "confirmed" : "form");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [username, setUsername] = useState(searchParams.get("pseudo") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { username: trimmedUsername },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      setError(msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already registered")
        ? "Un compte existe déjà avec cet email."
        : error.message);
      setLoading(false);
      return;
    }
    setEmail(normalizedEmail);
    setUsername(trimmedUsername);
    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "signup" });
    if (error) { setError("Code incorrect ou expiré."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, role: "freemium" });
      await mergeLocalAccountToAuthenticatedUser();
    }
    trackEvent("register_completed", { email });
    setStep("confirmed");
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

  const infoColumn = (title: string, subtitle: string, items: { title: string; text: string }[]) => (
    <section className="hidden lg:block">
      <div className="rounded border border-[var(--cc-border)] bg-white overflow-hidden">
        <TricolorBar />
        <div className="p-8">
          <span className="cc-badge cc-badge-info mb-4 inline-block">Inscription gratuite</span>
          <h1 className="text-2xl font-bold text-[var(--cc-text)]">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--cc-text)]">{subtitle}</p>
          <div className="mt-6 space-y-4">
            {items.map(item => (
              <div key={item.title} className="rounded border border-[var(--cc-border)] bg-[var(--cc-surface-alt)] p-4">
                <h3 className="text-sm font-bold text-[var(--cc-text)]">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--cc-text)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

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

  /* ── ÉTAPE : Confirmé ── */
  if (step === "confirmed") {
    return pageWrapper(
      infoColumn(
        "Bienvenue sur Cap Citoyen.",
        "Votre compte a été confirmé. Vous pouvez maintenant accéder à votre espace personnel.",
        [
          { title: "Compte activé", text: "Votre inscription est confirmée et votre accès Freemium est actif." },
          { title: "Espace personnel", text: "Retrouvez vos résultats, votre progression et vos sessions de révision." },
          { title: "Préparation complète", text: "Accédez aux QCM, fiches, audio et simulation d'examen." },
        ]
      ),
      formColumn(
        <>
          <div className="cc-notice cc-notice-success mb-6">
            <div>
              <p className="font-bold text-[var(--cc-text)]">Compte confirmé</p>
              <p className="text-sm text-[var(--cc-text)]">Bienvenue, {username}. Votre espace est prêt.</p>
            </div>
          </div>
          <a href="/" className="cc-btn cc-btn-primary w-full justify-center no-underline">
            Accéder à mon espace de préparation
          </a>
        </>
      )
    );
  }

  /* ── ÉTAPE : Vérification OTP ── */
  if (step === "otp") {
    return pageWrapper(
      infoColumn(
        "Vérification de votre email",
        `Un code de confirmation a été envoyé à l'adresse ${email}. Vérifiez votre dossier courrier indésirable si nécessaire.`,
        [
          { title: "Code envoyé par email", text: "Entrez le code reçu pour valider votre inscription." },
          { title: "Activation rapide", text: "Une fois le code validé, votre compte est immédiatement actif." },
          { title: "Accès Freemium", text: "Votre compte Freemium vous donne accès aux entraînements de base." },
        ]
      ),
      formColumn(
        <>
          <button
            onClick={() => { setStep("form"); setError(null); setOtp(""); }}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--cc-primary)] hover:underline no-underline"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Modifier l'adresse email
          </button>

          <span className="cc-badge cc-badge-info mb-4 inline-block">Confirmation</span>
          <h1 className="text-2xl font-bold text-[var(--cc-text)]">Confirmez votre adresse email</h1>
          <p className="mt-2 text-sm text-[var(--cc-text-muted)]">
            Code envoyé à <strong className="text-[var(--cc-text)]">{email}</strong>. Entrez-le ci-dessous.
          </p>

          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="otp-input" className="mb-1 block text-sm font-bold text-[var(--cc-text)]">Code de confirmation</label>
              <input
                id="otp-input"
                type="text"
                required
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="12345678"
                maxLength={8}
                className="text-center text-2xl tracking-[0.4em] w-full"
              />
            </div>
            {error && <div role="alert" className="cc-notice cc-notice-error text-sm text-[var(--cc-text)]">{error}</div>}
            <button type="submit" disabled={loading} className="cc-btn cc-btn-primary w-full justify-center">
              {loading ? "Vérification…" : "Confirmer mon compte"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--cc-text-muted)]">
            Code non reçu ?{" "}
            <button
              onClick={async () => {
                setError(null);
                const supabase = createClient();
                const { error } = await supabase.auth.resend({ type: "signup", email });
                if (error) setError("Erreur lors du renvoi. Réessayez.");
              }}
              className="text-[var(--cc-primary)] hover:underline font-medium"
            >
              Renvoyer le code
            </button>
          </p>
        </>
      )
    );
  }

  /* ── ÉTAPE : Formulaire principal ── */
  return pageWrapper(
    infoColumn(
      "Créez votre espace de préparation.",
      "Votre compte gratuit vous permet de conserver vos résultats, de suivre votre progression et de préparer l'entretien civique dans de meilleures conditions.",
      [
        { title: "Progression visible", text: "Conservez vos résultats et visualisez votre évolution au fil du temps." },
        { title: "Espace personnel", text: "Retrouvez facilement vos sessions, vos scores et vos thèmes de révision." },
        { title: "Accès immédiat", text: "Une fois l'email confirmé, votre compte est prêt à être utilisé." },
      ]
    ),
    formColumn(
      <>
        <Link href="/" className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--cc-primary)] hover:underline no-underline">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour à l'accueil
        </Link>

        <span className="cc-badge cc-badge-info mb-4 inline-block">Création de compte</span>
        <h1 className="text-2xl font-bold text-[var(--cc-text)]">Créer un compte</h1>
        <p className="mt-2 text-sm text-[var(--cc-text-muted)]">Gratuit — vérification par email requise.</p>

        <div className="mt-4 rounded border-l-4 border-[var(--cc-border)] bg-[var(--cc-surface-alt)] px-4 py-3 text-xs text-[var(--cc-text-muted)]">
          Vos données sont traitées conformément au RGPD.{" "}
          <Link href="/privacy" className="text-[var(--cc-primary)] hover:underline">En savoir plus</Link>
        </div>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reg-username" className="mb-1 block text-sm font-bold text-[var(--cc-text)]">Pseudo</label>
            <input
              id="reg-username"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="ex : carlos92"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="mb-1 block text-sm font-bold text-[var(--cc-text)]">Adresse email</label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              autoComplete="email"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="mb-1 block text-sm font-bold text-[var(--cc-text)]">Mot de passe</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                autoComplete="new-password"
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] transition-colors"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="cc-notice cc-notice-error text-sm text-[var(--cc-text)]">
              {error}
              {error.includes("existe déjà") && (
                <> — <Link href="/login" className="font-bold text-[var(--cc-primary)] hover:underline">Se connecter</Link></>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="cc-btn cc-btn-primary w-full justify-center">
            {loading ? "Création…" : "Créer mon compte"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--cc-border)]" />
            <span className="text-xs text-[var(--cc-text-disabled)]">ou</span>
            <div className="flex-1 h-px bg-[var(--cc-border)]" />
          </div>

          <button type="button" onClick={handleGoogleLogin}
            className="cc-btn cc-btn-secondary w-full justify-center gap-3">
            <GoogleIcon />
            Continuer avec Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--cc-text-muted)]">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-bold text-[var(--cc-primary)] hover:underline">
            Se connecter
          </Link>
        </p>
      </>
    )
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center text-[var(--cc-text-muted)]">
        Chargement…
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
