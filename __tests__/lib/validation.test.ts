import {
  updateSettingsSchema,
  checkoutSchema,
  exportQuerySchema,
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('updateSettingsSchema', () => {
    it('should accept valid cash buffer', () => {
      const result = updateSettingsSchema.safeParse({ cashBuffer: 50000 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cashBuffer).toBe(50000)
      }
    })

    it('should reject negative cash buffer', () => {
      const result = updateSettingsSchema.safeParse({ cashBuffer: -100 })
      expect(result.success).toBe(false)
    })

    it('should reject cash buffer over £1M', () => {
      const result = updateSettingsSchema.safeParse({ cashBuffer: 200000000 })
      expect(result.success).toBe(false)
    })

    it('should accept valid currency', () => {
      const result = updateSettingsSchema.safeParse({ currency: 'GBP' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid currency', () => {
      const result = updateSettingsSchema.safeParse({ currency: 'INVALID' })
      expect(result.success).toBe(false)
    })

    it('should accept empty object', () => {
      const result = updateSettingsSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('checkoutSchema', () => {
    it('should accept GROWTH plan', () => {
      const result = checkoutSchema.safeParse({ plan: 'GROWTH' })
      expect(result.success).toBe(true)
    })

    it('should accept PRO plan', () => {
      const result = checkoutSchema.safeParse({ plan: 'PRO' })
      expect(result.success).toBe(true)
    })

    it('should reject FREE plan', () => {
      const result = checkoutSchema.safeParse({ plan: 'FREE' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid plan', () => {
      const result = checkoutSchema.safeParse({ plan: 'ENTERPRISE' })
      expect(result.success).toBe(false)
    })

    it('should accept optional priceId', () => {
      const result = checkoutSchema.safeParse({ plan: 'GROWTH', priceId: 'price_123' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priceId).toBe('price_123')
      }
    })
  })

  describe('exportQuerySchema', () => {
    it('should default format to csv', () => {
      const result = exportQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.format).toBe('csv')
      }
    })

    it('should accept json format', () => {
      const result = exportQuerySchema.safeParse({ format: 'json' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid format', () => {
      const result = exportQuerySchema.safeParse({ format: 'xml' })
      expect(result.success).toBe(false)
    })
  })
})
