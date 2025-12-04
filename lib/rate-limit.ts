import { NextResponse } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  limit: number // Max requests per interval
}

// In-memory store for rate limiting
// Note: In production with multiple serverless instances, use Redis/Upstash
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries periodically (skip in test environment)
if (typeof jest === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000) // Clean up every minute
}

export function rateLimit(config: RateLimitConfig) {
  return {
    check: (identifier: string): { success: boolean; remaining: number; reset: number } => {
      const now = Date.now()
      const key = identifier
      const record = rateLimitStore.get(key)

      if (!record || now > record.resetTime) {
        // Create new record
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + config.interval,
        })
        return {
          success: true,
          remaining: config.limit - 1,
          reset: now + config.interval,
        }
      }

      if (record.count >= config.limit) {
        return {
          success: false,
          remaining: 0,
          reset: record.resetTime,
        }
      }

      // Increment count
      record.count++
      return {
        success: true,
        remaining: config.limit - record.count,
        reset: record.resetTime,
      }
    },
  }
}

// Pre-configured rate limiters for different use cases
export const apiRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 60, // 60 requests per minute
})

export const authRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 10, // 10 auth attempts per minute
})

export const webhookRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 100, // 100 webhook calls per minute
})

export const syncRateLimiter = rateLimit({
  interval: 5 * 60 * 1000, // 5 minutes
  limit: 5, // 5 sync requests per 5 minutes
})

// Helper to create rate limit response
export function rateLimitResponse(reset: number): NextResponse {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000)
  return new NextResponse('Too many requests. Please try again later.', {
    status: 429,
    headers: {
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  })
}

// Get client identifier from request
export function getClientIdentifier(req: Request, userId?: string | null): string {
  // Prefer userId if available (authenticated requests)
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}
