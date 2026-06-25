import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PRICE_TO_PLAN = {
  [process.env.STRIPE_CREATOR_PRICE_ID]: 'creator',
  [process.env.STRIPE_AGENCY_PRICE_ID]: 'agency',
}

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return res.status(400).send('Webhook signature invalid')
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const sub = event.data.object
    const priceId = sub.items.data[0]?.price.id
    const plan = PRICE_TO_PLAN[priceId] || 'free'

    await supabase
      .from('profiles')
      .update({ plan, stripe_subscription_id: sub.id })
      .eq('stripe_customer_id', sub.customer)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    await supabase
      .from('profiles')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_customer_id', sub.customer)
  }

  return res.status(200).json({ received: true })
}
