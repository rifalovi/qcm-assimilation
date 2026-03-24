"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MFASetup from "../../src/components/MFASetup";
import { VoiceSelector } from "@/components/VoiceSelector";

type Role = "anonymous" | "freemium" | "premium" | "elite";

type Profile = {
  username: string;
  role: Role;
};

type Subscription = {
  status: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
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
    description: "10 questions • Pas de sauvegarde",
    icon: "👤",
  },
  freemium: {
    label: "Freemium",
    color: "border-blue-400/20 bg-blue-500/10 text-blue-200",
    description: "20 questions • Score sauvegardé • Niveau 1",
    icon: "✨",
  },
  premium: {
    label: "Premium",
    color: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    description: "Accès complet • Tous niveaux • Stats détaillées",
    icon: "🎯",
  },
  elite: {
    label: "Élite",
    color: "border-yellow-400/20 bg-yellow-500/10 text-yellow-200",
    description: "Accès à vie • Contenu exclusif expert • Support prioritaire",
    icon: "👑",
  },
};

function StatCard({ label, value, accent = "blue" }: {
  label: string; value: string; accent?: "blue" | "emerald" | "amber";
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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email ?? "");

      const { data: profileData } = await supabase
        .from("profiles").select("username, role").eq("id", user.id).single();
      if (profileData) setProfile(profileData);

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("status, expires_at, stripe_customer_id, stripe_subscription_id")
        .eq("user_id", user.id).single();
      if (subData) setSubscription(subData);

      const { data: resultsData } = await supabase
        .from("results")
        .select("id, score_correct, score_total, score_percent, passed, level, themes, mode, created_at")
        .eq("email", user.email)
        .order("created_at", { ascending: false }).limit(20);
      if (resultsData) setResults(resultsData);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleUpgrade() {
    const res = await fetch("/api/create-checkout", { method: "POST" });
    const { url, error } = await res.json();
    if (error) return;
    window.location.href = url;
  }

  async function handleUpgradeElite() {
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "elite" }),
    });
    const { url, error } = await res.json();
    if (error) return;
    window.location.href = url;
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/create-portal", { method: "POST" });
      if (!res.ok) { alert("Erreur serveur. Réessayez."); setPortalLoading(false); return; }
      const { url, error } = await res.json();
      setPortalLoading(false);
      if (error) { alert("Impossible d'accéder au portail : " + error); return; }
      window.location.href = url;
    } catch {
      setPortalLoading(false);
      alert("Erreur de connexion. Réessayez.");
    }
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) { setPasswordMsg("Les mots de passe ne correspondent pas."); return; }
    if (newPassword.length < 8) { setPasswordMsg("Minimum 8 caractères."); return; }
    setPasswordLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) { setPasswordMsg("Erreur : " + error.message); return; }
    setPasswordMsg("✓ Mot de passe mis à jour !");
    setTimeout(() => { setShowPasswordModal(false); setNewPassword(""); setConfirmPassword(""); setPasswordMsg(""); }, 2000);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "SUPPRIMER") return;
    setDeleting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Supprimer les données utilisateur
    await supabase.from("results").delete().eq("email", user.email ?? "");
    await supabase.from("subscriptions").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    // Déconnexion
    await supabase.auth.signOut();
    router.push("/");
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

  // Calcul jours restants Premium
  const daysLeft = useMemo(() => {
    if (!subscription?.expires_at) return null;
    const diff = new Date(subscription.expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-120px)] max-w-5xl items-center justify-center px-4 py-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-8 text-center text-slate-300">
          Chargement...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pt-3 pb-6 sm:px-6 sm:pt-4 sm:pb-8">
      <div className="space-y-6">

        {/* ── PROFIL ── */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-blue-600" /><div className="flex-1 bg-white" /><div className="flex-1 bg-red-600" />
          </div>
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative p-5 sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {profile?.username ?? "Mon compte"}
                  </h1>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleConfig.color}`}>
                    <span>{roleConfig.icon}</span>{roleConfig.label}
                  </span>
                </div>
                <p className="mt-2 break-all text-sm text-slate-300">{email}</p>
                <p className="mt-1 text-xs text-slate-400">{roleConfig.description}</p>
                <Link href="/pricing" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition">
                  👑 Voir les tarifs & abonnements →
                </Link>
              </div>
            </div>

            {/* ── Badge abonnement ── */}
            {role === "elite" && (
              <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <p className="text-sm font-bold text-yellow-200">Accès Élite — À vie</p>
                    <p className="text-xs text-yellow-300/70">Paiement unique · Toutes les mises à jour incluses · Contenu expert exclusif</p>
                  </div>
                </div>
              </div>
            )}

            {role === "premium" && (
              <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-sm font-bold text-blue-200">Abonnement Premium actif</p>
                      {daysLeft !== null && (
                        <p className="text-xs text-blue-300/70">
                          {daysLeft > 0
                            ? `⏳ Expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""} — ${new Date(subscription!.expires_at!).toLocaleDateString("fr-FR")}`
                            : "⚠️ Abonnement expiré"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handlePortal} disabled={portalLoading}
                      className="rounded-xl border border-blue-400/20 bg-blue-500/15 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/25 disabled:opacity-50">
                      {portalLoading ? "Redirection..." : "⚙️ Gérer mon abonnement"}
                    </button>
                    <button onClick={handleUpgradeElite}
                      className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 px-4 py-2 text-xs font-semibold text-yellow-200 transition hover:bg-yellow-500/20">
                      👑 Passer en Élite
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(role !== "premium" && role !== "elite") && (
              <div className="mt-6 rounded-[1.5rem] border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-amber-100">Passer en Premium</p>
                    <p className="mt-1 text-xs text-amber-200/80">Accès complet — tous niveaux, mode examen, statistiques détaillées</p>
                  </div>
                  <button onClick={handleUpgrade}
                    className="rounded-xl border border-amber-400/20 bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                    Passer en Premium →
                  </button>
                </div>
              </div>
            )}

            {/* ── Voix audio ── */}
            {(role === "premium" || role === "elite") && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Voix audio</p>
                  <button onClick={() => { const last = localStorage.getItem("last_audio_page"); router.push(last ?? "/audio"); }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 transition hover:text-blue-300">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Retour à la lecture
                  </button>
                </div>
                <VoiceSelector />
              </div>
            )}

            {/* ── Sécurité ── */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Sécurité</p>
              <MFASetup />
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        {quickStats && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Tests effectués" value={String(quickStats.totalTests)} accent="blue" />
            <StatCard label="Meilleur score" value={quickStats.bestScore} accent="emerald" />
            <StatCard label="Tests réussis" value={String(quickStats.passedCount)} accent="amber" />
          </section>
        )}

        {/* ── HISTORIQUE ── */}
        <section className="rounded-[1.8rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_18px_45px_rgba(2,8,23,0.28)]">
          <h2 className="text-lg font-bold text-white">Historique des résultats</h2>
          {results.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">Aucun résultat pour l&apos;instant.</p>
              <Link href="/" className="mt-3 inline-block text-sm font-medium text-blue-400 transition hover:text-blue-300 hover:underline">Faire un test →</Link>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:bg-white/[0.07]">
                  <span className={`shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-semibold ${r.mode === "exam" ? "border border-red-400/20 bg-red-500/10 text-red-200" : "border border-blue-400/20 bg-blue-500/10 text-blue-200"}`}>
                    {r.mode === "exam" ? "Exam" : "Train"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white">{r.score_correct}/{r.score_total} — {(r.score_percent ?? 0).toFixed(0)}%</p>
                    <p className="truncate text-[10px] text-slate-500">Niv.{r.level} • {Array.isArray(r.themes) ? r.themes.join(", ") : r.themes}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`rounded-lg px-1.5 py-0.5 text-[10px] font-semibold ${r.passed ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border border-red-400/20 bg-red-500/10 text-red-200"}`}>
                      {r.passed ? "✓ OK" : "✗"}
                    </span>
                    <p className="mt-0.5 text-[10px] text-slate-500">{new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── ACTIONS ── */}
        <section className="flex flex-wrap justify-center gap-3">
          <Link href="/results" className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-5 py-2.5 text-sm font-medium text-blue-200 transition hover:bg-blue-500/15">
            Voir le dernier résultat
          </Link>
          <button onClick={() => setShowPasswordModal(true)}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10">
            🔑 Changer le mot de passe
          </button>
          <button onClick={handleLogout}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10">
            🚪 Déconnexion
          </button>
          <button onClick={() => setShowDeleteModal(true)}
            className="rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15">
            🗑️ Supprimer mon compte
          </button>
        </section>

      </div>

      {/* ── MODAL Changer mot de passe ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/98 to-slate-900/98 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.6)]">
            <h3 className="text-lg font-bold text-white mb-1">Changer le mot de passe</h3>
            <p className="text-xs text-slate-400 mb-5">Minimum 8 caractères.</p>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30 mb-3" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30" />
            {passwordMsg && (
              <p className={`mt-3 text-xs ${passwordMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{passwordMsg}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowPasswordModal(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10">
                Annuler
              </button>
              <button onClick={handlePasswordChange} disabled={passwordLoading}
                className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50">
                {passwordLoading ? "En cours..." : "Mettre à jour"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL Supprimer compte ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-md rounded-[2rem] border border-red-400/20 bg-gradient-to-b from-slate-800/98 to-slate-900/98 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.6)]">
            <div className="mb-4 text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-bold text-white">Supprimer mon compte</h3>
              <p className="mt-2 text-sm text-slate-400 leading-6">
                Cette action est <span className="font-semibold text-red-300">irréversible</span>. Toutes vos données seront supprimées — historique, résultats, abonnement.
              </p>
            </div>
            <p className="mb-2 text-xs text-slate-400">Tapez <span className="font-bold text-red-300">SUPPRIMER</span> pour confirmer :</p>
            <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full rounded-2xl border border-red-400/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-red-400/40" />
            <div className="mt-5 flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10">
                Annuler
              </button>
              <button onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "SUPPRIMER" || deleting}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-30">
                {deleting ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
