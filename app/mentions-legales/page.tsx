export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[1.8rem] border p-6 sm:p-10" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--cc-text)" }}>Mentions légales</h1>
        <p className="text-xs mb-8" style={{ color: "var(--cc-text-disabled)" }}>Dernière mise à jour : mars 2026</p>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>1. Éditeur du site</h2>
          <div className="text-sm space-y-1 leading-6" style={{ color: "var(--cc-text-muted)" }}>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Nom :</span> Vignon Carlos Hounsinou</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Forme juridique :</span> Entrepreneur individuel</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>SIREN :</span> 918 107 848</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>SIRET :</span> 918 107 848 00015</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Numéro de TVA :</span> FR20918107848</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Adresse :</span> Chennevières-sur-Marne, 94430, France</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Email :</span> contact@cap-citoyen.fr</p>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>2. Directeur de la publication</h2>
          <p className="text-sm" style={{ color: "var(--cc-text-muted)" }}>Vignon Carlos Hounsinou</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>3. Hébergement</h2>
          <div className="text-sm space-y-1 leading-6" style={{ color: "var(--cc-text-muted)" }}>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Hébergeur :</span> Netlify, Inc.</p>
            <p><span style={{ color: "var(--cc-text-disabled)" }}>Adresse :</span> 512 2nd Street, Suite 200, San Francisco, CA 94107, USA</p>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>4. Propriété intellectuelle</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>L'ensemble du contenu (textes, questions, épisodes audio, images) est la propriété exclusive de Vignon Carlos Hounsinou. Toute reproduction sans autorisation est interdite.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>5. Données personnelles</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Les données collectées sont utilisées uniquement pour le fonctionnement du service. Elles ne sont ni revendues ni transmises à des tiers. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression : contact@cap-citoyen.fr.</p>
        </section>
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>6. Contact</h2>
          <p className="text-sm" style={{ color: "var(--cc-text-muted)" }}><a href="mailto:contact@cap-citoyen.fr" className="text-blue-500 hover:text-blue-400 underline">contact@cap-citoyen.fr</a></p>
        </section>
      </div>
    </main>
  );
}
