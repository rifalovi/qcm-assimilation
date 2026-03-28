export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 sm:p-10">
        <h1 className="text-2xl font-extrabold text-white mb-2">Politique de confidentialité</h1>
        <p className="text-xs text-slate-400 mb-8">Dernière mise à jour : mars 2026</p>

        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">1. Responsable du traitement</h2>
          <div className="text-sm text-slate-300 space-y-1 leading-6">
            <p><span className="text-slate-400">Nom :</span> Vignon Carlos Hounsinou</p>
            <p><span className="text-slate-400">SIREN :</span> 918 107 848</p>
            <p><span className="text-slate-400">Email :</span> contact@cap-citoyen.fr</p>
            <p><span className="text-slate-400">Site :</span> https://cap-citoyen.fr</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">2. Données collectées</h2>
          <p className="text-sm text-slate-300 leading-6 mb-3">Lors de l'utilisation de Cap Citoyen, nous collectons les données suivantes :</p>
          <ul className="text-sm text-slate-300 leading-6 space-y-2 list-disc list-inside">
            <li>Adresse email et nom d'utilisateur (lors de l'inscription)</li>
            <li>Résultats des quiz et progression pédagogique</li>
            <li>Données de connexion et d'utilisation de l'application</li>
            <li>Informations de paiement traitées par Stripe (nous ne stockons pas les données bancaires)</li>
            <li>Messages échangés dans la communauté</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">3. Finalités du traitement</h2>
          <ul className="text-sm text-slate-300 leading-6 space-y-2 list-disc list-inside">
            <li>Fourniture et amélioration du service de préparation à l'examen</li>
            <li>Gestion des comptes utilisateurs et des abonnements</li>
            <li>Envoi d'emails transactionnels (confirmation, notifications)</li>
            <li>Analyse statistique anonyme de l'utilisation</li>
            <li>Modération de la communauté</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">4. Base légale</h2>
          <p className="text-sm text-slate-300 leading-6">Le traitement est fondé sur l'exécution du contrat (fourniture du service), le consentement de l'utilisateur et nos intérêts légitimes (amélioration du service, sécurité).</p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">5. Sous-traitants et transferts</h2>
          <div className="text-sm text-slate-300 leading-6 space-y-2">
            <p>Nous utilisons les services suivants :</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><span className="text-slate-200">Supabase</span> — base de données et authentification (UE)</li>
              <li><span className="text-slate-200">Stripe</span> — paiements sécurisés</li>
              <li><span className="text-slate-200">Netlify</span> — hébergement (USA, clauses contractuelles types)</li>
              <li><span className="text-slate-200">Resend</span> — envoi d'emails transactionnels</li>
              <li><span className="text-slate-200">ElevenLabs</span> — génération audio</li>
              <li><span className="text-slate-200">PostHog</span> — analytics anonymisées</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">6. Durée de conservation</h2>
          <p className="text-sm text-slate-300 leading-6">Les données sont conservées pendant la durée d'utilisation du compte, puis supprimées dans un délai de 3 ans après la dernière connexion, sauf obligation légale contraire.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">7. Vos droits (RGPD)</h2>
          <p className="text-sm text-slate-300 leading-6 mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="text-sm text-slate-300 leading-6 space-y-1 list-disc list-inside">
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement (droit à l'oubli)</li>
            <li>Droit à la portabilité</li>
            <li>Droit d'opposition et de limitation du traitement</li>
          </ul>
          <p className="text-sm text-slate-300 leading-6 mt-3">Pour exercer ces droits : <a href="mailto:contact@cap-citoyen.fr" className="text-blue-400 hover:text-blue-300 underline">contact@cap-citoyen.fr</a></p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">8. Cookies</h2>
          <p className="text-sm text-slate-300 leading-6">Cap Citoyen utilise des cookies strictement nécessaires au fonctionnement du service (session, authentification). Aucun cookie publicitaire n'est utilisé.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">9. Contact et réclamations</h2>
          <p className="text-sm text-slate-300 leading-6">Pour toute question : <a href="mailto:contact@cap-citoyen.fr" className="text-blue-400 hover:text-blue-300 underline">contact@cap-citoyen.fr</a></p>
          <p className="text-sm text-slate-300 leading-6 mt-2">Vous pouvez également introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">www.cnil.fr</a></p>
        </section>
      </div>
    </main>
  );
}
