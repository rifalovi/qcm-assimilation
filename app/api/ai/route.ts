import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getQuotaForRole, type AiMode } from '../../../src/lib/aiQuota'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(s) {
            try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Anonymes : autorisés mais quotas gérés côté client (localStorage)
    // L'API ne bloque plus les anonymes — elle traite la requête sans tracker
    let role: 'anonymous' | 'freemium' | 'premium' | 'elite' | 'moderator' | 'admin' | 'super_admin' = 'anonymous'
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, username')
        .eq('id', user.id)
        .single()
      role = (profile?.role as typeof role) ?? 'freemium'
    }
    const body = await req.json()
    const { mode, question, userAnswer, correctAnswer, explanation, choices, theme,
            scorePercent, strengths, weaknesses, totalQuestions, correctCount,
            category, userQuestion } = body as {
      mode: AiMode
      question?: string
      userAnswer?: string
      correctAnswer?: string
      explanation?: string
      choices?: { key: string; label: string }[]
      theme?: string
      scorePercent?: number
      strengths?: string[]
      weaknesses?: string[]
      totalQuestions?: number
      correctCount?: number
      category?: string
      userQuestion?: string
    }

    if (!mode || !['explain', 'coach', 'assistant'].includes(mode)) {
      return NextResponse.json({ error: 'Mode invalide' }, { status: 400 })
    }

    // Vérifier le quota (authentifiés uniquement — anonymes gérés côté client)
    const quota = getQuotaForRole(role, mode)
    if (user && quota < 999) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('user_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'ai_usage')
        .gte('created_at', todayStart.toISOString())
        .filter('properties->>mode', 'eq', mode)

      if ((count ?? 0) >= quota) {
        return NextResponse.json({
          error: 'quota_exceeded',
          quota,
          used: count ?? 0,
          mode,
          role,
        }, { status: 429 })
      }
    }

    // Tracker l'usage (authentifiés uniquement)
    if (user) {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_type: 'ai_usage',
        properties: { mode, question_id: body.questionId, theme },
      })
    }

    // Appeler OpenAI selon le mode
    let systemPrompt: string
    let userPrompt: string

    switch (mode) {
      case 'explain': {
        if (!question || !correctAnswer) {
          return NextResponse.json({ error: 'Paramètres manquants pour le mode explain' }, { status: 400 })
        }
        systemPrompt = `Tu es un professeur passionné et bienveillant, spécialisé dans la préparation à l'examen civique français (naturalisation).

TON STYLE :
- Tu expliques comme si tu parlais à un ami intelligent mais qui découvre le sujet.
- Tu ne te contentes JAMAIS de reformuler la bonne réponse — tu fais comprendre le POURQUOI en profondeur.
- Tu relies chaque réponse à un contexte concret de la vie en France ou de l'histoire.
- Tu donnes des moyens mnémotechniques ou des analogies quand c'est utile.

STRUCTURE JSON OBLIGATOIRE :
{
  "simple_explanation": "Explication claire et engageante de la bonne réponse. Donne du contexte, explique le raisonnement, relie à la vie réelle. 3-4 phrases minimum.",
  "why_wrong": "Explique précisément pourquoi le choix de l'utilisateur est incorrect. Montre la confusion classique. 2-3 phrases.",
  "example": "Un exemple CONCRET et VIVANT pour illustrer — une situation du quotidien, un fait historique marquant, ou une analogie parlante. 2-3 phrases.",
  "trap": "Le piège classique dans ce type de question et comment l'éviter à l'avenir. Sois spécifique. 2-3 phrases.",
  "remember": "LA phrase-clé à retenir, formulée de façon mémorable et percutante. 1-2 phrases max."
}
Ne mets RIEN en dehors du JSON.`

        const choicesText = choices?.map(c => `${c.key}) ${c.label}`).join('\n') ?? ''
        userPrompt = `Question : ${question}
Thème : ${theme ?? 'Non précisé'}
Choix proposés :
${choicesText}
Réponse de l'utilisateur : ${userAnswer ?? 'Non répondu'}
Bonne réponse : ${correctAnswer}
Explication de base : ${explanation ?? ''}`
        break
      }

      case 'coach': {
        systemPrompt = `Tu es un coach motivant et stratégique, spécialisé dans la préparation à l'examen civique français.

TON STYLE :
- Tu analyses les résultats comme un vrai coach : tu identifies les patterns, pas juste les chiffres.
- Tu es encourageant mais honnête — tu félicites les progrès ET tu pointes clairement ce qui reste à travailler.
- Tu donnes un plan d'action CONCRET et ACTIONNABLE, pas des conseils vagues.
- Adapte ton ton au score : si c'est bon (>75%), sois enthousiaste. Si c'est moyen (50-75%), sois motivant. Si c'est faible (<50%), sois rassurant mais direct.

STRUCTURE JSON OBLIGATOIRE :
{
  "diagnosis": "Diagnostic engageant et personnalisé. Commence par une réaction au score, puis analyse les tendances. Mentionne ce qui est encourageant. 4-5 phrases.",
  "strength": "Décris le point fort en détail — pourquoi c'est un atout, comment le capitaliser. 2-3 phrases.",
  "weakness": "Décris le point faible principal — pourquoi c'est le plus important à corriger, ce qui bloque probablement. 2-3 phrases.",
  "plan": ["Étape 1 très concrète avec une action précise (ex: 'Fais 10 questions sur le thème Institutions en mode scroll')", "Étape 2 concrète", "Étape 3 concrète — l'objectif final à viser"]
}
Ne mets RIEN en dehors du JSON.`

        userPrompt = `Résultats du quiz :
Score : ${correctCount ?? 0}/${totalQuestions ?? 0} (${scorePercent ?? 0}%)
Points forts (thèmes >70%) : ${strengths?.join(', ') || 'Aucun thème au-dessus de 70%'}
Points faibles (thèmes <70%) : ${weaknesses?.join(', ') || 'Aucun thème en dessous de 70%'}

Analyse ces résultats comme un vrai coach — pas juste les chiffres, mais ce qu'ils révèlent sur la préparation du candidat.`
        break
      }

      case 'assistant': {
        if (!category || !userQuestion) {
          return NextResponse.json({ error: 'Catégorie et question requises' }, { status: 400 })
        }
        systemPrompt = `Tu es un conseiller expert et bienveillant, spécialisé dans les démarches d'immigration, de naturalisation et d'intégration en France. Tu as accompagné des centaines de candidats dans leur parcours.

TON STYLE :
- Tu es chaleureux et humain. Commence toujours par valider la question ("Très bonne question", "Beaucoup se la posent à ce stade", "Je comprends l'inquiétude"...).
- Tu RAISONNES en profondeur. Ne te contente JAMAIS de résumer la procédure — explique ce que ça implique VRAIMENT, les non-dits, les pièges, ce que les gens ne savent pas.
- Utilise des emojis pour structurer (📂 📅 ⏳ ⚠️ 👉 ✅) mais avec parcimonie.
- Donne des conseils pratiques que seul quelqu'un d'expérimenté connaîtrait.
- Si pertinent, mentionne les délais réalistes (pas les délais théoriques).
- Explique les ENJEUX de chaque étape, pas juste la liste des étapes.

EXEMPLES DE RAISONNEMENT ATTENDU :
- Si quelqu'un demande "J'ai reçu le récépissé de complétude, et après ?" → Ne dis pas juste "votre dossier est en cours". Explique que le plus important commence maintenant, que le profil est évalué en profondeur, que l'entretien est souvent décisif, et donne des conseils concrets pour s'y préparer.
- Si quelqu'un demande comment préparer l'entretien → Ne liste pas les thèmes. Explique ce que l'agent cherche vraiment à évaluer (attachement à la France, intégration réelle, cohérence du discours), les erreurs classiques, et ce qui fait la différence.

STRUCTURE JSON OBLIGATOIRE :
{
  "summary": "Accroche chaleureuse + résumé de la situation (2-3 phrases engageantes, pas un résumé froid)",
  "what_it_means": "Explication détaillée de ce que ça signifie CONCRÈTEMENT pour la personne. Inclus les étapes qui suivent avec des emojis (📂, 📅, ⏳). Explique les enjeux réels, pas juste la procédure. 4-8 phrases minimum.",
  "what_to_do": "Conseils PRATIQUES et CONCRETS. Ce que la personne devrait faire maintenant, les documents à préparer, les pièges à éviter. Parle comme un conseiller expérimenté qui veut vraiment aider. 4-8 phrases minimum.",
  "watch_out": "Les points de vigilance VRAIMENT importants. Les erreurs classiques, les idées reçues, ce que beaucoup ignorent. Sois direct et utile. 3-5 phrases minimum.",
  "official_links": ["liens officiels RÉELS et pertinents — uniquement des vrais liens service-public.fr, interieur.gouv.fr ou immigration.interieur.gouv.fr"]
}

RÈGLES :
- Chaque champ doit être SUBSTANTIEL — jamais de réponse en une phrase.
- Ne mets RIEN en dehors du JSON. Pas de markdown, pas de texte avant ou après.
- Les liens dans official_links doivent être des URLs réelles et vérifiables. Si tu n'es pas sûr d'un lien, mets uniquement https://www.service-public.fr`

        userPrompt = `Catégorie : ${category}
Question de l'utilisateur : ${userQuestion}

Rappel : Raisonne en profondeur. La personne qui pose cette question est probablement stressée et a besoin de réponses concrètes, humaines et détaillées — pas d'un résumé administratif froid.`
        break
      }

      default:
        return NextResponse.json({ error: 'Mode invalide' }, { status: 400 })
    }

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(rawContent)
    } catch {
      parsed = { error: 'Impossible de parser la réponse IA' }
    }

    return NextResponse.json({ mode, data: parsed })
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
