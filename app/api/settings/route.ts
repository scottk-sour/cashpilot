import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  cashBuffer: z.number().min(0).max(100000000).optional(), // Max £1M in pence
})

export async function PATCH(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { cashBuffer } = updateSettingsSchema.parse(body)

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
      },
    })

    return NextResponse.json({
      cashBuffer: updatedUser.cashBuffer,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid input', { status: 400 })
    }
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
