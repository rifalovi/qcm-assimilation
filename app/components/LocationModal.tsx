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
      <div className="relative w-full max-w-md rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
        <div className="mb-1 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-300">
          Personnalisation
        </div>
        <h2 className="mt-3 text-xl font-extrabold text-white">
          Où vous préparez-vous ?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Ces informations nous permettent de vous proposer des contenus adaptés à votre région et d'améliorer l'application. Elles restent confidentielles.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">Ville</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex : Paris, Lyon, Marseille..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">Code postal <span className="text-slate-500">(optionnel)</span></label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Ex : 75001"
              maxLength={5}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/40 focus:outline-none"
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
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-400 transition hover:text-white"
          >
            Plus tard
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-500">
          Vos données sont stockées de façon sécurisée et ne sont jamais revendues.
        </p>
      </div>
    </div>
  );
}
