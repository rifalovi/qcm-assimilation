"use client";
import { useState } from "react";
import Link from "next/link";

const SUBJECTS = [
  { group: "Compte & Accès", options: [
    "Problème de connexion",
    "Problème d'inscription",
    "Mot de passe oublié / réinitialisation",
  ]},
  { group: "Abonnement & Paiement", options: [
    "Difficulté à souscrire un abonnement",
    "Question sur les tarifs",
    "Demande de remboursement",
  ]},
  { group: "Contenu & Fonctionnalités", options: [
    "Erreur dans une question ou réponse",
    "Contenu audio indisponible",
    "Bug ou problème technique",
  ]},
  { group: "Préparation & Pédagogie", options: [
    "Question sur l'entretien de naturalisation",
    "Demande de contenu supplémentaire",
    "Suggestion d'amélioration",
  ]},
  { group: "Partenariat & Professionnel", options: [
    "Proposer un partenariat",
    "Travailler avec Cap Citoyen",
    "Presse / Médias",
  ]},
  { group: "Autre", options: ["Autre demande"] },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const isOther = subject === "Autre demande";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) { setStatus("success"); return; }
    setLoading(true);
    setStatus("idle");

    const finalSubject = isOther ? customSubject : subject;

    try {
      const res = await fetch("https://formsubmit.co/ajax/contact@cap-citoyen.fr", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject: finalSubject,
          message,
          _subject: `[Cap Citoyen] ${finalSubject}`,
          _captcha: "false",
          _honey: "",
          _template: "box",
        }),
      });
      if (res.ok) {
        setStatus("success");
        setName(""); setEmail(""); setSubject(""); setCustomSubject(""); setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">
          Contact
        </div>
        <h1 className="text-3xl font-extrabold text-white">Nous contacter</h1>
        <p className="mt-2 text-sm text-slate-400">
          Une question, un problème ou une suggestion ? Écrivez-nous.
        </p>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 sm:p-8">
        {status === "success" ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Message envoyé !</h2>
            <p className="text-sm text-slate-400 mb-6">Nous vous répondrons dans les plus brefs délais à l'adresse indiquée.</p>
            <button
              onClick={() => setStatus("idle")}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Votre nom"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/40 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/40 focus:outline-none"
              />
            </div>

            {/* Objet */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Objet</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-400/40 focus:outline-none"
              >
                <option value="">-- Sélectionnez un objet --</option>
                {SUBJECTS.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Objet personnalisé si Autre */}
            {isOther && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Précisez votre demande</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  required
                  placeholder="Décrivez brièvement votre demande"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/40 focus:outline-none"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Décrivez votre demande en détail..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/40 focus:outline-none resize-none"
              />
            </div>

            {/* Honeypot anti-bot — invisible pour les humains */}
            <div style={{ display: "none" }} aria-hidden="true">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {status === "error" && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Une erreur est survenue. Réessayez ou écrivez directement à contact@cap-citoyen.fr
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Envoyer le message"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Ou écrivez directement à{" "}
              <a href="mailto:contact@cap-citoyen.fr" className="text-blue-400 hover:underline">
                contact@cap-citoyen.fr
              </a>
            </p>
          </form>
        )}
      </div>

      <div className="mt-6 flex justify-center gap-6 text-xs text-slate-500">
        <Link href="/mentions-legales" className="hover:text-slate-300 transition">Mentions légales</Link>
        <Link href="/cgv" className="hover:text-slate-300 transition">CGV</Link>
        <Link href="/" className="hover:text-slate-300 transition">Retour à l'accueil</Link>
      </div>
    </main>
  );
}
