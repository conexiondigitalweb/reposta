import { YoutubeTranscript } from 'youtube-transcript'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'url es requerida' })

  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(url)
    const transcript = transcriptItems.map((t) => t.text).join(' ')
    return res.status(200).json({ transcript })
  } catch {
    // Fallback: Whisper (requiere descarga del audio — implementar en Fase 4)
    return res.status(422).json({ error: 'No se encontraron captions en este video.' })
  }
}
