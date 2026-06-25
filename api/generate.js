import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { buildSystemPrompt, buildUserPrompt } from '../src/lib/prompts.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { transcript, userId, brandVoice, language = 'es' } = req.body

  if (!transcript || !userId) {
    return res.status(400).json({ error: 'transcript y userId son requeridos' })
  }

  // Verificar límites antes de llamar a la IA
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, monthly_uses_count')
    .eq('id', userId)
    .single()

  const { PLANS } = await import('../src/lib/plans.js')
  const plan = PLANS[profile?.plan || 'free']
  if (profile.monthly_uses_count >= plan.monthlyGenerations) {
    return res.status(429).json({ code: 'LIMIT_REACHED' })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: buildSystemPrompt(brandVoice, language),
    messages: [{ role: 'user', content: buildUserPrompt(transcript) }],
  })

  const raw = message.content[0].text
  const outputs = JSON.parse(raw)

  const isPaid = profile.plan !== 'free'
  const { data: generation } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      input_type: 'text',
      input_content: transcript,
      input_title: outputs.title,
      outputs,
      language,
      expires_at: isPaid ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  await supabase.from('usage_logs').insert({
    user_id: userId,
    generation_id: generation.id,
    plan_at_time: profile.plan,
  })

  await supabase
    .from('profiles')
    .update({ monthly_uses_count: profile.monthly_uses_count + 1 })
    .eq('id', userId)

  return res.status(200).json({ generation })
}
