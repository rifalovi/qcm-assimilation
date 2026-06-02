export default function CGVPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[1.8rem] border p-6 sm:p-10" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--cc-text)" }}>Conditions Générales de Vente</h1>
        <p className="text-xs mb-8" style={{ color: "var(--cc-text-disabled)" }}>Dernière mise à jour : mai 2026</p>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>1. Objet</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Les présentes CGV régissent les ventes de services numériques proposés par Cap Citoyen (Vignon Carlos Hounsinou, SIREN 918 107 848) via cap-citoyen.fr.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>2. Services et tarifs</h2>
          <div className="space-y-3 text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
              <p className="font-semibold" style={{ color: "var(--cc-text)" }}>Pass Express — 4,99€ TTC / 7 jours</p>
              <p>Accès complet pendant 7 jours. Paiement unique, <strong style={{ color: "var(--cc-text)" }}>pas de renouvellement automatique</strong>.</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
              <p className="font-semibold" style={{ color: "var(--cc-text)" }}>Pass Sérénité — 9,99€ TTC / 30 jours</p>
              <p>Accès complet pendant 30 jours. Paiement unique, <strong style={{ color: "var(--cc-text)" }}>pas de renouvellement automatique</strong>.</p>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--cc-text-disabled)" }}>
              Les passes sont à durée déterminée et ne se renouvellent pas sans action explicite de votre part. Aucun prélèvement récurrent n'est effectué.
            </p>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>3. TVA</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Prix TTC (TVA 20% incluse). N° TVA : FR20918107848. Paiement sécurisé via Stripe.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>4. Droit de rétractation</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Vous disposez de <strong style={{ color: "var(--cc-text)" }}>14 jours</strong> pour vous rétracter (art. L221-18 Code de la consommation). Contactez-nous à <a href="mailto:contact@cap-citoyen.fr" style={{ color: "var(--cc-primary)" }} className="underline">contact@cap-citoyen.fr</a>. Remboursement sous 14 jours.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>5. Expiration du Pass</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Les passes sont valables pour une durée limitée à compter de la date d'achat. À expiration, l'accès repasse automatiquement en mode freemium. Aucun remboursement n'est accordé pour la durée restante non utilisée, sauf exercice du droit de rétractation dans le délai légal.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>6. Responsabilité</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Cap Citoyen est un outil pédagogique. Il ne garantit pas les résultats à l'entretien et ne constitue pas un conseil juridique.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>7. Droit applicable</h2>
          <p className="text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>Droit français. Tribunal compétent : ressort de Créteil (94).</p>
        </section>
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--cc-text)" }}>8. Contact</h2>
          <p className="text-sm" style={{ color: "var(--cc-text-muted)" }}>contact@cap-citoyen.fr — 7 allée de la Caravelle, 94430 Chennevières-sur-Marne</p>
        </section>
      </div>
    </main>
  );
}
