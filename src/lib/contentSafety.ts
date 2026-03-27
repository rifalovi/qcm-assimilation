// Sécurité contenu — filtre URLs et mots interdits

// ── URLs suspectes ─────────────────────────────────────────
const SUSPICIOUS_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'shorturl.at', 'cutt.ly', 't.co',
  'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'tiny.cc',
  'adf.ly', 'bc.vc', 'ouo.io', 'exe.io', 'cpa.st',
]

const PHISHING_PATTERNS = [
  /free.*bitcoin/i, /click.*here.*win/i, /verify.*account.*urgent/i,
  /your.*account.*suspended/i, /confirm.*payment/i, /wire.*transfer/i,
  /western.*union/i, /money.*gram/i, /casino/i, /poker.*online/i,
]

export function containsSuspiciousUrl(text: string): { suspicious: boolean; reason?: string } {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = text.match(urlRegex) ?? []

  for (const url of urls) {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      if (SUSPICIOUS_DOMAINS.some(d => domain.includes(d))) {
        return { suspicious: true, reason: `Lien raccourci non autorisé (${domain})` }
      }
    } catch {}
  }

  for (const pattern of PHISHING_PATTERNS) {
    if (pattern.test(text)) {
      return { suspicious: true, reason: 'Contenu suspect détecté' }
    }
  }

  return { suspicious: false }
}

// ── Mots interdits ─────────────────────────────────────────
const FORBIDDEN_WORDS = [
  // Insultes graves
  'connard', 'salope', 'pute', 'enculé', 'fils de pute',
  'nègre', 'bougnoule', 'youpin', 'bicot', 'raton',
  // Spam
  'achetez maintenant', 'offre limitée', 'cliquez ici',
  'gagner de l\'argent', 'travail depuis chez vous',
  // Contenus dangereux
  'whatsapp.*arnaque', 'virement.*urgent',
]

export function containsForbiddenContent(text: string): { forbidden: boolean; reason?: string } {
  const lower = text.toLowerCase()

  for (const word of FORBIDDEN_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      return { forbidden: true, reason: 'Ce message contient du contenu non autorisé.' }
    }
  }

  return { forbidden: false }
}

// ── Validation complète ────────────────────────────────────
export function validateContent(text: string): { valid: boolean; error?: string } {
  if (!text.trim()) return { valid: false, error: 'Le message ne peut pas être vide.' }
  if (text.length > 2000) return { valid: false, error: 'Message trop long (max 2000 caractères).' }

  const urlCheck = containsSuspiciousUrl(text)
  if (urlCheck.suspicious) return { valid: false, error: urlCheck.reason }

  const forbiddenCheck = containsForbiddenContent(text)
  if (forbiddenCheck.forbidden) return { valid: false, error: forbiddenCheck.reason }

  return { valid: true }
}
