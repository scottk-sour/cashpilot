// Jest setup file
// Add any global test setup here

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock'
process.env.CLERK_SECRET_KEY = 'sk_test_mock'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.CRON_SECRET = 'test_cron_secret'
