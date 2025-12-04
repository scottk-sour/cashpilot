import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateSettingsSchema, validateBody } from '@/lib/validation'
import { apiRateLimiter, rateLimitResponse, getClientIdentifier } from '@/lib/rate-limit'

export async function PATCH(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Rate limit
  const identifier = getClientIdentifier(req, userId)
  const rateLimitResult = apiRateLimiter.check(identifier)
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.reset)
  }

  try {
    // Validate input
    const validation = await validateBody(req, updateSettingsSchema)
    if (!validation.success) {
      return new NextResponse(validation.error, { status: 400 })
    }
    const { cashBuffer, currency } = validation.data

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(cashBuffer !== undefined && { cashBuffer }),
        ...(currency !== undefined && { currency }),
      },
    })

    return NextResponse.json({
      cashBuffer: updatedUser.cashBuffer,
      currency: updatedUser.currency,
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return new NextResponse('Failed to update settings', { status: 500 })
  }
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        cashBuffer: true,
        currency: true,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Settings fetch error:', error)
    return new NextResponse('Failed to fetch settings', { status: 500 })
  }
}
