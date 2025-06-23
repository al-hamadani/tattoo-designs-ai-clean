import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default stripe

export async function createCheckoutSession(priceId, customerEmail, userId) {
  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
    customer_email: customerEmail,
    metadata: {
      userId
    }
  })
}

export async function getCustomerSubscriptions(customerId) {
  return await stripe.subscriptions.list({
    customer: customerId,
    status: 'active'
  })
} 