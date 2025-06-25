import { buffer } from 'micro'
import stripe from '../../../lib/stripe.js'
import { supabase } from '../../../lib/supabase.js'
import { getUserByEmail } from '@/lib/database.js'
import Stripe from 'stripe'

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    const body = await buffer(req)
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  console.log('🎣 Received webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      default:
        console.log(`🤷 Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

async function handleCheckoutCompleted(session) {
  const customerEmail = session.customer_details.email

  console.log(`💰 Checkout completed for customer: ${customerEmail}`)

  const { data: user, error } = await getUserByEmail(customerEmail)

  if (user) {
    const env = process.env.ENVIRONMENT || 'development'
    const prefixedEmail = env === 'staging' ? `staging_${customerEmail}` : customerEmail
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'pro',
        stripe_customer_id: session.customer,
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      })
      .eq('email', prefixedEmail)

    if (updateError) {
      console.error('Failed to update user subscription:', updateError)
    } else {
      console.log(`User ${customerEmail} upgraded to Pro`)
    }
  }
}

async function handleSubscriptionUpdated(subscription) {
  const customerEmail = await stripeInstance.customers.retrieve(subscription.customer).email

  console.log(`🔄 Subscription updated for customer: ${customerEmail}`)

  const { data: user } = await getUserByEmail(customerEmail)

  if (user) {
    const env = process.env.ENVIRONMENT || 'development'
    const prefixedEmail = env === 'staging' ? `staging_${customerEmail}` : customerEmail
    
    const status = subscription.status === 'active' ? 'pro' : 'cancelled'
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: status,
        subscription_end_date: new Date(subscription.current_period_end * 1000)
      })
      .eq('email', prefixedEmail)

    if (updateError) {
      console.error('Failed to update user subscription:', updateError)
    } else {
      console.log(`User ${customerEmail} subscription updated to ${status}`)
    }
  }
}

async function handleSubscriptionDeleted(subscription) {
  const customerEmail = await stripeInstance.customers.retrieve(subscription.customer).email

  console.log(`❌ Subscription cancelled for customer: ${customerEmail}`)

  const { data: user } = await getUserByEmail(customerEmail)

  if (user) {
    const env = process.env.ENVIRONMENT || 'development'
    const prefixedEmail = env === 'staging' ? `staging_${customerEmail}` : customerEmail
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'cancelled',
        subscription_end_date: new Date(subscription.ended_at * 1000)
      })
      .eq('email', prefixedEmail)

    if (updateError) {
      console.error('Failed to cancel user subscription:', updateError)
    } else {
      console.log(`User ${customerEmail} subscription cancelled`)
    }
  }
} 