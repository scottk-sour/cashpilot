import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        forecasts: {
          where: { isActive: true },
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if user has Growth or Pro plan
    const hasPremiumPlan = user.plan === 'GROWTH' || user.plan === 'PRO'
    if (!hasPremiumPlan) {
      return new NextResponse('Upgrade required', { status: 403 })
    }

    const forecast = user.forecasts[0]
    if (!forecast) {
      return new NextResponse('No forecast available', { status: 404 })
    }

    return NextResponse.json({
      weeks: forecast.weeks,
      cashBuffer: user.cashBuffer,
      plan: user.plan,
    })
  } catch (error) {
    console.error('Scenarios forecast error:', error)
    return new NextResponse('Failed to fetch forecast', { status: 500 })
  }
}
