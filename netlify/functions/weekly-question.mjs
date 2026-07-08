// netlify/functions/weekly-question.mjs
// Scheduled Function : appelle l'endpoint applicatif qui envoie « la question
// de la semaine » (push + email). Planifié dans netlify.toml (lundi ~9h Paris).
//
// Env requis : CRON_SECRET (partagé avec l'endpoint). Optionnel : WEEKLY_MODE
// ('test' par défaut = uniquement le propriétaire ; 'broadcast' = tous).

export default async () => {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? 'https://cap-citoyen.fr').replace(/\/$/, '')
  const secret = process.env.CRON_SECRET ?? ''
  const mode = process.env.WEEKLY_MODE === 'broadcast' ? 'broadcast' : 'test'

  try {
    const res = await fetch(`${site}/api/cron/weekly-question?mode=${mode}`, {
      method: 'POST',
      headers: { 'x-cron-secret': secret },
    })
    const text = await res.text()
    console.log('[weekly-question]', res.status, text)
    return new Response(text, { status: res.status })
  } catch (e) {
    console.error('[weekly-question] échec appel endpoint', e)
    return new Response('error', { status: 500 })
  }
}
