import { rateLimit, getClientIdentifier } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  describe('rateLimit', () => {
    it('should allow requests within limit', () => {
      const limiter = rateLimit({ interval: 60000, limit: 5 })

      const result1 = limiter.check('test-user-1')
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = limiter.check('test-user-1')
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it('should block requests over limit', () => {
      const limiter = rateLimit({ interval: 60000, limit: 3 })

      // Use up the limit
      limiter.check('test-user-2')
      limiter.check('test-user-2')
      limiter.check('test-user-2')

      // This should be blocked
      const result = limiter.check('test-user-2')
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should track different users separately', () => {
      const limiter = rateLimit({ interval: 60000, limit: 2 })

      // User A uses their limit
      limiter.check('user-a')
      limiter.check('user-a')
      const resultA = limiter.check('user-a')
      expect(resultA.success).toBe(false)

      // User B should still have their limit
      const resultB = limiter.check('user-b')
      expect(resultB.success).toBe(true)
      expect(resultB.remaining).toBe(1)
    })

    it('should return reset time', () => {
      const limiter = rateLimit({ interval: 60000, limit: 5 })
      const now = Date.now()

      const result = limiter.check('test-user-3')
      expect(result.reset).toBeGreaterThanOrEqual(now)
      expect(result.reset).toBeLessThanOrEqual(now + 60000 + 100) // Small buffer for timing
    })
  })

  describe('getClientIdentifier', () => {
    it('should prefer userId when available', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      const identifier = getClientIdentifier(req, 'user_123')
      expect(identifier).toBe('user:user_123')
    })

    it('should use IP when userId is not available', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      })

      const identifier = getClientIdentifier(req, null)
      expect(identifier).toBe('ip:192.168.1.1')
    })

    it('should handle missing x-forwarded-for', () => {
      const req = new Request('http://localhost')

      const identifier = getClientIdentifier(req, null)
      expect(identifier).toBe('ip:unknown')
    })
  })
})
