import { getCurrentUser } from '../../../lib/auth.js'
import { createCheckoutSession } from '../../../lib/stripe.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { priceId } = req.body
    
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID required' })
    }

    // Validate it's one of our prices
    const validPrices = [
      process.env.STRIPE_PRICE_WEEKLY,
      process.env.STRIPE_PRICE_MONTHLY,
      process.env.STRIPE_PRICE_YEARLY
    ]

    if (!validPrices.includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' })
    }

    const session = await createCheckoutSession(priceId, user.email, user.id)

    console.log(`✅ Created checkout session for ${user.email}, price: ${priceId}`)

    res.status(200).json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    })
  } catch (error) {
    console.error('Checkout error:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
} 