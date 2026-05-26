// src/lib/email/sendPassEmail.ts
// Envoie l'email de confirmation d'achat d'un Pass via Resend.
//
// Appelé dans le webhook Stripe après INSERT passes réussi.
// Best-effort : les erreurs sont loguées mais ne bloquent pas la réponse webhook.
//
// Variables d'environnement requises :
//   RESEND_API_KEY
//   NEXT_PUBLIC_SITE_URL

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const PASS_LABEL: Record<string, string> = {
  express:  "Pass Express (7 jours)",
  serenite: "Pass Sérénité (30 jours)",
};

/**
 * Envoie un email de confirmation post-achat.
 * @param to        Adresse email du destinataire
 * @param passType  'express' | 'serenite'
 * @param expiresAt Date d'expiration du pass
 */
export async function sendPassEmail(
  to: string,
  passType: string,
  expiresAt: Date,
): Promise<void> {
  const label  = PASS_LABEL[passType] ?? `Pass ${passType}`;
  const expStr = expiresAt.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cap-citoyen.fr").replace(/\/$/, "");

  await resend.emails.send({
    from:    "Cap Citoyen <no-reply@cap-citoyen.fr>",
    to,
    subject: `Votre ${label} est actif`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre ${label} est actif</title>
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
            Cap Citoyen
          </p>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#1a1d24;line-height:1.3;">
            Votre ${label} est actif
          </h1>
        </td></tr>

        <!-- Corps -->
        <tr><td colspan="3" style="padding:24px 36px 28px;">
          <p style="margin:0 0 20px;font-size:15px;color:#3d4451;line-height:1.6;">
            Votre accès complet est ouvert jusqu'au
            <strong style="color:#1a1d24;">${expStr}</strong>.
          </p>

          <!-- Récapitulatif des accès -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f0f4fa;border-radius:10px;border:1px solid #dce3ed;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#5b6472;
                         text-transform:uppercase;letter-spacing:.08em;">
                Ce que vous avez maintenant
              </p>
              <ul style="margin:0;padding-left:20px;font-size:14px;color:#3d4451;line-height:2.1;">
                <li>Questions de quiz <strong>illimitées</strong></li>
                <li>Tous les niveaux de difficulté (1, 2, 3)</li>
                <li>Examens blancs <strong>illimités</strong></li>
                <li>Explications détaillées après chaque réponse</li>
                <li>Statistiques complètes par thème</li>
              </ul>
            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius:10px;background:#1b5299;">
                <a href="${appUrl}/quiz"
                   style="display:inline-block;padding:14px 28px;font-size:15px;
                          font-weight:700;color:#ffffff;text-decoration:none;
                          border-radius:10px;line-height:1;">
                  Commencer à réviser &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Pied de page -->
        <tr><td colspan="3"
               style="padding:18px 36px;border-top:1px solid #e2e5ea;background:#f8f9fb;">
          <p style="margin:0;font-size:11px;color:#9aa1ad;line-height:1.7;">
            Pas de renouvellement automatique. Votre pass expire le ${expStr}
            et ne sera pas reconduit sans action de votre part.<br />
            Des questions ?
            <a href="${appUrl}/contact" style="color:#1b5299;text-decoration:underline;">Contactez-nous</a>.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
