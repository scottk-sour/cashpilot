'use client'

import { useEffect, useState } from 'react'
import { ScenarioBuilder } from '@/components/dashboard/scenario-builder'
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface WeekData {
  weekStart: string
  weekEnd: string
  weekLabel: string
  projected: number
  income: number
  expenses: number
}

interface ForecastData {
  weeks: WeekData[]
  cashBuffer: number
  plan: string | null
}

export default function ScenariosPage() {
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [displayWeeks, setDisplayWeeks] = useState<WeekData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchForecast() {
      try {
        const response = await fetch('/api/scenarios/forecast')
        if (!response.ok) {
          if (response.status === 403) {
            setError('upgrade')
          } else {
            throw new Error('Failed to fetch forecast')
          }
          return
        }
        const data = await response.json()
        setForecast(data)
        setDisplayWeeks(data.weeks)
      } catch {
        setError('Failed to load forecast data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchForecast()
  }, [])

  const handleApplyScenario = (modifiedWeeks: WeekData[]) => {
    setDisplayWeeks(modifiedWeeks)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error === 'upgrade') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Scenario Planning</h1>
          <p className="text-muted-foreground mt-1">
            Model different scenarios to see how they affect your cash flow
          </p>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            Upgrade to Growth Plan
          </h2>
          <p className="text-blue-700 mb-6 max-w-md mx-auto">
            Scenario planning lets you model &quot;what-if&quot; situations like new contracts,
            delayed payments, or unexpected expenses to see how they affect your cash flow.
          </p>
          <Button asChild>
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (error || !forecast) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Something went wrong'}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Scenario Planning</h1>
          <p className="text-muted-foreground mt-1">
            Model different scenarios to see how they affect your cash flow
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {/* Chart with scenario modifications */}
      <CashFlowChart weeks={displayWeeks} buffer={forecast.cashBuffer} />

      {/* Scenario Builder */}
      <ScenarioBuilder
        baseWeeks={forecast.weeks}
        onApplyScenario={handleApplyScenario}
      />
    </div>
  )
}
