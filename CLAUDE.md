# CLAUDE.md — Reposta

> Este archivo es la memoria permanente del proyecto. Léelo completo al inicio de cada sesión antes de tocar cualquier código.

---

## ¿Qué es Reposta?

Reposta es un micro SaaS global de repurposing de contenido con IA, diseñado específicamente para el mercado hispanohablante pero con capacidad de expansión a cualquier idioma. Resuelve un dolor real y cuantificable: los creadores de contenido (emprendedores, coaches, podcasters, marcas) invierten horas produciendo un video o podcast y luego tienen que invertir horas adicionales adaptando ese mismo contenido para cada plataforma. Reposta elimina esas horas adicionales con un solo clic.

**Problema central:** Un creador produce 1 pieza de contenido largo pero necesita presencia en 5–7 plataformas diferentes, cada una con formato, tono y longitud distintos. Hacerlo manualmente toma 3–6 horas. Reposta lo hace en menos de 60 segundos.

**Por qué ganamos:** Las herramientas existentes (Repurpose.io, Castmagic, Lately) están en inglés, piensan en inglés y producen español de calidad traducida, no española nativa. Reposta piensa, entiende y genera en español real desde el núcleo — con modismos, estructuras de frase y tono que resuenan con audiencias latinas y españolas.

---

## Visión a largo plazo

**Año 1:** Líder en repurposing de contenido en español. 1.000+ usuarios pagos en LATAM y España.

**Año 2:** Expansión a inglés, portugués y francés. Motor multilingüe. Integraciones directas con plataformas (Buffer, Hootsuite, Later). 10.000+ usuarios pagos globales.

**Año 3:** Reposta como plataforma de distribución de contenido con IA — no solo genera, sino que programa, publica y analiza el rendimiento. Competidor directo de Repurpose.io y Castmagic a nivel global.

**Mercado objetivo global:** +600 millones de hispanohablantes, 230 millones de lusófonos, mercado de creadores de contenido estimado en $250B para 2027.

---

## Stack tecnológico

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Frontend | React 18 + Vite + Tailwind CSS | Stack ya dominado por el equipo |
| Backend/Auth/DB | Supabase | Auth, PostgreSQL, Storage, Row-Level Security |
| IA — generación | Anthropic API (claude-sonnet-4-6) | Motor principal de generación de contenido |
| IA — transcripción audio | OpenAI Whisper API | Fallback para audio sin captions |
| Transcripción YouTube | youtube-transcript-api (librería Python/npm) | Extracción gratuita de captions existentes |
| Pagos | Stripe | Suscripciones, webhooks, portal de cliente |
| Deploy | Vercel | CI/CD automático desde GitHub |
| Email transaccional | Resend | Onboarding, alertas, notificaciones |
| Analytics | Posthog (free tier) | Funnel de conversión, eventos clave |

**Repositorio GitHub:** conexiondigitalweb/reposta
**Proyecto Vercel:** reposta
**URL producción:** reposta.live

---

## Arquitectura de la aplicación

```
reposta/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx          # Página pública de conversión
│   │   ├── Login.jsx            # Auth con Supabase (Google + Email)
│   │   ├── Dashboard.jsx        # Vista principal post-login
│   │   ├── Reprocesar.jsx       # Flujo principal de generación
│   │   ├── Historial.jsx        # Historial de contenidos generados
│   │   ├── Configuracion.jsx    # Perfil, tono de marca, suscripción
│   │   └── Pricing.jsx          # Página pública de precios
│   ├── components/
│   │   ├── InputContent/        # Componentes de entrada (URL, texto, audio)
│   │   ├── OutputCards/         # Tarjetas por formato de salida
│   │   ├── UsageBar.jsx         # Contador de usos del plan freemium
│   │   ├── UpgradeModal.jsx     # Modal de conversión al muro de pago
│   │   └── BrandVoice.jsx       # Configurador de tono de marca
│   ├── api/
│   │   ├── generate.js          # Serverless function — llama a Anthropic API
│   │   ├── transcribe.js        # Serverless function — extrae transcript YouTube
│   │   ├── stripe-webhook.js    # Webhook de Stripe para actualizar plan
│   │   └── usage.js             # Control de límites por plan
│   ├── lib/
│   │   ├── supabase.js          # Cliente Supabase
│   │   ├── prompts.js           # Todos los prompts del sistema (archivo crítico)
│   │   └── plans.js             # Definición de límites por plan
│   └── store/
│       └── useAppStore.js       # Estado global con Zustand
├── api/                         # Vercel serverless functions (Node.js)
├── public/
└── CLAUDE.md                    # Este archivo
```

---

