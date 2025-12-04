import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { syncXeroTransactions } from '@/lib/xero-sync'
import { syncQuickBooksTransactions } from '@/lib/quickbooks-sync'
import { generateForecast } from '@/lib/forecasting'
import { syncRateLimiter, rateLimitResponse, getClientIdentifier } from '@/lib/rate-limit'

// Manual sync endpoint - allows users to refresh their data
export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Rate limit: 5 syncs per 5 minutes per user
  const identifier = getClientIdentifier(req, userId)
  const rateLimitResult = syncRateLimiter.check(identifier)
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.reset)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if user has a connected accounting software
    if (!user.xeroAccessToken && !user.qbAccessToken) {
      return new NextResponse('No accounting software connected', { status: 400 })
    }

    // Sync from connected source
    let syncResult = { synced: 0 }
    if (user.xeroAccessToken) {
      syncResult = await syncXeroTransactions(user.id)
    } else if (user.qbAccessToken) {
      syncResult = await syncQuickBooksTransactions(user.id)
    }

    // Regenerate forecast
    await generateForecast(user.id)

    return NextResponse.json({
      success: true,
      synced: syncResult.synced,
      message: `Synced ${syncResult.synced} transactions and updated forecast`,
    })
  } catch (error) {
    console.error('Manual sync error:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Sync failed',
      { status: 500 }
    )
  }
}
