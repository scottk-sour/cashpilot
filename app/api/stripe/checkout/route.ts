import { auth } from '@clerk/nextjs/server'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { apiRateLimiter, rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const PRICES = {
  GROWTH: process.env.STRIPE_GROWTH_PRICE_ID!,
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
}

// Input validation schema
const checkoutSchema = z.object({
  priceId: z.string().optional(),
  plan: z.enum(['GROWTH', 'PRO']),
})

export async function POST(req: Request) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(req, apiRateLimiter)
  if (!rateLimitResult.success) {
    return rateLimitResult.response!
  }

  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Validate request body
    const body = await req.json()
    const validation = checkoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const { priceId, plan } = validation.data

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          clerkId: userId,
        },
      })

      customerId = customer.id

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || PRICES[plan as keyof typeof PRICES],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error('Failed to create Stripe checkout session', error, { userId })
    return new NextResponse('Failed to create checkout session', { status: 500 })
  }
}
