import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Los prompts se importan con ruta relativa al directorio api/
// Usamos inline para evitar problemas de resolución en Vercel serverless
function buildSystemPrompt(brandVoice = null, language = 'es') {
  return `Eres un experto en marketing de contenido y copywriting para el mercado hispanohablante.
Tu trabajo es transformar contenido largo en múltiples formatos optimizados para cada plataforma.

IDIOMA DE SALIDA: ${language === 'es' ? 'Español latino natural, no traducido del inglés. Sin anglicismos innecesarios. Voz directa, cálida y cercana.' : language}

${brandVoice ? `VOZ DE MARCA DEL USUARIO: ${brandVoice}. Adapta TODO el contenido a esta voz.` : 'VOZ: Usa un tono emprendedor, directo, motivador y cercano. Evita corporativismo.'}

REGLAS DE CALIDAD:
- Nunca uses frases genéricas como "En este video..." o "Como mencioné..."
- Cada formato debe poder existir solo, sin depender del contenido original
- Los hooks deben generar curiosidad o identificación inmediata
- Adapta el registro a cada plataforma: Twitter/X es casual, LinkedIn es profesional pero humano, Reels son conversacionales
- NUNCA traduzcas — crea en español nativo desde el origen`
}

function buildUserPrompt(transcript) {
  return `Aquí está el contenido a transformar:

---
${transcript}
---

Genera el siguiente JSON con exactamente esta estructura. No agregues texto fuera del JSON:

{
  "title": "Título descriptivo del contenido (máximo 60 caracteres)",
  "summary": "Resumen ejecutivo en 2 oraciones",
  "tweets": [
    {"text": "Tweet 1 con hook poderoso (máx 280 chars, sin hashtags en el cuerpo)", "type": "hook"},
    {"text": "Tweet 2 con insight clave", "type": "insight"},
    {"text": "Tweet 3 en formato hilo (1/5) con apertura", "type": "thread_start"},
    {"text": "Tweet 4 con dato o estadística", "type": "data"},
    {"text": "Tweet 5 con CTA y reflexión", "type": "cta"}
  ],
  "linkedin": [
    {"text": "Post LinkedIn largo (300-600 palabras) con gancho inicial, desarrollo y CTA. Usa saltos de línea estratégicos.", "type": "storytelling"},
    {"text": "Post LinkedIn corto (100-200 palabras) directo al insight principal", "type": "insight"},
    {"text": "Post LinkedIn en formato lista numerada con los 5 puntos clave", "type": "list"}
  ],
  "reels": [
    {"script": "Guión para Reel de 30 segundos. Incluye: [HOOK 0-3s], [DESARROLLO 3-25s], [CTA 25-30s]", "duration": 30},
    {"script": "Guión para Reel de 60 segundos con más desarrollo", "duration": 60},
    {"script": "Guión para TikTok conversacional, más informal y dinámico", "duration": 45}
  ],
  "newsletter": "Email completo listo para enviar. Incluye: asunto sugerido, saludo, cuerpo con 3-4 párrafos, CTA final, despedida. Formato markdown.",
  "blog": "Post de blog completo (600-900 palabras) con introducción, 3-4 secciones con subtítulos H2, conclusión y CTA. Formato markdown. Optimizado para SEO en español.",
  "carousel": [
    {"slide": 1, "title": "Título de portada impactante", "subtitle": "Subtítulo que amplía"},
    {"slide": 2, "title": "Punto 1", "content": "Desarrollo breve (máx 30 palabras)"},
    {"slide": 3, "title": "Punto 2", "content": "Desarrollo breve"},
    {"slide": 4, "title": "Punto 3", "content": "Desarrollo breve"},
    {"slide": 5, "title": "Punto 4", "content": "Desarrollo breve"},
    {"slide": 6, "title": "Punto 5", "content": "Desarrollo breve"},
    {"slide": 7, "title": "Conclusión o CTA", "content": "Llamado a la acción"}
  ]
}`
}

const PLANS = {
  free:    { monthlyGenerations: 3 },
  creator: { monthlyGenerations: 30 },
  agency:  { monthlyGenerations: Infinity },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { transcript, userId, brandVoice, language = 'es' } = req.body

  if (!transcript?.trim()) {
    return res.status(400).json({ error: 'El contenido no puede estar vacío.' })
  }
  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado.' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Verificar límites
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan, monthly_uses_count, monthly_uses_reset_at, brand_voice')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return res.status(404).json({ error: 'Perfil no encontrado.' })
  }

  // Reset mensual automático si ya pasó el mes
  const resetAt = new Date(profile.monthly_uses_reset_at)
  const now = new Date()
  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    await supabase
      .from('profiles')
      .update({ monthly_uses_count: 0, monthly_uses_reset_at: now.toISOString() })
      .eq('id', userId)
    profile.monthly_uses_count = 0
  }

  const planLimits = PLANS[profile.plan] ?? PLANS.free
  if (planLimits.monthlyGenerations !== Infinity && profile.monthly_uses_count >= planLimits.monthlyGenerations) {
    return res.status(429).json({ code: 'LIMIT_REACHED' })
  }

  // Llamada a Anthropic
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const effectiveBrandVoice = brandVoice || (profile.plan !== 'free' ? profile.brand_voice : null)

  let raw
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: buildSystemPrompt(effectiveBrandVoice, language),
      messages: [{ role: 'user', content: buildUserPrompt(transcript) }],
    })
    raw = message.content[0].text
  } catch (err) {
    console.error('Anthropic error:', err)
    return res.status(502).json({ error: 'Error al conectar con la IA. Intenta de nuevo.' })
  }

  // Parsear JSON — limpiar posibles bloques de código que la IA añada
  let outputs
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    outputs = JSON.parse(cleaned)
  } catch {
    console.error('JSON parse error. Raw:', raw.slice(0, 500))
    return res.status(502).json({ error: 'Error al procesar la respuesta de la IA. Intenta de nuevo.' })
  }

  // Guardar generation
  const isPaid = profile.plan !== 'free'
  const { data: generation, error: insertError } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      input_type: 'text',
      input_content: transcript.slice(0, 5000),
      input_title: outputs.title ?? 'Sin título',
      outputs,
      language,
      expires_at: isPaid ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (insertError) {
    console.error('Insert error:', insertError)
    return res.status(500).json({ error: 'Error al guardar la generación.' })
  }

  // Log de uso + incremento
  await Promise.all([
    supabase.from('usage_logs').insert({
      user_id: userId,
      generation_id: generation.id,
      plan_at_time: profile.plan,
    }),
    supabase
      .from('profiles')
      .update({ monthly_uses_count: profile.monthly_uses_count + 1 })
      .eq('id', userId),
  ])

  return res.status(200).json({ generation })
}
