export function buildSystemPrompt(brandVoice = null, language = 'es') {
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

export function buildUserPrompt(transcript, formats) {
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
