import { Suspense } from "react";
import ResultsClient from "./ResultsClient";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen" style={{ color: "var(--cc-text-disabled)" }}>Chargement…</div>}>
      <ResultsClient />
    </Suspense>
  );
}
