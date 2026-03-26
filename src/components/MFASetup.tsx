"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "react-qr-code";

export default function MFASetup() {
  const [step, setStep] = useState<"idle" | "qr" | "verify" | "done">("idle");
  const [qrUrl, setQrUrl] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMFA, setHasMFA] = useState(false);

  useEffect(() => {
    checkMFA();
  }, []);

  async function checkMFA() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.filter((f) => f.status === "verified") ?? [];
    setHasMFA(verified.length > 0);
  }

  async function startEnroll() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Cap Citoyen",
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setQrUrl(data.totp.qr_code);
    setFactorId(data.id);
    setStep("qr");
    setLoading(false);
  }

  async function verifyCode() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) { setError(challengeError.message); setLoading(false); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    if (verifyError) { setError("Code incorrect. Réessaie."); setLoading(false); return; }
    setStep("done");
    setHasMFA(true);
    setLoading(false);
  }

  async function removeMFA() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const factors = data?.totp?.filter((f) => f.status === "verified") ?? [];
    for (const f of factors) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setHasMFA(false);
    setStep("idle");
  }

  if (hasMFA && step !== "done") {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-sm font-semibold text-emerald-200">2FA activé</p>
              <p className="text-xs text-emerald-300/70">Votre compte est sécurisé</p>
            </div>
          </div>
          <button
            onClick={removeMFA}
            className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
          >
            Désactiver
          </button>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="text-sm font-semibold text-emerald-200">2FA activé avec succès !</p>
        <p className="text-xs text-emerald-300/70 mt-1">Votre compte est maintenant sécurisé.</p>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <p className="text-sm font-semibold text-white">📱 Scanner le QR code</p>
        <p className="text-xs text-slate-400">
          Ouvre Google Authenticator, Authy ou toute app TOTP et scanne ce code.
        </p>
        <div className="flex justify-center bg-white p-3 rounded-xl">
          <QRCode value={qrUrl} size={180} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-300 mb-2 block">
            Entre le code à 6 chiffres généré par l'app
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-white outline-none focus:border-blue-400/30"
            maxLength={6}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => setStep("idle")}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-slate-400 hover:text-white transition"
          >
            Annuler
          </button>
          <button
            onClick={verifyCode}
            disabled={code.length !== 6 || loading}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Confirmer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔓</span>
          <div>
            <p className="text-sm font-semibold text-white">Double authentification</p>
            <p className="text-xs text-slate-400">Renforcez la sécurité de votre compte</p>
          </div>
        </div>
        <button
          onClick={startEnroll}
          disabled={loading}
          className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
        >
          {loading ? "..." : "Activer"}
        </button>
      </div>
    </div>
  );
}