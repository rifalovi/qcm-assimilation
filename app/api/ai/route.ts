import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getQuotaForRole, type AiMode } from '../../../src/lib/aiQuota'
import { rateLimit, cleanupExpired } from '../../../src/lib/rateLimit'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit IP global — 30 requêtes / 5 min par IP
    cleanupExpired()
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('x-real-ip') ?? 'unknown'
    const rl = rateLimit(`ai:${ip}`, { limit: 30, windowMs: 5 * 60 * 1000 })
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Trop de requêtes, réessayez plus tard', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } }
      )
    }

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
    let passExpiresAt: string | null = null
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, username, pass_expires_at')
        .eq('id', user.id)
        .single()
      role = (profile?.role as typeof role) ?? 'freemium'
      passExpiresAt = (profile?.pass_expires_at as string | null) ?? null
    }
    // Un freemium avec un pass actif est traité comme illimité
    const hasActivePass = passExpiresAt != null && new Date(passExpiresAt) > new Date()
    const body = await req.json()
    const { mode, question, userAnswer, correctAnswer, explanation, choices, theme,
            scorePercent, strengths, weaknesses, totalQuestions, correctCount,
            category, userQuestion, chatHistory } = body as {
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
      chatHistory?: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!mode || !['explain', 'coach', 'assistant', 'chat'].includes(mode)) {
      return NextResponse.json({ error: 'Mode invalide' }, { status: 400 })
    }

    // ── Vérification et décrément des crédits IA ─────────────────────────────
    // Freemium sans pass actif → RPCs atomiques (source de vérité DB)
    // Pass actif / premium / élite / admin → illimité, pas de décrément
    const quota = getQuotaForRole(role, mode)
    const isUnlimited = hasActivePass || quota >= 999

    if (user && !isUnlimited) {
      // Décrément atomique via RPC — couvre freemium sans pass actif
      // (isUnlimited est true pour pass, premium, élite, admin)
      const rpcName = (mode === 'explain' || mode === 'coach')
        ? 'decrement_ia_explain_credit'
        : 'decrement_ia_assistant_credit'

      const { data: creditResult, error: creditError } = await supabase
        .rpc(rpcName, { p_user_id: user.id })

      if (creditError) {
        // Erreur RPC : log mais on laisse passer (best-effort, évite de bloquer l'utilisateur)
        console.warn(`[ai/${mode}] Erreur RPC ${rpcName}:`, creditError)
      } else if (creditResult && creditResult.success === false) {
        return NextResponse.json({
          error: 'quota_exceeded',
          reason: creditResult.reason as string,
          mode,
          role,
        }, { status: 429 })
      }
    }

    // Tracker l'usage APRÈS l'appel OpenAI (pour inclure les tokens)
    // Le tracking est déplacé après la completion ci-dessous

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
        systemPrompt = `Tu es l'Assistant Cap Citoyen, spécialisé dans :
- L'examen civique 2026 (format, questions types, préparation, centres d'examen CCI, tarifs, déroulement)
- L'entretien de naturalisation (déroulement, questions fréquentes, conseils, ce que l'agent évalue)
- Le titre de séjour pluriannuel (démarches, documents, délais, renouvellement)
- Les valeurs et institutions de la République française (devise, symboles, principes, organisation)
- Le Livret du citoyen (histoire de France, géographie, culture, droits et devoirs, vie quotidienne)
- Les démarches administratives liées à l'intégration en France (naturalisation, regroupement familial, asile, etc.)

TON STYLE :
- Tu es chaleureux, encourageant et précis.
- Tu donnes des réponses détaillées et concrètes.
- Tu peux expliquer des notions du programme officiel de l'examen civique (Marianne, la Marseillaise, la laïcité, le suffrage universel, etc.).
- Tu raisonnes en profondeur : explique les enjeux, les non-dits, les pièges courants.
- Utilise des emojis pour structurer (📂 📅 ⏳ ⚠️ 👉 ✅) avec parcimonie.
- Si pertinent, mentionne les délais réalistes.

QUESTIONS HORS-SUJET :
Pour les questions qui n'ont AUCUN rapport avec l'intégration en France, l'examen civique, la culture française ou les démarches administratives (ex: recettes, sport, jeux vidéo, crypto, etc.), redirige poliment en ajoutant "off_topic": true au JSON.

STRUCTURE JSON OBLIGATOIRE :
{
  "summary": "Accroche chaleureuse + résumé (2-3 phrases engageantes)",
  "what_it_means": "Explication détaillée et concrète. 4-8 phrases minimum.",
  "what_to_do": "Conseils pratiques et concrets. 4-8 phrases minimum.",
  "watch_out": "Points de vigilance importants. 3-5 phrases minimum.",
  "official_links": ["liens officiels réels service-public.fr, interieur.gouv.fr, etc."]
}
Termine toujours le champ summary par une note d'encouragement.
Ne mets RIEN en dehors du JSON.`

        userPrompt = `Catégorie : ${category}
Question de l'utilisateur : ${userQuestion}

Rappel : Réponds avec expertise et bienveillance. Si la question porte sur l'examen civique, les valeurs de la République ou la culture française, c'est ton domaine principal — réponds en détail.`
        break
      }

      case 'chat': {
        if (!userQuestion) {
          return NextResponse.json({ error: 'Question requise' }, { status: 400 })
        }
        systemPrompt = `Tu es l'Assistant Cap Citoyen en mode conversation. Tu es spécialisé dans :
- L'examen civique 2026 (format, questions, préparation, centres d'examen, tarifs)
- L'entretien de naturalisation (déroulement, questions fréquentes, conseils)
- Le titre de séjour pluriannuel (démarches, documents, délais)
- Les valeurs et institutions de la République française (devise, symboles, principes)
- Le Livret du citoyen (histoire, géographie, culture, vie quotidienne)
- Les démarches administratives liées à l'intégration en France

STYLE :
- Direct, clair, chaleureux, encourageant.
- Réponds de façon concise (3-6 phrases).
- Pose des questions de suivi pour affiner le besoin.
- Tu PEUX répondre aux questions sur la culture civique française, l'histoire de France, les institutions — c'est ton domaine.
- Oriente vers "/assistant" pour les questions détaillées, "/resources" pour les liens officiels, "/quiz" pour s'entraîner.

HORS-SUJET :
Pour les questions sans AUCUN rapport avec la France, l'intégration, la culture française ou les démarches (ex: recettes, sport, jeux vidéo, crypto), réponds avec off_topic: true.

JSON OBLIGATOIRE :
{"response": "Ta réponse ici", "off_topic": false}
Termine toujours par : "Réponse indicative — vérifiez sur service-public.fr"
Ne mets RIEN en dehors du JSON.`

        userPrompt = userQuestion
        break
      }

      default:
        return NextResponse.json({ error: 'Mode invalide' }, { status: 400 })
    }

    // Pour chat et assistant: vérification hors-sujet AVANT appel OpenAI (économie tokens)
    // Skip si la conversation a un historique (réponses courtes comme "Non" ou "Oui" = continuation)
    const hasHistory = chatHistory && chatHistory.length > 0
    if ((mode === 'chat' || mode === 'assistant') && userQuestion && !hasHistory) {
      const q = userQuestion.toLowerCase()
      const offTopicPatterns = [
        /recette/i, /cuisine/i, /football/i, /météo/i, /jeu.?vidéo/i,
        /manga/i, /anime/i, /film/i, /série tv/i, /musique/i,
        /navette spatiale/i, /planète/i, /astronomie/i,
        /crypto/i, /bitcoin/i, /bourse/i, /trading/i,
        /graphiste/i, /design/i, /logo/i,
        /vacances/i, /voyage(?!.*visa|.*séjour|.*france)/i,
        /pokemon/i, /minecraft/i, /fortnite/i,
        /blague/i, /humour/i, /drôle/i,
        /qui a gagné/i, /match/i, /coupe du monde/i,
        /intelligence artificielle/i, /chatgpt/i, /comment tu marche/i,
      ]

      const isObviouslyOffTopic = offTopicPatterns.some(p => p.test(q))
      if (isObviouslyOffTopic) {
        const offTopicResponse = mode === 'chat'
          ? {
              response: "Je suis spécialisé dans les démarches administratives en France et la préparation à l'examen civique. Je ne peux pas répondre à cette question, mais je serais ravi de vous aider sur :\n\n• Vos démarches de naturalisation\n• La préparation de l'entretien civique\n• Le suivi de votre dossier\n• La compréhension d'un courrier administratif\n\nQue puis-je faire pour vous ?",
              off_topic: true,
            }
          : {
              summary: "Cette question sort du cadre de mes compétences.",
              what_it_means: "Je suis spécialisé dans les démarches administratives en France : naturalisation, titre de séjour, examen civique, entretien de naturalisation.",
              what_to_do: "Posez-moi une question liée à vos démarches en France — je suis là pour vous accompagner dans votre parcours d'intégration.",
              watch_out: "Pour des questions hors démarches, consultez les moteurs de recherche classiques.",
              official_links: ["https://www.service-public.fr"],
              off_topic: true,
            }
        return NextResponse.json({ mode, data: offTopicResponse })
      }
    }

    // Construire les messages pour OpenAI
    const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Pour le mode chat, inclure l'historique conversationnel (max 10 derniers messages)
    if (mode === 'chat' && chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-10)
      for (const msg of recentHistory) {
        openaiMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.role === 'assistant' ? msg.content : msg.content,
        })
      }
    }

    openaiMessages.push({ role: 'user', content: userPrompt })

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.8,
      max_tokens: mode === 'chat' ? 500 : 1500,
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(rawContent)
    } catch {
      parsed = { error: 'Impossible de parser la réponse IA' }
    }

    // Capturer les tokens et tracker l'usage
    const usage = completion.usage
    const tokenData = {
      prompt_tokens: usage?.prompt_tokens ?? 0,
      completion_tokens: usage?.completion_tokens ?? 0,
      total_tokens: usage?.total_tokens ?? 0,
      model: 'gpt-4o-mini',
    }

    // Tracker dans user_events (authentifiés et anonymes)
    const trackProps = {
      mode,
      question_id: body.questionId ?? null,
      theme: theme ?? null,
      ...tokenData,
      off_topic: parsed.off_topic === true,
    }

    if (user) {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_type: 'ai_usage',
        properties: trackProps,
      })
    } else {
      // Anonymes : tracker sans user_id pour le suivi global des tokens
      const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return [] }, setAll() {} } }
      )
      try {
        await adminClient.from('user_events').insert({
          user_id: null,
          event_type: 'ai_usage',
          properties: trackProps,
        })
      } catch {} // ignore si RLS bloque
    }

    return NextResponse.json({ mode, data: parsed })
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
