export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[1.8rem] border p-6 sm:p-10" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--cc-text)" }}>Politique de confidentialité</h1>
        <p className="text-xs mb-8" style={{ color: "var(--cc-text-disabled)" }}>Dernière mise à jour : mars 2026</p>

        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>1. Responsable du traitement</h2>
          <div className="text-sm space-y-1 leading-6" style={{ color: "var(--cc-text-muted)" }}>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Nom :</span> Vignon Carlos Hounsinou</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>SIREN :</span> 918 107 848</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Email :</span> contact@cap-citoyen.fr</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Site :</span> https://cap-citoyen.fr</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>2. Données collectées</h2>
          <p className="text-sm leading-6 mb-3" style={{ color: "var(--cc-text-muted)" }}>Lors de l'utilisation de Cap Citoyen, nous collectons les données suivantes :</p>
          <ul className="text-sm leading-6 space-y-2 list-disc list-inside" style={{ color: "var(--cc-text-muted)" }}>
            <li>Adresse email et nom d'utilisateur (lors de l'inscription)</li>
            <li>Résultats des quiz et progression pédagogique</li>
            <li>Données de connexion et d'utilisation de l'application</li>
            <li>Informations de paiement traitées par Stripe (nous ne stockons pas les données bancaires)</li>
            <li>Messages échangés dans la communauté</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>3. Finalités du traitement</h2>
          <ul className="text-sm leading-6 space-y-2 list-disc list-inside" style={{ color: "var(--cc-text-muted)" }}>
            <li>Fourniture et amélioration du service de préparation à l'examen</li>
            <li>Gestion des comptes utilisateurs et des abonnements</li>
            <li>Envoi d'emails transactionnels (confirmation, notifications)</li>
            <li>Analyse statistique anonyme de l'utilisation</li>
            <li>Modération de la communauté</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>4. Base légale</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Le traitement est fondé sur l'exécution du contrat (fourniture du service), le consentement de l'utilisateur et nos intérêts légitimes (amélioration du service, sécurité).</p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>5. Sous-traitants et transferts</h2>
          <div className="text-sm leading-6 space-y-2" style={{ color: "var(--cc-text-muted)" }}>
            <p>Nous utilisons les services suivants :</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><span style={{ color: "var(--cc-text)" }}>Supabase</span> — base de données et authentification (UE)</li>
              <li><span style={{ color: "var(--cc-text)" }}>Stripe</span> — paiements sécurisés</li>
              <li><span style={{ color: "var(--cc-text)" }}>Netlify</span> — hébergement (USA, clauses contractuelles types)</li>
              <li><span style={{ color: "var(--cc-text)" }}>Resend</span> — envoi d'emails transactionnels</li>
              <li><span style={{ color: "var(--cc-text)" }}>ElevenLabs</span> — génération audio</li>
              <li><span style={{ color: "var(--cc-text)" }}>PostHog</span> — analytics anonymisées</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>6. Durée de conservation</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Les données sont conservées pendant la durée d'utilisation du compte, puis supprimées dans un délai de 3 ans après la dernière connexion, sauf obligation légale contraire.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>7. Vos droits (RGPD)</h2>
          <p className="text-sm leading-6 mb-3" style={{ color: "var(--cc-text-muted)" }}>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="text-sm leading-6 space-y-1 list-disc list-inside" style={{ color: "var(--cc-text-muted)" }}>
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement (droit à l'oubli)</li>
            <li>Droit à la portabilité</li>
            <li>Droit d'opposition et de limitation du traitement</li>
          </ul>
          <p className="text-sm leading-6 mt-3" style={{ color: "var(--cc-text-muted)" }}>Pour exercer ces droits : <a href="mailto:contact@cap-citoyen.fr" style={{ color: "var(--cc-primary)" }} className="hover:opacity-80 underline">contact@cap-citoyen.fr</a></p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>8. Cookies</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Cap Citoyen utilise des cookies strictement nécessaires au fonctionnement du service (session, authentification). Aucun cookie publicitaire n'est utilisé.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>9. Contact et réclamations</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Pour toute question : <a href="mailto:contact@cap-citoyen.fr" style={{ color: "var(--cc-primary)" }} className="hover:opacity-80 underline">contact@cap-citoyen.fr</a></p>
          <p className="text-sm leading-6 mt-2" style={{ color: "var(--cc-text-muted)" }}>Vous pouvez également introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--cc-primary)" }} className="hover:opacity-80 underline">www.cnil.fr</a></p>
        </section>
      </div>
    </main>
  );
}
