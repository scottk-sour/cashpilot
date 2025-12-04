import { z } from 'zod'

// Settings validation
export const updateSettingsSchema = z.object({
  cashBuffer: z
    .number()
    .min(0, 'Cash buffer must be positive')
    .max(100000000, 'Cash buffer cannot exceed £1,000,000')
    .optional(),
  currency: z.enum(['GBP', 'USD', 'EUR']).optional(),
})

// Stripe checkout validation
export const checkoutSchema = z.object({
  plan: z.enum(['GROWTH', 'PRO']),
  priceId: z.string().optional(),
})

// Export validation
export const exportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// Webhook validation helpers
export const clerkWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string().email(),
    })).optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    image_url: z.string().url().nullable().optional(),
  }),
})

// Helper function to validate request body
export async function validateBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]
      return { success: false, error: firstIssue?.message || 'Invalid input' }
    }
    return { success: false, error: 'Invalid JSON body' }
  }
}

// Helper function to validate query params
export function validateQuery<T>(
  url: URL,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params = Object.fromEntries(url.searchParams.entries())
    const data = schema.parse(params)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]
      return { success: false, error: firstIssue?.message || 'Invalid query parameters' }
    }
    return { success: false, error: 'Invalid query parameters' }
  }
}
