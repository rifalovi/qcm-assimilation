"use client";

import { useState } from "react";
import { useUser } from "./UserContext";
import { saveFeedbackToSupabase } from "@/lib/saveResult";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  pseudo?: string;
  email?: string;
}

const LABELS: Record<number, { emoji: string; text: string; color: string }> = {
  1: { emoji: "😔", text: "Très décevant",    color: "text-red-400"     },
  2: { emoji: "😐", text: "Peut mieux faire", color: "text-orange-400"  },
  3: { emoji: "🙂", text: "Correct",          color: "text-yellow-400"  },
  4: { emoji: "😊", text: "Bien !",           color: "text-emerald-400" },
  5: { emoji: "🤩", text: "Excellent !",      color: "text-blue-400"    },
};

export default function FeedbackModal({ open, onClose, pseudo = "", email = "" }: FeedbackModalProps) {
  const [rating,  setRating]  = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const { role, username, email: authEmail } = useUser();
  const isLoggedIn     = role !== "anonymous" && role !== null;
  const resolvedPseudo = username || pseudo;
  const resolvedEmail  = authEmail || email;

  if (!open) return null;

  /* ── Non connecté ── */
  if (!isLoggedIn) return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xs overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
        <div className="flex h-1 w-full"><div className="flex-1 bg-blue-600"/><div className="flex-1 bg-white/90"/><div className="flex-1 bg-red-600"/></div>
        <button onClick={onClose} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-slate-500 transition hover:text-white text-xs">✕</button>
        <div className="p-6 text-center">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="text-sm font-extrabold text-white">Connectez-vous pour noter</h3>
          <p className="mt-1.5 text-xs text-slate-400 leading-5">Votre avis nous aide à améliorer Cap Citoyen.</p>
          <div className="mt-4 flex flex-col gap-2">
            <a href="/register" onClick={onClose} className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110">Créer un compte gratuit</a>
            <a href="/login" onClick={onClose} className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10">Se connecter</a>
          </div>
        </div>
      </div>
    </div>
  );

  const activeRating = hovered ?? rating;
  const label        = activeRating ? LABELS[activeRating] : null;

  async function handleSubmit() {
    if (!rating || sending) return;
    setSending(true);
    try {
      await saveFeedbackToSupabase({
        email:   resolvedEmail,
        pseudo:  resolvedPseudo || "Anonyme",
        rating,
        comment: comment.trim(),
        page:    "app",
      });
      setSent(true);
      setTimeout(() => { setSent(false); setRating(null); setComment(""); onClose(); }, 2200);
    } catch {
      alert("Impossible d'envoyer l'avis. Réessaie.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xs overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 shadow-[0_32px_80px_rgba(0,0,0,0.7)]">

        {/* Barre tricolore */}
        <div className="flex h-1 w-full">
          <div className="flex-1 bg-blue-600"/><div className="flex-1 bg-white/90"/><div className="flex-1 bg-red-600"/>
        </div>

        {/* Bouton fermer */}
        <button onClick={onClose} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-slate-500 transition hover:bg-white/15 hover:text-white text-xs">✕</button>

        <div className="p-5">
          {sent ? (
            /* ── Confirmation ── */
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="text-5xl">🎉</div>
              <div>
                <p className="text-base font-extrabold text-white">Merci {resolvedPseudo} !</p>
                <p className="mt-1 text-xs text-slate-400">Votre avis a bien été enregistré.</p>
              </div>
            </div>
          ) : (
            <>
              {/* En-tête */}
              <div className="mb-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Cap Citoyen</p>
                <h3 className="mt-1 text-base font-extrabold tracking-tight text-white">Notez votre expérience</h3>
                <p className="mt-1 text-xs text-slate-400 leading-5">Votre avis nous aide à améliorer la plateforme.</p>
              </div>

              {/* Étoiles */}
              <div className="mb-1 flex justify-center gap-2">
                {[1,2,3,4,5].map((n) => {
                  const filled = activeRating !== null && n <= activeRating;
                  return (
                    <button key={n} onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)}
                      className="transition-transform duration-150 hover:scale-110 active:scale-95">
                      <svg width="36" height="36" viewBox="0 0 24 24"
                        className={`transition-all duration-200 ${filled ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]" : "opacity-20"}`}>
                        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
                          fill={filled ? "#fbbf24" : "white"}
                          stroke={filled ? "#f59e0b" : "rgba(255,255,255,0.2)"} strokeWidth="1"/>
                      </svg>
                    </button>
                  );
                })}
              </div>

              {/* Label étoile */}
              <div className="mb-3 h-6 text-center">
                {label && <p className={`text-sm font-semibold ${label.color}`}>{label.emoji} {label.text}</p>}
                {!rating && <p className="text-xs text-slate-600">Touchez une étoile pour noter</p>}
              </div>

              {/* Commentaire */}
              <textarea
                className="w-full min-h-[80px] resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-400/30 focus:outline-none focus:ring-1 focus:ring-blue-400/20 transition"
                placeholder="Un commentaire ? (optionnel)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
              />

              {/* Boutons */}
              <div className="mt-3 flex gap-2">
                <button onClick={handleSubmit} disabled={!rating || sending}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]">
                  {sending ? "Envoi…" : "Envoyer mon avis"}
                </button>
                <button onClick={() => { setRating(null); setComment(""); onClose(); }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white">
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
