import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { oauthClient } from '@/lib/quickbooks'
import { authRateLimiter, rateLimit } from '@/lib/rate-limit'

// Force dynamic rendering - dont try to evaluate at build time
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(req, authRateLimiter)
  if (!rateLimitResult.success) {
    return rateLimitResult.response!
  }

  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const client = oauthClient()
    const authUri = client.authorizeUri({
      scope: [
        'com.intuit.quickbooks.accounting',
      ],
      state: userId, // Pass userId to callback
    })

    return NextResponse.redirect(authUri)
  } catch (error) {
    console.error('QuickBooks connect error:', error)
    return new NextResponse('Failed to connect to QuickBooks', { status: 500 })
  }
}
