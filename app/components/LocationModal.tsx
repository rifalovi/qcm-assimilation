"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/posthog";

type Props = { userId: string; onClose: () => void };

export default function LocationModal({ userId, onClose }: Props) {
  const supabase = createClient();
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    await supabase.from("profiles").update({
      city: city.trim() || null,
      postal_code: postalCode.trim() || null,
      has_seen_location_modal: true,
    }).eq("id", userId);

    trackEvent("location_collected", { city, postal_code: postalCode });
    setLoading(false);
    onClose();
  }

  async function handleSkip() {
    await supabase.from("profiles").update({ has_seen_location_modal: true }).eq("id", userId);
    trackEvent("location_skipped");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />
      <div className="relative w-full max-w-md rounded-[1.5rem] border p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
        <div className="mb-1 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-300">
          Personnalisation
        </div>
        <h2 className="mt-3 text-xl font-extrabold" style={{ color: "var(--cc-text)" }}>
          Où vous préparez-vous ?
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>
          Ces informations nous permettent de vous proposer des contenus adaptés à votre région et d'améliorer l'application. Elles restent confidentielles.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Ville</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex : Paris, Lyon, Marseille..."
              className="w-full rounded-xl border px-4 py-2.5 text-sm placeholder:opacity-50 focus:border-blue-400/40 focus:outline-none" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text)" }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Code postal <span style={{ color: "var(--cc-text-disabled)" }}>(optionnel)</span></label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Ex : 75001"
              maxLength={5}
              className="w-full rounded-xl border px-4 py-2.5 text-sm placeholder:opacity-50 focus:border-blue-400/40 focus:outline-none" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text)" }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            onClick={handleSubmit}
            disabled={loading || !city.trim()}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-40"
          >
            {loading ? "Enregistrement..." : "Enregistrer ma localisation"}
          </button>
          <button
            onClick={handleSkip}
            className="rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:text-white" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
          >
            Plus tard
          </button>
        </div>
        <p className="mt-3 text-center text-[10px]" style={{ color: "var(--cc-text-disabled)" }}>
          Vos données sont stockées de façon sécurisée et ne sont jamais revendues.
        </p>
      </div>
    </div>
  );
}
