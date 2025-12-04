'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function SyncButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSync = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/sync', { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Sync complete!')
        // Reload the page after 1 second to show updated data
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage(data.error || 'Sync failed')
      }
    } catch {
      setMessage('Sync failed - please try again')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleSync} disabled={isLoading}>
        {isLoading ? 'Syncing...' : 'Sync Data'}
      </Button>
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  )
}
