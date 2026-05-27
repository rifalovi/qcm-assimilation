"use client";
import { useState } from "react";
import Link from "next/link";
import StoreButtons from "../components/StoreButtons";

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
        <div className="inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4" style={{ borderColor: "var(--cc-primary)", color: "var(--cc-primary)", background: "var(--cc-primary-soft)" }}>
          Contact
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: "var(--cc-text)" }}>Nous contacter</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--cc-text-muted)" }}>
          Une question, un problème ou une suggestion ? Écrivez-nous.
        </p>
      </div>

      <div className="rounded-[1.8rem] border p-6 sm:p-8" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
        {status === "success" ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--cc-text)" }}>Message envoyé !</h2>
            <p className="text-sm mb-6" style={{ color: "var(--cc-text-muted)" }}>Nous vous répondrons dans les plus brefs délais à l'adresse indiquée.</p>
            <button
              onClick={() => setStatus("idle")}
              className="cc-btn cc-btn-secondary px-6 py-2.5 text-sm"
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Votre nom"
                className="w-full"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                className="w-full"
              />
            </div>

            {/* Objet */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Objet</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                className="w-full"
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
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Précisez votre demande</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  required
                  placeholder="Décrivez brièvement votre demande"
                  className="w-full"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--cc-text-muted)" }}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Décrivez votre demande en détail..."
                className="w-full resize-none"
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
              <div className="cc-notice cc-notice-danger text-sm">
                Une erreur est survenue. Réessayez ou écrivez directement à contact@cap-citoyen.fr
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cc-btn cc-btn-primary w-full py-3 text-sm font-bold disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Envoyer le message"}
            </button>

            <p className="text-center text-xs" style={{ color: "var(--cc-text-disabled)" }}>
              Ou écrivez directement à{" "}
              <a href="mailto:contact@cap-citoyen.fr" className="text-blue-500 hover:underline">
                contact@cap-citoyen.fr
              </a>
            </p>
          </form>
        )}
      </div>

      <div className="mt-8 max-w-xl mx-auto">
        <StoreButtons />
      </div>

      <div className="mt-6 flex justify-center gap-6 text-xs" style={{ color: "var(--cc-text-disabled)" }}>
        <Link href="/mentions-legales" className="hover:underline transition">Mentions légales</Link>
        <Link href="/cgv" className="hover:underline transition">CGV</Link>
        <Link href="/" className="hover:underline transition">Retour à l'accueil</Link>
      </div>
    </main>
  );
}
