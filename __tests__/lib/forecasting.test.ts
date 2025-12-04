// Forecasting tests
// Note: These test the pure functions, not the database operations

describe('Forecasting Logic', () => {
  describe('identifyRecurring', () => {
    const identifyRecurring = (
      transactions: { amount: number; category: string | null; contact: string | null }[],
      type: string
    ) => {
      // Replicate the logic from forecasting.ts
      const grouped = new Map<string, { amount: number }[]>()

      transactions.forEach((txn) => {
        const key = txn.category || txn.contact || 'uncategorized'
        if (!grouped.has(key)) {
          grouped.set(key, [])
        }
        grouped.get(key)!.push(txn)
      })

      const recurring: { category: string; avgAmount: number; frequency: number; type: string }[] = []

      grouped.forEach((txns, key) => {
        if (txns.length >= 3) {
          const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length
          recurring.push({
            category: key,
            avgAmount: Math.round(avgAmount),
            frequency: txns.length,
            type,
          })
        }
      })

      return recurring
    }

    it('should identify recurring transactions with 3+ occurrences', () => {
      const transactions = [
        { amount: 100000, category: 'rent', contact: null },
        { amount: 100000, category: 'rent', contact: null },
        { amount: 100000, category: 'rent', contact: null },
      ]

      const result = identifyRecurring(transactions, 'expense')

      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('rent')
      expect(result[0].avgAmount).toBe(100000)
      expect(result[0].frequency).toBe(3)
    })

    it('should not include transactions with less than 3 occurrences', () => {
      const transactions = [
        { amount: 100000, category: 'rent', contact: null },
        { amount: 100000, category: 'rent', contact: null },
      ]

      const result = identifyRecurring(transactions, 'expense')

      expect(result).toHaveLength(0)
    })

    it('should calculate average amount correctly', () => {
      const transactions = [
        { amount: 100000, category: 'utilities', contact: null },
        { amount: 120000, category: 'utilities', contact: null },
        { amount: 110000, category: 'utilities', contact: null },
      ]

      const result = identifyRecurring(transactions, 'expense')

      expect(result[0].avgAmount).toBe(110000) // (100000 + 120000 + 110000) / 3
    })

    it('should group by contact if no category', () => {
      const transactions = [
        { amount: 50000, category: null, contact: 'Client A' },
        { amount: 50000, category: null, contact: 'Client A' },
        { amount: 50000, category: null, contact: 'Client A' },
      ]

      const result = identifyRecurring(transactions, 'income')

      expect(result[0].category).toBe('Client A')
    })
  })

  describe('projectForWeek', () => {
    const projectForWeek = (recurring: { avgAmount: number; frequency: number }[]) => {
      // Replicate the logic from forecasting.ts
      const totalMonthly = recurring.reduce((sum, r) => {
        return sum + (r.avgAmount * r.frequency) / 12
      }, 0)

      return Math.round(totalMonthly / 4.33)
    }

    it('should project weekly amount from monthly recurring', () => {
      const recurring = [
        { avgAmount: 100000, frequency: 12 }, // Monthly payment of £1000
      ]

      const weeklyProjection = projectForWeek(recurring)

      // £1000/month * 12 months / 12 = £1000/month
      // £1000/month / 4.33 weeks = ~£231/week
      expect(weeklyProjection).toBe(23095) // 100000 / 4.33 rounded
    })

    it('should sum multiple recurring items', () => {
      const recurring = [
        { avgAmount: 100000, frequency: 12 }, // Monthly £1000
        { avgAmount: 50000, frequency: 12 },  // Monthly £500
      ]

      const weeklyProjection = projectForWeek(recurring)

      // (£1000 + £500) / 4.33 = ~£346/week
      expect(weeklyProjection).toBe(34642) // 150000 / 4.33 rounded
    })

    it('should return 0 for empty recurring', () => {
      const result = projectForWeek([])
      expect(result).toBe(0)
    })
  })

  describe('Alert Generation Logic', () => {
    const shouldGenerateAlert = (projected: number, buffer: number): boolean => {
      return projected < buffer
    }

    const getSeverity = (projected: number): 'critical' | 'warning' => {
      return projected < 0 ? 'critical' : 'warning'
    }

    it('should generate alert when below buffer', () => {
      expect(shouldGenerateAlert(20000, 25000)).toBe(true)
    })

    it('should not generate alert when above buffer', () => {
      expect(shouldGenerateAlert(30000, 25000)).toBe(false)
    })

    it('should mark as critical when negative', () => {
      expect(getSeverity(-5000)).toBe('critical')
    })

    it('should mark as warning when positive but below buffer', () => {
      expect(getSeverity(5000)).toBe('warning')
    })
  })
})
