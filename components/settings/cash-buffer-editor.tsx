'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CashBufferEditorProps {
  initialValue: number // in pence
}

export function CashBufferEditor({ initialValue }: CashBufferEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue / 100) // Convert to pounds
  const [savedValue, setSavedValue] = useState(initialValue / 100)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashBuffer: Math.round(value * 100) }), // Convert to pence
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      setSavedValue(value)
      setIsEditing(false)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setValue(savedValue)
    setIsEditing(false)
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Safety Buffer</CardTitle>
        <CardDescription>
          Set the minimum cash balance you want to maintain. You&apos;ll receive
          alerts when projections fall below this amount.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">£</span>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="text-2xl font-bold w-48"
                min={0}
                max={1000000}
                step={100}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isLoading} size="sm">
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold">
              £{savedValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </span>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
