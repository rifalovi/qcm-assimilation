export default function CGVPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 sm:p-10">
        <h1 className="text-2xl font-extrabold text-white mb-2">Conditions Générales de Vente</h1>
        <p className="text-xs text-slate-400 mb-8">Dernière mise à jour : mars 2026</p>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">1. Objet</h2>
          <p className="text-sm text-slate-300 leading-6">Les présentes CGV régissent les ventes de services numériques proposés par Cap Citoyen (Vignon Carlos Hounsinou, SIREN 918 107 848) via cap-citoyen.fr.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">2. Services et tarifs</h2>
          <div className="space-y-3 text-sm text-slate-300 leading-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Premium — 19,99€ TTC / 3 mois</p>
              <p>Accès complet pendant 3 mois. Abonnement résiliable à tout moment.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Élite — 49,99€ TTC — accès à vie</p>
              <p>Accès permanent, mises à jour incluses. Paiement unique.</p>
            </div>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">3. TVA</h2>
          <p className="text-sm text-slate-300 leading-6">Prix TTC (TVA 20% incluse). N° TVA : FR20918107848. Paiement sécurisé via Stripe.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">4. Droit de rétractation</h2>
          <p className="text-sm text-slate-300 leading-6">Vous disposez de <strong className="text-white">14 jours</strong> pour vous rétracter (art. L221-18 Code de la consommation). Contactez-nous à <a href="mailto:contact@cap-citoyen.fr" className="text-blue-400 underline">contact@cap-citoyen.fr</a>. Remboursement sous 14 jours.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">5. Résiliation</h2>
          <p className="text-sm text-slate-300 leading-6">L'abonnement Premium est résiliable depuis votre espace compte. Effet à la fin de la période en cours.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">6. Responsabilité</h2>
          <p className="text-sm text-slate-300 leading-6">Cap Citoyen est un outil pédagogique. Il ne garantit pas les résultats à l'entretien et ne constitue pas un conseil juridique.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">7. Droit applicable</h2>
          <p className="text-sm text-slate-300 leading-6">Droit français. Tribunal compétent : ressort de Créteil (94).</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-3">8. Contact</h2>
          <p className="text-sm text-slate-300">contact@cap-citoyen.fr — 7 allée de la Caravelle, 94430 Chennevières-sur-Marne</p>
        </section>
      </div>
    </main>
  );
}