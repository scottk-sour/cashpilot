# CashPilot

**Never Miss Payroll Again** - 13-week cash flow forecasting for UK SMEs.

CashPilot connects to your accounting software (Xero/QuickBooks), analyzes your transaction history, and generates accurate cash flow forecasts so you can see problems before they happen.

## Features

- **13-Week Forecast** - See exactly where your cash will be three months from now
- **Early Warning Alerts** - Get notified before cash runs low
- **Xero & QuickBooks** - Automatic transaction syncing
- **Scenario Planning** - Model "what-if" scenarios (Growth plan)
- **CSV Export** - Download forecasts for Excel (Growth plan)
- **Email Alerts** - Weekly digest and critical cash alerts

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Next.js API Routes + tRPC |
| Database | Neon Postgres + Prisma |
| Auth | Clerk |
| Payments | Stripe |
| Email | Resend |
| Monitoring | Sentry |

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/cashpilot.git
cd cashpilot
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your API keys (see [Configuration](#configuration) below).

### 3. Set Up Database

Create a free Postgres database at [neon.tech](https://neon.tech), then:

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Try Demo Mode

Don't have Xero/QuickBooks? Sign up and click "Load Demo Data" to see the full dashboard with realistic sample transactions.

## Configuration

### Required Services

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Clerk | Authentication | [clerk.com](https://clerk.com) |
| Neon | PostgreSQL database | [neon.tech](https://neon.tech) |
| Xero | Accounting integration | [developer.xero.com](https://developer.xero.com) |
| Stripe | Payments | [stripe.com](https://stripe.com) |
| Resend | Email | [resend.com](https://resend.com) |
| Sentry | Error tracking | [sentry.io](https://sentry.io) |

### Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://...

# Xero
XERO_CLIENT_ID=...
XERO_CLIENT_SECRET=...
XERO_REDIRECT_URI=http://localhost:3000/api/xero/callback

# QuickBooks (optional)
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_GROWTH_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# Resend
RESEND_API_KEY=re_...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Cron (for scheduled jobs)
CRON_SECRET=<generate with: openssl rand -hex 32>
```

### Setting Up Xero

1. Go to [developer.xero.com](https://developer.xero.com)
2. Create a new app (Web App)
3. Set redirect URI to `http://localhost:3000/api/xero/callback`
4. Copy Client ID and Client Secret to `.env.local`
5. Enable these scopes: `openid profile email accounting.transactions.read offline_access`

### Setting Up Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Copy API keys to `.env.local`
3. Create two products/prices:
   - Growth: £29/month
   - Pro: £79/month
4. Copy price IDs to `.env.local`
5. Set up webhook endpoint: `/api/webhooks/stripe`
6. Enable these webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### Setting Up Clerk Webhooks

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourapp.com/api/webhooks/clerk`
3. Enable these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

## Project Structure

```
cashpilot/
├── app/
│   ├── (auth)/           # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/      # Protected dashboard pages
│   ├── (marketing)/      # Public pages (landing, pricing)
│   └── api/              # API routes
│       ├── cron/         # Scheduled jobs
│       ├── demo/         # Demo data generation
│       ├── export/       # CSV exports
│       ├── quickbooks/   # QB OAuth
│       ├── stripe/       # Payments
│       ├── trpc/         # tRPC endpoint
│       ├── webhooks/     # Clerk & Stripe webhooks
│       └── xero/         # Xero OAuth
├── components/
│   ├── dashboard/        # Dashboard components
│   ├── marketing/        # Marketing components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── email/            # Email templates & sending
│   ├── trpc/             # tRPC router
│   ├── db.ts             # Prisma client
│   ├── forecasting.ts    # Forecast algorithm
│   ├── quickbooks*.ts    # QuickBooks integration
│   ├── stripe.ts         # Stripe client
│   └── xero*.ts          # Xero integration
└── prisma/
    └── schema.prisma     # Database schema
```

## Deployment

### Vercel (Recommended)

**📖 [Complete Vercel Deployment Guide →](./VERCEL_SETUP.md)**

The comprehensive guide includes:
- ✅ Step-by-step deployment instructions
- ✅ All required environment variables with descriptions
- ✅ How to get API keys for all services
- ✅ Webhook setup for Clerk and Stripe
- ✅ Production checklist
- ✅ Troubleshooting tips

**Quick Steps:**
1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all environment variables (see guide)
4. Deploy

The `vercel.json` includes cron job configuration:
- Daily sync at 6am UTC
- Weekly digest emails on Mondays at 8am UTC

### Database Migration (Production)

```bash
npx prisma migrate deploy
```

## API Endpoints

### Public
- `GET /` - Landing page
- `GET /pricing` - Pricing page
- `GET /sign-in` - Sign in
- `GET /sign-up` - Sign up

### Protected (requires auth)
- `GET /dashboard` - Main dashboard
- `GET /settings` - User settings
- `POST /api/demo` - Generate/clear demo data
- `GET /api/export/forecast` - Export forecast CSV
- `GET /api/export/transactions` - Export transactions CSV

### OAuth
- `GET /api/xero/connect` - Start Xero OAuth
- `GET /api/xero/callback` - Xero OAuth callback
- `GET /api/quickbooks/connect` - Start QB OAuth
- `GET /api/quickbooks/callback` - QB OAuth callback

### Webhooks
- `POST /api/webhooks/clerk` - Clerk user sync
- `POST /api/webhooks/stripe` - Stripe payment events

### Cron (requires CRON_SECRET)
- `GET /api/cron/sync` - Daily transaction sync
- `GET /api/cron/digest` - Weekly email digest

## Development

### Running Tests

```bash
npm run test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Database Studio

```bash
npx prisma studio
```

## License

MIT

## Support

For issues and feature requests, please use GitHub Issues.
