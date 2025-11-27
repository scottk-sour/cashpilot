import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDemoData, clearDemoData } from '@/lib/demo-data'
import { apiRateLimiter, rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Input validation schema
const demoActionSchema = z.object({
  action: z.enum(['generate', 'clear']),
})

export async function POST(req: Request) {
  // Apply rate limiting - strict limit for demo data generation
  const rateLimitResult = await rateLimit(req, apiRateLimiter)
  if (!rateLimitResult.success) {
    return rateLimitResult.response!
  }

  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let user: { id: string } | null = null

  try {
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Validate request body
    const body = await req.json()
    const validation = demoActionSchema.safeParse(body)

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

    const { action } = validation.data

    if (action === 'generate') {
      const result = await generateDemoData(user.id)
      return NextResponse.json({
        success: true,
        message: `Generated ${result.transactionCount} demo transactions`,
      })
    } else {
      // action === 'clear'
      await clearDemoData(user.id)
      return NextResponse.json({
        success: true,
        message: 'Demo data cleared',
      })
    }
  } catch (error) {
    logger.error('Failed to manage demo data', error, { userId: user?.id })
    return new NextResponse('Failed to manage demo data', { status: 500 })
  }
}