## Base de datos — esquema Supabase

```sql
-- Usuarios (extiende auth.users de Supabase)
profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  plan text default 'free',           -- 'free' | 'creator' | 'agency'
  stripe_customer_id text,
  stripe_subscription_id text,
  brand_voice text,                    -- Descripción del tono de marca (plan Creator+)
  monthly_uses_count integer default 0,
  monthly_uses_reset_at timestamptz,
  created_at timestamptz default now()
)

-- Cada pieza de contenido procesada
generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  input_type text,                     -- 'youtube_url' | 'text' | 'audio'
  input_content text,                  -- URL o texto original
  input_title text,                    -- Título detectado o asignado
  outputs jsonb,                       -- { tweets: [], linkedin: [], reels: [], newsletter: '', blog: '', carousel: '' }
  word_count integer,
  language text default 'es',
  created_at timestamptz default now(),
  expires_at timestamptz               -- null en planes pagos, +7 días en free
)

-- Log de uso para control de límites
usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  generation_id uuid references generations(id),
  plan_at_time text,
  created_at timestamptz default now()
)
```

---

## Planes y límites

```javascript
// src/lib/plans.js
export const PLANS = {
  free: {
    name: 'Explorador',
    price: 0,
    monthlyGenerations: 3,
    outputFormats: ['tweets', 'linkedin', 'reels', 'carousel'],   // 4 de 6
    historyDays: 7,
    brandVoice: false,
    multipleClients: false,
    exportBulk: false,
    variations: false,
  },
  creator: {
    name: 'Creador',
    price: 12,                  // USD/mes
    stripeMonthlyPriceId: 'price_XXXX',
    monthlyGenerations: 30,
    outputFormats: ['tweets', 'linkedin', 'reels', 'carousel', 'newsletter', 'blog'],
    historyDays: 60,
    brandVoice: true,
    multipleClients: false,     // hasta 1 marca
    exportBulk: false,
    variations: false,
  },
  agency: {
    name: 'Agencia',
    price: 29,                  // USD/mes
    stripeMonthlyPriceId: 'price_XXXX',
    monthlyGenerations: Infinity,
    outputFormats: ['tweets', 'linkedin', 'reels', 'carousel', 'newsletter', 'blog'],
    historyDays: Infinity,
    brandVoice: true,
    multipleClients: true,      // hasta 5 marcas/clientes
    exportBulk: true,
    variations: true,           // genera 2 variaciones de cada formato
  }
}
```

---

## El muro de conversión (freemium → pago)

Este es el mecanismo más importante del producto. Cada restricción debe sentirse como una necesidad bloqueada, no como un castigo.

### Muro 1 — Límite de usos (más efectivo)
- Al generar la 3ra pieza del mes, aparece `<UpgradeModal>` con mensaje: *"Has usado tus 3 generaciones gratuitas de este mes. Pasa a Creador por $12/mes y genera hasta 30 piezas."*
- El botón de generar queda deshabilitado con contador visible: "0 / 3 generaciones disponibles"

### Muro 2 — Historial (segundo más efectivo)
- Generaciones free tienen `expires_at = now() + 7 days`
- Cron job diario (o trigger en acceso) marca expiradas y las oculta
- Banner en Historial: *"Tu contenido del 18 de junio se eliminará en 2 días. Actualiza para guardarlo para siempre."*

### Muro 3 — Formatos premium (visible pero no agresivo)
- Newsletter y Blog Post se muestran en la UI con icono candado y preview borroso
- Al hacer clic: modal de upgrade, no error
- Principio: el usuario debe *ver* lo que se pierde, no solo leer que no puede acceder

### Muro 4 — Tono de marca
- El input de tono de marca existe en la UI del plan free
- Al intentar guardar: *"El tono de marca personalizado está disponible desde el plan Creador"*
- Esto crea deseo antes de crear la restricción

---

## Flujo de generación — lógica de negocio

```
Usuario pega URL de YouTube o texto
    │
    ├─ Si URL YouTube:
    │     └─ api/transcribe.js extrae transcript con youtube-transcript-api
    │         └─ Si no hay captions: fallback a Whisper API (descarga audio)
    │
    └─ Si texto: usa directamente
    │
    ▼
Verificar límites del plan (api/usage.js)
    └─ Si superado: retornar error 429 con código "LIMIT_REACHED"
    │
    ▼
api/generate.js llama a Anthropic API
    └─ Prompt del sistema: ver sección PROMPTS más abajo
    └─ Genera los 6 formatos en una sola llamada (economía de tokens)
    │
    ▼
Guardar en generations (Supabase)
    └─ Incrementar usage_logs
    │
    ▼
Retornar outputs al frontend
    └─ Renderizar en OutputCards por formato
```

