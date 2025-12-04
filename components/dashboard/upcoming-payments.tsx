'use client'

import { Card } from '@/components/ui/card'

interface Payment {
  id: string
  description: string
  amount: number
  dueDateLabel: string
  category: string
}

// Demo payment data - in production this comes from the database
const upcomingPayments: Payment[] = [
  { id: '1', description: 'Monthly Payroll', amount: 4500000, dueDateLabel: 'Next week', category: 'payroll' },
  { id: '2', description: 'Office Rent', amount: 250000, dueDateLabel: 'In 2 weeks', category: 'rent' },
  { id: '3', description: 'VAT Payment', amount: 180000, dueDateLabel: 'In 3 weeks', category: 'tax' },
]

export function UpcomingPayments() {
  // In production, this would fetch upcoming bills from the database

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Upcoming Payments</h2>
      <div className="space-y-4">
        {upcomingPayments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between py-3 border-b last:border-b-0"
          >
            <div>
              <p className="font-medium">{payment.description}</p>
              <p className="text-sm text-muted-foreground">
                Due: {payment.dueDateLabel}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-red-600">
                -£{(payment.amount / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
              <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                {payment.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
