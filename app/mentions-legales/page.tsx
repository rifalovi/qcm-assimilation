export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 sm:p-10">
        <h1 className="text-2xl font-extrabold text-white mb-2">Mentions légales</h1>
        <p className="text-xs text-slate-400 mb-8">Dernière mise à jour : mars 2026</p>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">1. Éditeur du site</h2>
          <div className="text-sm text-slate-300 space-y-1 leading-6">
            <p><span className="text-slate-400">Nom :</span> Vignon Carlos Hounsinou</p>
            <p><span className="text-slate-400">Forme juridique :</span> Entrepreneur individuel</p>
            <p><span className="text-slate-400">SIREN :</span> 918 107 848</p>
            <p><span className="text-slate-400">SIRET :</span> 918 107 848 00015</p>
            <p><span className="text-slate-400">Numéro de TVA :</span> FR20918107848</p>
            <p><span className="text-slate-400">Adresse :</span> 7 allée de la Caravelle, 94430 Chennevières-sur-Marne, France</p>
            <p><span className="text-slate-400">Email :</span> contact@cap-citoyen.fr</p>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">2. Directeur de la publication</h2>
          <p className="text-sm text-slate-300">Vignon Carlos Hounsinou</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">3. Hébergement</h2>
          <div className="text-sm text-slate-300 space-y-1 leading-6">
            <p><span className="text-slate-400">Hébergeur :</span> Netlify, Inc.</p>
            <p><span className="text-slate-400">Adresse :</span> 512 2nd Street, Suite 200, San Francisco, CA 94107, USA</p>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">4. Propriété intellectuelle</h2>
          <p className="text-sm text-slate-300 leading-6">L'ensemble du contenu (textes, questions, épisodes audio, images) est la propriété exclusive de Vignon Carlos Hounsinou. Toute reproduction sans autorisation est interdite.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold text-white mb-3">5. Données personnelles</h2>
          <p className="text-sm text-slate-300 leading-6">Les données collectées sont utilisées uniquement pour le fonctionnement du service. Elles ne sont ni revendues ni transmises à des tiers. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression : contact@cap-citoyen.fr.</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-3">6. Contact</h2>
          <p className="text-sm text-slate-300"><a href="mailto:contact@cap-citoyen.fr" className="text-blue-400 hover:text-blue-300 underline">contact@cap-citoyen.fr</a></p>
        </section>
      </div>
    </main>
  );
}