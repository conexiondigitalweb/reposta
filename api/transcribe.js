import { YoutubeTranscript } from 'youtube-transcript'

const ERROR_MANUAL = 'No pudimos extraer el transcript automáticamente. Copia el transcript manualmente desde YouTube (tres puntos ··· → Mostrar transcript) y pégalo en la pestaña "Pegar texto".'
const ERROR_UNAVAILABLE = 'El video no está disponible o es privado. Verifica la URL e intenta de nuevo.'

// ── Intento 1: captions nativas vía youtube-transcript ───────────────────────
async function fetchCaptions(url) {
  const items = await YoutubeTranscript.fetchTranscript(url)
  if (!items?.length) throw new Error('empty')
  return items.map((t) => t.text).join(' ').trim()
}

// ── Intento 2: Supadata API ───────────────────────────────────────────────────
async function fetchSupadata(url) {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) throw new Error('no_key')

  const endpoint = `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, {
    headers: { 'x-api-key': apiKey },
  })

  if (res.status === 404) throw new Error('not_found')
  if (!res.ok) {
    const body = await res.text()
    console.error('[transcribe] Supadata error', res.status, body.slice(0, 300))
    throw new Error('supadata_fail')
  }

  const data = await res.json()

  // Supadata devuelve { content: [ {text, offset, duration}, ... ] } o { transcript: "..." }
  if (data.content?.length) {
    return data.content.map((s) => s.text).join(' ').trim()
  }
  if (typeof data.transcript === 'string' && data.transcript.trim()) {
    return data.transcript.trim()
  }
  throw new Error('empty')
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { url } = req.body
  if (!url?.trim()) return res.status(400).json({ error: 'URL requerida.' })

  const cleanUrl = url.trim()

  // Validación básica de URL de YouTube
  const isYouTube = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(cleanUrl)
  if (!isYouTube) {
    return res.status(400).json({ error: 'Ingresa una URL válida de YouTube (youtube.com o youtu.be).' })
  }

  // ── Intento 1: captions nativas (gratis, ~1s) ─────────────────────────────
  try {
    const transcript = await fetchCaptions(cleanUrl)
    console.log('[transcribe] captions OK, chars=' + transcript.length)
    return res.status(200).json({ transcript, source: 'captions' })
  } catch (err) {
    console.log('[transcribe] captions falló:', err.message)
  }

  // ── Intento 2: Supadata API (~2s) ─────────────────────────────────────────
  try {
    const transcript = await fetchSupadata(cleanUrl)
    console.log('[transcribe] Supadata OK, chars=' + transcript.length)
    return res.status(200).json({ transcript, source: 'supadata' })
  } catch (err) {
    if (err.message === 'not_found') {
      return res.status(422).json({ error: ERROR_UNAVAILABLE })
    }
    if (err.message === 'no_key') {
      console.log('[transcribe] SUPADATA_API_KEY no configurada, saltando.')
    } else {
      console.error('[transcribe] Supadata falló:', err.message)
    }
  }

  // ── Sin opciones disponibles ───────────────────────────────────────────────
  return res.status(422).json({ error: ERROR_MANUAL })
}
