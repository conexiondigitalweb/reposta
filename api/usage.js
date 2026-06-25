import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requerido' })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, monthly_uses_count, monthly_uses_reset_at')
    .eq('id', userId)
    .single()

  const { PLANS } = await import('../src/lib/plans.js')
  const plan = PLANS[profile?.plan || 'free']

  return res.status(200).json({
    plan: profile.plan,
    used: profile.monthly_uses_count,
    limit: plan.monthlyGenerations,
    resetAt: profile.monthly_uses_reset_at,
  })
}
