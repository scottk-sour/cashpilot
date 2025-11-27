import { auth } from '@clerk/nextjs/server'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { apiRateLimiter, rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || !user.stripeCustomerId) {
      return new NextResponse('No billing account found', { status: 404 })
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error('Failed to create Stripe portal session', error, { userId })
    return new NextResponse('Failed to create portal session', { status: 500 })
  }
}
