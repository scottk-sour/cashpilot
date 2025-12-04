'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface Payment {
  id: string
  description: string
  amount: number
  dueDateLabel: string
  category: string
}

// Demo payment data - shown when no real data is available
const demoPayments: Payment[] = [
  { id: '1', description: 'Monthly Payroll', amount: 4500000, dueDateLabel: 'Next week', category: 'payroll' },
  { id: '2', description: 'Office Rent', amount: 250000, dueDateLabel: 'In 2 weeks', category: 'rent' },
  { id: '3', description: 'VAT Payment', amount: 180000, dueDateLabel: 'In 3 weeks', category: 'tax' },
]

export function UpcomingPayments() {
  const [payments, setPayments] = useState<Payment[]>(demoPayments)
  const [isLoading, setIsLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(true)

  useEffect(() => {
    async function fetchPayments() {
      try {
        const response = await fetch('/api/upcoming-payments')
        if (response.ok) {
          const data = await response.json()
          if (data.payments && data.payments.length > 0) {
            setPayments(data.payments)
            setIsDemo(false)
          }
        }
      } catch (error) {
        console.error('Failed to fetch upcoming payments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [])

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Upcoming Payments</h2>
        {isDemo && !isLoading && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            Demo Data
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between py-3">
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-24"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-5 bg-gray-100 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No upcoming payments detected. Connect your accounting software to see projected payments.
            </p>
          ) : (
            payments.map((payment) => (
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
            ))
          )}
        </div>
      )}
    </Card>
  )
}
