import { NextResponse } from 'next/server'
import { sendAllWeeklyDigests } from '@/lib/email/send-alerts'

// Weekly digest cron - runs every Monday at 8am
// Add to vercel.json: { "crons": [{ "path": "/api/cron/digest", "schedule": "0 8 * * 1" }] }

// Force dynamic rendering - dont try to evaluate at build time
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const results = await sendAllWeeklyDigests()

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Digest cron error:', error)
    return new NextResponse('Digest failed', { status: 500 })
  }
}