---

## Prompts del sistema — el corazón del producto

**Principio fundamental:** Un solo llamado a la API genera TODOS los formatos. Esto es crítico para el costo operativo.

```javascript
// src/lib/prompts.js

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
```

---

## Variables de entorno requeridas

```bash
# .env.local
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Solo en serverless functions, nunca al frontend

ANTHROPIC_API_KEY=                # Para la generación de contenido
OPENAI_API_KEY=                   # Para Whisper (fallback de transcripción)

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_CREATOR_PRICE_ID=          # ID del precio mensual plan Creador
STRIPE_AGENCY_PRICE_ID=           # ID del precio mensual plan Agencia

RESEND_API_KEY=                   # Emails transaccionales
VITE_POSTHOG_KEY=                 # Analytics (opcional en desarrollo)
```

---

## Comandos del proyecto

```bash
npm install
npm run dev          # Desarrollo local en localhost:5173
npm run build        # Build de producción
npm run preview      # Preview del build

# Supabase CLI
npx supabase start   # Supabase local
npx supabase db push # Aplicar migraciones
```

---

## Fases de construcción

### Fase 0 — Infraestructura (Sesión 1)
- [ ] Crear proyecto React + Vite + Tailwind
- [ ] Configurar Supabase: auth, tablas, RLS policies
- [ ] Deploy inicial en Vercel
- [ ] Configurar variables de entorno en Vercel

### Fase 1 — MVP funcional (Sesiones 2–3)
- [ ] Landing page con propuesta de valor clara
- [ ] Auth completo: Google OAuth + Email/Password
- [ ] Flujo principal: entrada texto → generación → outputs en tarjetas
- [ ] Extracción de transcript YouTube (URL → texto)
- [ ] Control de límites freemium (3 usos/mes)
- [ ] Historial básico con expiración

### Fase 2 — Monetización (Sesión 4)
- [ ] Integración Stripe: checkout, portal, webhooks
- [ ] Página de precios con los 3 planes
- [ ] UpgradeModal en cada punto de fricción
- [ ] Actualización automática de plan en Supabase tras pago

### Fase 3 — Retención y valor (Sesión 5)
- [ ] Tono de marca (Brand Voice) — plan Creator+
- [ ] Exportación por formato (copiar, descargar)
- [ ] Onboarding email con Resend
- [ ] Dashboard con métricas del usuario

### Fase 4 — Crecimiento (Sesiones 6+)
- [ ] Soporte para audio/podcast (upload MP3 → Whisper)
- [ ] Múltiples marcas/clientes — plan Agencia
- [ ] Variaciones de cada formato
- [ ] Compartir generación con link público
- [ ] Programación de publicación (integración Buffer API)
- [ ] Expansión a portugués (pt-BR)
- [ ] Expansión a inglés

---

## Reglas de desarrollo (no negociables)

1. **Auditar antes de implementar.** Antes de cualquier cambio, revisar qué existe. Nunca asumir.
2. **Verificar build antes de commit.** `npm run build` debe pasar sin errores antes de cada push.
3. **Revertir inmediatamente** si deploy genera pantalla en blanco o error 500.
4. **Cero intervención del usuario en flujos críticos.** Si algo requiere acción manual del usuario fuera del flujo diseñado, es un bug de UX, no un feature.
5. **Los prompts viven en `src/lib/prompts.js`** y solo ahí. Nunca hardcodear strings de prompt en componentes.
6. **El conteo de usos es sagrado.** Nunca decrementar manualmente. Solo el webhook de Stripe y el cron de reset mensual tocan `monthly_uses_count`.
7. **Mobile-first.** El 70%+ de los usuarios hispanohablantes acceden desde móvil.
8. **Las serverless functions nunca exponen `SUPABASE_SERVICE_ROLE_KEY` al cliente.**

---

## Estado actual del proyecto

**Fecha de inicio:** Junio 2026
**Fase actual:** 0 — Por iniciar
**Próxima sesión:** Crear proyecto, configurar Supabase, primer deploy

---

## Contexto del founder

**Fundador:** Doiler Alfonso Sanjuán Sánchez
**GitHub:** conexiondigitalweb
**Stack dominado:** React + Vite + Tailwind + Supabase + Vercel (de marcagol.live y HatoSmart)
**Workflow:** Claude chat como capa de estrategia y arquitectura. Claude Code CLI como ejecutor de código.
**Criterio UX:** Cero fricción para el usuario final. Si algo depende de una acción del usuario que no sea la core del producto, se elimina o se automatiza.
