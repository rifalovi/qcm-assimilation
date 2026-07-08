// src/lib/weeklyQuestion.ts
// « La question de la semaine » : sélection déterministe d'une mise en situation
// (type='situation') et rendu du teaser (push + email), SANS jamais révéler la réponse.
//
// Utilisé par app/api/cron/weekly-question/route.ts (déclenché par la Netlify
// Scheduled Function netlify/functions/weekly-question.mjs, chaque lundi matin).

export interface WeeklySituation {
  id: string;
  question: string; // contient déjà « Mise en situation — <scénario> … ? »
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  theme: string | null;
  level: number | null;
}

/** Numéro de semaine ISO (1..53) d'une date, en UTC. */
export function getIsoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // lundi = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // jeudi de la semaine courante
  const firstThursday = date.getTime();
  date.setUTCMonth(0, 1);
  if (date.getUTCDay() !== 4) {
    date.setUTCMonth(0, 1 + ((4 - date.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.round((firstThursday - date.getTime()) / (7 * 24 * 3600 * 1000));
}

/** Choisit la mise en situation de la semaine (rotation stable sur toute la liste). */
export function pickWeeklySituation<T>(rows: T[], date: Date): T | null {
  if (!rows.length) return null;
  const week = getIsoWeek(date);
  return rows[week % rows.length];
}

/** Corps court pour la notification push (tronqué proprement). */
export function buildPushPayload(q: WeeklySituation, appUrl: string) {
  // On garde la phrase de contexte, sans les choix (trop long pour un push).
  const context = q.question.replace(/^Mise en situation\s*[—-]\s*/i, "").trim();
  const body = context.length > 130 ? context.slice(0, 127).trimEnd() + "…" : context;
  return {
    title: "🇫🇷 La question de la semaine",
    body,
    url: `${appUrl}/quiz`,
    tag: "question-semaine",
  };
}

/** Email HTML « teaser » : scénario + 4 choix, SANS la bonne réponse, + CTA. */
export function buildWeeklyEmailHtml(q: WeeklySituation, appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  const context = q.question.replace(/^Mise en situation\s*[—-]\s*/i, "").trim();
  const choices: Array<[string, string]> = [
    ["A", q.choice_a],
    ["B", q.choice_b],
    ["C", q.choice_c],
    ["D", q.choice_d],
  ];
  const choicesHtml = choices
    .map(
      ([letter, text]) => `
        <tr><td style="padding:8px 0;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="30" valign="top" style="font-size:14px;font-weight:700;color:#1b5299;">${letter}.</td>
              <td style="font-size:14px;color:#3d4451;line-height:1.5;">${escapeHtml(text)}</td>
            </tr>
          </table>
        </td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>La question de la semaine — Cap Citoyen</title>
</head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e5ea;max-width:560px;">

        <!-- Bande tricolore -->
        <tr>
          <td width="33%" height="4" style="background:#003189;line-height:4px;font-size:0;">&nbsp;</td>
          <td width="34%" height="4" style="background:#ffffff;border-left:1px solid #e2e5ea;border-right:1px solid #e2e5ea;line-height:4px;font-size:0;">&nbsp;</td>
          <td width="33%" height="4" style="background:#e1000f;line-height:4px;font-size:0;">&nbsp;</td>
        </tr>

        <!-- En-tête -->
        <tr><td colspan="3" style="padding:32px 36px 0;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#5b6472;letter-spacing:.08em;text-transform:uppercase;">
            Cap Citoyen · La question de la semaine
          </p>
          <h1 style="margin:0;font-size:21px;font-weight:800;color:#1a1d24;line-height:1.35;">
            Mise en situation
          </h1>
        </td></tr>

        <!-- Scénario -->
        <tr><td colspan="3" style="padding:20px 36px 4px;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f0f4fa;border-radius:10px;border:1px solid #dce3ed;">
            <tr><td style="padding:18px 20px;font-size:15px;color:#1a1d24;line-height:1.6;">
              ${escapeHtml(context)}
            </td></tr>
          </table>
        </td></tr>

        <!-- Choix -->
        <tr><td colspan="3" style="padding:8px 36px 4px;">
          <table width="100%" cellpadding="0" cellspacing="0">${choicesHtml}</table>
        </td></tr>

        <!-- Accroche + CTA -->
        <tr><td colspan="3" style="padding:12px 36px 30px;">
          <p style="margin:0 0 20px;font-size:15px;color:#3d4451;line-height:1.6;">
            🤔 Tu connais la bonne réponse… et surtout <strong>le piège</strong> ?
            La solution expliquée t'attend dans l'appli.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius:10px;background:#1b5299;">
                <a href="${base}/quiz"
                   style="display:inline-block;padding:14px 28px;font-size:15px;
                          font-weight:700;color:#ffffff;text-decoration:none;
                          border-radius:10px;line-height:1;">
                  Voir la réponse dans l'appli &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Pied de page -->
        <tr><td colspan="3"
               style="padding:18px 36px;border-top:1px solid #e2e5ea;background:#f8f9fb;">
          <p style="margin:0;font-size:11px;color:#9aa1ad;line-height:1.7;">
            Tu reçois cet email car tu prépares l'examen de naturalisation avec Cap Citoyen.<br />
            <a href="${base}/contact" style="color:#1b5299;text-decoration:underline;">Nous contacter</a>.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
