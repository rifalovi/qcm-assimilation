import { Suspense } from "react";
import ResultsClient from "./ResultsClient";

/**
 * Ce fichier est le POINT D'ENTRÉE de la route /results.
 * Il ne fait qu'une chose : envelopper le vrai composant dans <Suspense>.
 *
 * Pourquoi ? Next.js essaie de pré-générer les pages au build (SSG).
 * useSearchParams() lit l'URL → impossible au build → crash.
 * <Suspense> indique à Next.js : "cette partie s'exécute côté client uniquement".
 */
export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-6 text-slate-600">
          Chargement des résultats…
        </div>
      }
    >
      <ResultsClient />
    </Suspense>
  );
}
