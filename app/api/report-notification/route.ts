import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { reportId, targetType, targetId, reporterUsername, reason } = await req.json()

    // Utilise Resend pour envoyer l'email
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Cap Citoyen <no-reply@cap-citoyen.fr>',
        to: [process.env.ADMIN_EMAIL ?? 'admin@cap-citoyen.fr'],
        subject: `🚨 Nouveau signalement — ${targetType}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #0f172a; border-radius: 16px; padding: 24px; color: white;">
              <h2 style="color: #f87171; margin: 0 0 16px;">🚨 Nouveau signalement</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #94a3b8; padding: 6px 0;">Type</td><td style="color: white;">${targetType}</td></tr>
                <tr><td style="color: #94a3b8; padding: 6px 0;">ID contenu</td><td style="color: white; font-family: monospace; font-size: 12px;">${targetId}</td></tr>
                <tr><td style="color: #94a3b8; padding: 6px 0;">Signalé par</td><td style="color: white;">${reporterUsername ?? 'Inconnu'}</td></tr>
                <tr><td style="color: #94a3b8; padding: 6px 0;">Raison</td><td style="color: white;">${reason ?? 'Non précisée'}</td></tr>
              </table>
              <div style="margin-top: 20px;">
                <a href="https://cap-citoyen.fr/admin/reports"
                  style="background: #ef4444; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Voir les signalements →
                </a>
              </div>
            </div>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Email failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Report notification error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
