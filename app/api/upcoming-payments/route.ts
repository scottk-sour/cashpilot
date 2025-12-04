import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addDays, differenceInDays } from 'date-fns'

interface TransactionRecord {
  id: string
  date: Date
  amount: number
  description: string
  category: string | null
  contact: string | null
}

interface RecurringPayment {
  id: string
  description: string
  amount: number
  category: string
  lastDate: Date
  avgDaysBetween: number
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get last 6 months of expense transactions
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense',
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: 'asc' },
    })

    // Group by category and contact to find recurring payments
    const grouped = new Map<string, TransactionRecord[]>()

    transactions.forEach((txn: TransactionRecord) => {
      const key = txn.category || txn.contact || txn.description.slice(0, 30)
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(txn)
    })

    // Identify recurring payments (3+ occurrences with regular intervals)
    const recurringPayments: RecurringPayment[] = []

    grouped.forEach((txns: TransactionRecord[], key: string) => {
      if (txns.length >= 3) {
        // Calculate average days between payments
        let totalDays = 0
        for (let i = 1; i < txns.length; i++) {
          totalDays += differenceInDays(txns[i].date, txns[i - 1].date)
        }
        const avgDaysBetween = totalDays / (txns.length - 1)

        // Only include if interval is roughly consistent (monthly, weekly, etc.)
        if (avgDaysBetween >= 7 && avgDaysBetween <= 365) {
          const avgAmount = Math.round(
            txns.reduce((sum: number, t: TransactionRecord) => sum + t.amount, 0) / txns.length
          )

          recurringPayments.push({
            id: txns[txns.length - 1].id,
            description: txns[txns.length - 1].description,
            amount: avgAmount,
            category: key,
            lastDate: txns[txns.length - 1].date,
            avgDaysBetween,
          })
        }
      }
    })

    // Project next payment dates and filter to next 4 weeks
    const today = new Date()
    const fourWeeksFromNow = addDays(today, 28)

    const upcomingPayments = recurringPayments
      .map((payment) => {
        const nextDate = addDays(payment.lastDate, payment.avgDaysBetween)
        // If next date is in the past, add another interval
        let projectedDate = nextDate
        while (projectedDate < today) {
          projectedDate = addDays(projectedDate, payment.avgDaysBetween)
        }

        const daysUntil = differenceInDays(projectedDate, today)
        let dueDateLabel: string
        if (daysUntil <= 7) {
          dueDateLabel = daysUntil <= 1 ? 'Tomorrow' : `In ${daysUntil} days`
        } else if (daysUntil <= 14) {
          dueDateLabel = 'Next week'
        } else if (daysUntil <= 21) {
          dueDateLabel = 'In 2 weeks'
        } else {
          dueDateLabel = 'In 3 weeks'
        }

        return {
          id: payment.id,
          description: payment.description,
          amount: payment.amount,
          category: payment.category,
          projectedDate: projectedDate.toISOString(),
          dueDateLabel,
          daysUntil,
        }
      })
      .filter((p) => p.projectedDate <= fourWeeksFromNow.toISOString())
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5) // Show top 5 upcoming

    return NextResponse.json({ payments: upcomingPayments })
  } catch (error) {
    console.error('Upcoming payments error:', error)
    return new NextResponse('Failed to fetch upcoming payments', { status: 500 })
  }
}
