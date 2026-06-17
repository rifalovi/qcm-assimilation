import { Suspense } from "react";
import ResultsClient from "./ResultsClient";
import Spinner from "@/components/Spinner";

export default function ResultsPage() {
  return (
    <Suspense fallback={<Spinner fullScreen label="Chargement des résultats…" />}>
      <ResultsClient />
    </Suspense>
  );
}
