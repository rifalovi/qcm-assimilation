// app/api/admin/audio/upload/route.ts
// POST multipart/form-data :
//   - file   : fichier à uploader (image, mp3, pdf…)
//   - bucket : "audio" | "public-assets" (défaut: "audio")
//   - folder : préfixe de chemin (ex: "episodes", "covers", "pdfs")
//   - name   : nom de fichier final sans extension (optionnel — sinon timestamp)
//
// Réponse : { path, publicUrl?, signedUrl? }

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

export const runtime = 'nodejs'

const ALLOWED_BUCKETS = new Set(['audio', 'public-assets'])
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

function extensionFromName(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot === -1) return ''
  return name.slice(dot).toLowerCase()
}

function slugify(input: string): string {
  return input
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'multipart/form-data attendu' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Fichier vide' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Fichier trop lourd (> 50 MB)' }, { status: 400 })
  }

  const bucketRaw = (form.get('bucket') as string | null) ?? 'audio'
  const bucket = ALLOWED_BUCKETS.has(bucketRaw) ? bucketRaw : 'audio'
  const folderRaw = (form.get('folder') as string | null) ?? ''
  const folder = folderRaw.replace(/[^a-zA-Z0-9/_-]/g, '')
  const nameRaw = (form.get('name') as string | null) ?? ''

  const ext = extensionFromName(file.name) || ''
  const base = nameRaw ? slugify(nameRaw) : `${Date.now()}-${slugify(file.name.replace(ext, ''))}`
  const path = [folder, `${base}${ext}`].filter(Boolean).join('/')

  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await gate.admin.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Bucket "public-assets" attendu public → renvoie l'URL publique.
  // Bucket "audio" reste privé → renvoie aussi une URL signée de 1 h (preview).
  const { data: publicData } = gate.admin.storage.from(bucket).getPublicUrl(path)
  let signedUrl: string | null = null
  if (bucket === 'audio') {
    const { data: signed } = await gate.admin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60)
    signedUrl = signed?.signedUrl ?? null
  }

  return NextResponse.json({
    bucket,
    path,
    publicUrl: publicData?.publicUrl ?? null,
    signedUrl,
  })
}
