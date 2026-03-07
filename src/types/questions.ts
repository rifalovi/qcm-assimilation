// types/questions.ts
// Ce fichier définit la forme exacte des données
// Il est partagé entre la page serveur et le composant client

export interface MCQVariant {
  title: string;
  options: string[];
  correct: number;       // index de la bonne réponse (0-3)
  explanation: string;
}

export interface Question {
  id: number;
  theme: string;
  question: string;
  best_answer: string;
  mcq_variants: MCQVariant[];  // toujours 3 variantes
}
