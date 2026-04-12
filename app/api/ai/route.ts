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
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le profil et le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, username')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'freemium'
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

    // Vérifier le quota
    const quota = getQuotaForRole(role, mode)
    if (quota < 999) {
      // Compter les usages du jour
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
        }, { status: 429 })
      }
    }

    // Tracker l'usage
    await supabase.from('user_events').insert({
      user_id: user.id,
      event_type: 'ai_usage',
      properties: { mode, question_id: body.questionId, theme },
    })

    // Appeler OpenAI selon le mode
    let systemPrompt: string
    let userPrompt: string

    switch (mode) {
      case 'explain': {
        if (!question || !correctAnswer) {
          return NextResponse.json({ error: 'Paramètres manquants pour le mode explain' }, { status: 400 })
        }
        systemPrompt = `Tu es un professeur bienveillant spécialisé dans la préparation à l'examen civique français (naturalisation).
Tu expliques les réponses de quiz de manière simple, claire et pédagogique.
Tu dois TOUJOURS répondre en JSON valide avec cette structure exacte :
{
  "simple_explanation": "Explication simple et claire de la bonne réponse",
  "why_wrong": "Pourquoi la réponse de l'utilisateur est incorrecte",
  "example": "Un exemple concret pour illustrer",
  "trap": "Le piège à éviter dans ce type de question",
  "remember": "La phrase clé à retenir"
}
Ne mets RIEN en dehors du JSON. Pas de markdown, pas de texte avant ou après.`

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
        systemPrompt = `Tu es un coach de préparation à l'examen civique français.
Tu analyses les résultats d'un quiz et donnes des conseils personnalisés.
Tu dois TOUJOURS répondre en JSON valide avec cette structure exacte :
{
  "diagnosis": "Diagnostic global en 2-3 phrases",
  "strength": "Le point fort principal identifié",
  "weakness": "Le point faible principal identifié",
  "plan": ["Étape 1 concrète", "Étape 2 concrète", "Étape 3 concrète"]
}
Ne mets RIEN en dehors du JSON. Pas de markdown, pas de texte avant ou après.`

        userPrompt = `Résultats du quiz :
Score : ${correctCount ?? 0}/${totalQuestions ?? 0} (${scorePercent ?? 0}%)
Points forts : ${strengths?.join(', ') ?? 'Aucun identifié'}
Points faibles : ${weaknesses?.join(', ') ?? 'Aucun identifié'}
Thème principal : ${theme ?? 'Général'}`
        break
      }

      case 'assistant': {
        if (!category || !userQuestion) {
          return NextResponse.json({ error: 'Catégorie et question requises' }, { status: 400 })
        }
        systemPrompt = `Tu es un assistant spécialisé dans les démarches administratives liées à l'immigration, la naturalisation et l'intégration en France.
Tu aides les candidats à comprendre les procédures et démarches administratives.
IMPORTANT : tu dois rappeler que tes réponses sont indicatives et que l'utilisateur doit toujours vérifier sur service-public.fr.
Tu dois TOUJOURS répondre en JSON valide avec cette structure exacte :
{
  "summary": "Résumé de la situation en 1-2 phrases",
  "what_it_means": "Ce que cela signifie concrètement",
  "what_to_do": "Les étapes à suivre",
  "watch_out": "Points de vigilance importants",
  "official_links": ["https://service-public.fr/...", "autre lien officiel pertinent"]
}
Ne mets RIEN en dehors du JSON. Pas de markdown, pas de texte avant ou après.`

        userPrompt = `Catégorie : ${category}
Question de l'utilisateur : ${userQuestion}`
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
      temperature: 0.7,
      max_tokens: 800,
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
