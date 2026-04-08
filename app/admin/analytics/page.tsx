import AnalyticsClient from './AnalyticsClient'

// Le rendu se fait côté client : la page est interactive
// (sélecteurs jour / semaine / mois, fenêtre 7 / 30 / 90 jours, etc.)
// et fetche /api/admin/analytics qui agrège tout en un appel.
export default function AnalyticsPage() {
  return <AnalyticsClient />
}
