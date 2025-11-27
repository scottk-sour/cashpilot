import { router } from '../trpc'
import { forecastRouter } from './forecast'
import { transactionsRouter } from './transactions'

export const appRouter = router({
  forecast: forecastRouter,
  transactions: transactionsRouter,
})

export type AppRouter = typeof appRouter
