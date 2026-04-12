// Templates d'emails pour la séquence onboarding (CRM interne)

export type EmailStep = 1 | 2 | 3 | 4 | 5;

export const STEP_DELAYS_DAYS: Record<EmailStep, number> = {
  1: 1,   // J1
  2: 3,   // J3
  3: 7,   // J7
  4: 14,  // J14
  5: 30,  // J30
};

export const STEP_LABELS: Record<EmailStep, string> = {
  1: "J1 — Bienvenue",
  2: "J3 — Conseil de révision",
  3: "J7 — Résumé progression",
  4: "J14 — Offre spéciale",
  5: "J30 — Dernier message",
};

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#020817;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:14px;font-weight:600;color:#e2e8f0;letter-spacing:0.05em;">🇫🇷 Cap Citoyen</span>
    </div>
    <div style="background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%);border-radius:20px;padding:32px;border:1px solid rgba(255,255,255,0.08);">
      ${content}
    </div>
    <div style="text-align:center;margin-top:20px;">
      <p style="font-size:11px;color:#64748b;margin:0;">Cap Citoyen — Plateforme de préparation à l'examen civique 2026</p>
      <p style="font-size:10px;color:#475569;margin:4px 0 0;">
        <a href="https://cap-citoyen.fr" style="color:#475569;text-decoration:underline;">cap-citoyen.fr</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function getEmailTemplate(
  step: EmailStep,
  prenom: string,
  extra?: { questionDuJour?: string; scorePercent?: number; quizCount?: number }
): { subject: string; html: string } {
  switch (step) {
    case 1:
      return {
        subject: `Bienvenue sur Cap Citoyen, ${prenom} !`,
        html: baseLayout(`
          <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">Bonjour ${prenom} 👋</h2>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Je suis <strong style="color:#fff;">Vignon</strong>, le fondateur de Cap Citoyen. Merci d'avoir rejoint la plateforme !
          </p>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Comment se passe votre préparation ? N'hésitez pas à commencer par un premier test pour identifier vos points forts et vos axes de progression.
          </p>
          <div style="text-align:center;">
            <a href="https://cap-citoyen.fr/" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;padding:14px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:14px;">
              Commencer mon premier test
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;line-height:1.6;">
            À très vite,<br><strong style="color:#e2e8f0;">Vignon</strong> — Fondateur de Cap Citoyen
          </p>
        `),
      };

    case 2:
      return {
        subject: `${prenom}, un conseil de révision + votre question du jour`,
        html: baseLayout(`
          <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">Bonjour ${prenom} 📚</h2>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Voici un conseil important : <strong style="color:#fff;">révisez régulièrement en petites sessions</strong> plutôt que de tout faire en une fois. 15 minutes par jour valent mieux que 3 heures une fois par semaine.
          </p>
          ${extra?.questionDuJour ? `
          <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:14px;padding:20px;margin:16px 0;">
            <p style="color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Question du jour</p>
            <p style="color:#fff;font-size:15px;line-height:1.6;margin:0;">${extra.questionDuJour}</p>
          </div>` : ''}
          <div style="text-align:center;margin-top:24px;">
            <a href="https://cap-citoyen.fr/scroll" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;padding:14px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:14px;">
              Réviser en scroll
            </a>
          </div>
        `),
      };

    case 3:
      return {
        subject: `${prenom}, votre résumé de progression après 1 semaine`,
        html: baseLayout(`
          <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">Une semaine déjà, ${prenom} ! 🎯</h2>
          ${extra?.quizCount ? `
          <div style="display:flex;gap:12px;margin:16px 0;">
            <div style="flex:1;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:14px;padding:16px;text-align:center;">
              <p style="color:#86efac;font-size:24px;font-weight:800;margin:0;">${extra.quizCount}</p>
              <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">Tests réalisés</p>
            </div>
            <div style="flex:1;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:14px;padding:16px;text-align:center;">
              <p style="color:#93c5fd;font-size:24px;font-weight:800;margin:0;">${extra.scorePercent ?? 0}%</p>
              <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">Score moyen</p>
            </div>
          </div>` : `
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Vous n'avez pas encore passé de test. C'est le moment idéal pour évaluer votre niveau !
          </p>`}
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Continuez à progresser ! Avec le <strong style="color:#fff;">mode Premium</strong>, accédez à tous les niveaux, l'examen blanc illimité et les statistiques détaillées.
          </p>
          <div style="text-align:center;">
            <a href="https://cap-citoyen.fr/pricing" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#f97316);color:#0f172a;padding:14px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:14px;">
              Découvrir Premium
            </a>
          </div>
        `),
      };

    case 4:
      return {
        subject: `${prenom}, une offre spéciale pour booster votre préparation`,
        html: baseLayout(`
          <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">Offre spéciale pour vous, ${prenom} 🎁</h2>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Vous utilisez Cap Citoyen depuis 2 semaines. Pour vous aider à aller plus loin dans votre préparation, nous avons une offre spéciale :
          </p>
          <div style="background:linear-gradient(135deg,rgba(245,158,11,0.15),rgba(249,115,22,0.15));border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:24px;text-align:center;margin:20px 0;">
            <p style="color:#fbbf24;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;">Offre Premium</p>
            <p style="color:#fff;font-size:28px;font-weight:800;margin:0;">19,99€ <span style="font-size:14px;color:#94a3b8;font-weight:400;">/ 3 mois</span></p>
            <p style="color:#fde68a;font-size:13px;margin:8px 0 0;">soit seulement 6,66€/mois</p>
          </div>
          <div style="margin:16px 0;">
            ${['800+ questions sur tous les niveaux', 'Examen blanc illimité', '100 épisodes audio guidés', 'Statistiques détaillées par thème', 'Accès communauté & forum'].map(f =>
              `<div style="display:flex;align-items:center;gap:10px;margin:8px 0;">
                <span style="color:#22c55e;font-size:16px;">✓</span>
                <span style="color:#e2e8f0;font-size:14px;">${f}</span>
              </div>`
            ).join('')}
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="https://cap-citoyen.fr/pricing" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#f97316);color:#0f172a;padding:16px 40px;border-radius:14px;text-decoration:none;font-weight:700;font-size:15px;">
              Passer à Premium →
            </a>
          </div>
        `),
      };

    case 5:
      return {
        subject: `${prenom}, on ne vous oublie pas !`,
        html: baseLayout(`
          <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">Bonjour ${prenom} 💙</h2>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Cela fait un mois que vous avez rejoint Cap Citoyen. Nous espérons que la plateforme vous a été utile dans votre préparation.
          </p>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Que vous soyez prêt à passer l'examen ou que vous ayez besoin de plus de temps, sachez que Cap Citoyen est toujours là pour vous accompagner.
          </p>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 24px;">
            N'hésitez pas à revenir quand vous le souhaitez — votre progression est sauvegardée.
          </p>
          <div style="text-align:center;">
            <a href="https://cap-citoyen.fr/" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;padding:14px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:14px;">
              Reprendre ma préparation
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;line-height:1.6;">
            Bon courage pour la suite,<br><strong style="color:#e2e8f0;">L'équipe Cap Citoyen</strong>
          </p>
        `),
      };
  }
}
