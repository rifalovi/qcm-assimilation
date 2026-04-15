import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function createDbClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * GET /api/quiz/questions?level=1&themes=Valeurs,Institutions
 * Retourne les QCM actifs depuis la base (quiz_questions).
 * Si la table est vide ou inaccessible, fallback vers les fichiers statiques.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const level = parseInt(url.searchParams.get('level') ?? '1', 10)
  const themesParam = url.searchParams.get('themes') ?? ''
  const themes = themesParam.split(',').map(t => t.trim()).filter(Boolean)

  try {
    const db = createDbClient()
    let query = db.from('quiz_questions')
      .select('external_id, level, theme, question, choice_a, choice_b, choice_c, choice_d, answer, explanation')
      .eq('status', 'active')
      .eq('level', level)

    if (themes.length > 0) query = query.in('theme', themes)

    const { data, error } = await query.limit(2000)
    if (!error && data && data.length > 0) {
      // Format pour le quizEngine
      const formatted = data.map(q => ({
        id: q.external_id ?? `db-${Math.random().toString(36).slice(2)}`,
        level: q.level,
        theme: q.theme,
        question: q.question,
        choices: [
          { key: 'A', label: q.choice_a },
          { key: 'B', label: q.choice_b },
          { key: 'C', label: q.choice_c },
          { key: 'D', label: q.choice_d },
        ],
        answer: q.answer,
        explanation: q.explanation ?? '',
      }))
      return NextResponse.json({ source: 'db', questions: formatted })
    }
  } catch (e) {
    console.error('[Quiz DB] fallback to files:', e)
  }

  // Fallback fichiers statiques
  const { QUESTIONS } = await import('../../../../src/data/questions')
  const filtered = QUESTIONS.filter(q =>
    q.level === level && (themes.length === 0 || themes.includes(q.theme))
  )
  return NextResponse.json({ source: 'files', questions: filtered })
}
