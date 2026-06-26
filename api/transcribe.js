import { YoutubeTranscript } from 'youtube-transcript'
import ytdl from '@distube/ytdl-core'
import OpenAI from 'openai'
import { Readable } from 'stream'

// Vercel: aumentar timeout a 60s para permitir descarga + transcripción
export const maxDuration = 60

const ERROR_NO_CAPTIONS = 'Este video no tiene subtítulos activados — intenta con la pestaña "Pegar texto" o usa un video con subtítulos en YouTube.'
const ERROR_WHISPER_FAIL = 'No pudimos transcribir el audio del video. Intenta pegar el texto directamente en la pestaña "Pegar texto".'
const ERROR_VIDEO_UNAVAILABLE = 'El video no está disponible o es privado. Verifica la URL e intenta de nuevo.'
const ERROR_AUDIO_TOO_LARGE = 'El video es demasiado largo para transcripción automática (máximo ~20 minutos). Pega el texto directamente.'

// Convierte un stream de Node en Buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

// Descarga el audio del video en la calidad más baja disponible
async function downloadAudio(url) {
  if (!ytdl.validateURL(url)) {
    throw new Error('invalid_url')
  }

  // audioonly + lowestbitrate para minimizar tamaño y tiempo de descarga
  const stream = ytdl(url, {
    filter: 'audioonly',
    quality: 'lowestaudio',
  })

  const buffer = await streamToBuffer(stream)

  // Whisper acepta hasta 25 MB
  const MB = buffer.length / (1024 * 1024)
  if (MB > 24) {
    throw new Error('too_large')
  }

  return buffer
}

// Transcribe el audio con OpenAI Whisper
async function transcribeWithWhisper(audioBuffer) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Whisper necesita un File-like object; usamos el constructor de File de Node 20
  const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' })

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'es',
    response_format: 'text',
  })

  return typeof response === 'string' ? response : response.text ?? ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { url } = req.body
  if (!url?.trim()) return res.status(400).json({ error: 'URL requerida.' })

  // ── Intento 1: captions nativas ──────────────────────────────────────────

  try {
    const items = await YoutubeTranscript.fetchTranscript(url.trim())
    if (items?.length > 0) {
      const transcript = items.map((t) => t.text).join(' ').trim()
      return res.status(200).json({ transcript, source: 'captions' })
    }
  } catch {
    // Sin captions — intentar Whisper
  }

  // ── Intento 2: Whisper fallback ───────────────────────────────────────────

  if (!process.env.OPENAI_API_KEY) {
    return res.status(422).json({ error: ERROR_NO_CAPTIONS })
  }

  let audioBuffer
  try {
    audioBuffer = await downloadAudio(url.trim())
  } catch (err) {
    if (err.message === 'invalid_url') {
      return res.status(400).json({ error: ERROR_VIDEO_UNAVAILABLE })
    }
    if (err.message === 'too_large') {
      return res.status(422).json({ error: ERROR_AUDIO_TOO_LARGE })
    }
    // Video privado, eliminado o no disponible
    const msg = err.message ?? ''
    if (msg.includes('private') || msg.includes('unavailable') || msg.includes('removed')) {
      return res.status(422).json({ error: ERROR_VIDEO_UNAVAILABLE })
    }
    console.error('ytdl error:', msg)
    return res.status(422).json({ error: ERROR_WHISPER_FAIL })
  }

  try {
    const transcript = await transcribeWithWhisper(audioBuffer)
    if (!transcript?.trim()) {
      return res.status(422).json({ error: ERROR_WHISPER_FAIL })
    }
    return res.status(200).json({ transcript, source: 'whisper' })
  } catch (err) {
    console.error('Whisper error:', err.message)
    return res.status(502).json({ error: ERROR_WHISPER_FAIL })
  }
}
