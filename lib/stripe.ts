// Use dynamic import to prevent Stripe from being loaded at build time
import type Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export async function getStripe(): Promise<Stripe> {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error('Stripe secret key not configured')
    }
    const { default: Stripe } = await import('stripe')
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// Backwards compatibility - deprecated, use getStripe() instead
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    throw new Error('Use getStripe() instead of stripe directly')
  }
})
