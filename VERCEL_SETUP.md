# Vercel Deployment Guide for CashPilot

This guide will help you deploy CashPilot to Vercel in production.

## 📋 Prerequisites

Before deploying, ensure you have accounts set up for:

1. **Vercel** - https://vercel.com
2. **Neon** (PostgreSQL) - https://neon.tech
3. **Clerk** (Authentication) - https://clerk.com
4. **Stripe** (Payments) - https://stripe.com
5. **Xero** (Accounting - optional) - https://developer.xero.com
6. **QuickBooks** (Accounting - optional) - https://developer.intuit.com
7. **Resend** (Email) - https://resend.com
8. **Sentry** (Error Tracking - optional) - https://sentry.io
9. **Upstash** (Redis - optional) - https://upstash.com

---

## 🚀 Deployment Steps

### Step 1: Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository: `scottk-sour/cashpilot`
3. Select the repository and click "Import"

### Step 2: Configure Project Settings

**Framework Preset**: Next.js (auto-detected)
**Build Command**: `npm run build`
**Output Directory**: `.next`
**Install Command**: `npm install`

### Step 3: Set Environment Variables

In Vercel dashboard → Settings → Environment Variables, add all the following:

#### 🌐 **App Configuration** (REQUIRED)

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

> ⚠️ **Critical**: Replace `your-domain` with your actual Vercel domain

---

#### 🔐 **Clerk Authentication** (REQUIRED)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# These can stay as-is:
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**How to get Clerk keys:**
1. Go to https://dashboard.clerk.com
2. Create a new application or select existing
3. Go to API Keys → copy keys
4. Set up webhook:
   - Go to Webhooks → Add Endpoint
   - URL: `https://your-domain.vercel.app/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy webhook secret

---

#### 🗄️ **Database** (REQUIRED)

```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

**How to get Database URL:**
1. Go to https://console.neon.tech
2. Create a new project (or use existing)
3. Go to Connection Details → copy the connection string
4. Make sure it ends with `?sslmode=require`

**After deployment, run migrations:**
```bash
npx prisma migrate deploy
```

---

#### 💳 **Stripe Payments** (REQUIRED)

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx  # Use sk_live_ in production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Use pk_live_ in production
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_GROWTH_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
```

**How to get Stripe keys:**
1. Go to https://dashboard.stripe.com
2. Developers → API Keys → copy keys
3. Products → Create two products:
   - **Growth Plan**: £29/month → copy price ID
   - **Pro Plan**: £79/month → copy price ID
4. Set up webhook:
   - Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy webhook secret

---

#### 📧 **Resend Email** (REQUIRED)

```bash
RESEND_API_KEY=re_xxxxx
```

**How to get Resend key:**
1. Go to https://resend.com/api-keys
2. Create API Key → copy key

---

#### 📊 **Xero Integration** (OPTIONAL)

```bash
XERO_CLIENT_ID=xxxxx
XERO_CLIENT_SECRET=xxxxx
XERO_REDIRECT_URI=https://your-domain.vercel.app/api/xero/callback
```

**How to get Xero credentials:**
1. Go to https://developer.xero.com/app/manage
2. Create new app → OAuth 2.0 app
3. Redirect URI: `https://your-domain.vercel.app/api/xero/callback`
4. Copy Client ID and Client Secret

---

#### 📒 **QuickBooks Integration** (OPTIONAL)

```bash
QUICKBOOKS_CLIENT_ID=xxxxx
QUICKBOOKS_CLIENT_SECRET=xxxxx
QUICKBOOKS_REDIRECT_URI=https://your-domain.vercel.app/api/quickbooks/callback
```

**How to get QuickBooks credentials:**
1. Go to https://developer.intuit.com/app/developer/myapps
2. Create new app
3. Add redirect URI: `https://your-domain.vercel.app/api/quickbooks/callback`
4. Copy Client ID and Client Secret

---

#### 🐛 **Sentry Error Tracking** (OPTIONAL)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx  # Only needed for source maps
```

**How to get Sentry DSN:**
1. Go to https://sentry.io
2. Create new project → Next.js
3. Copy DSN from project settings

---

#### 🚦 **Upstash Redis Rate Limiting** (OPTIONAL)

```bash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

> ℹ️ **Note**: If not set, the app falls back to in-memory rate limiting (works but resets on deployment)

**How to get Upstash credentials:**
1. Go to https://console.upstash.com
2. Create Redis Database → REST API
3. Copy REST URL and REST Token

---

#### 🔒 **Cron Secret** (REQUIRED)

```bash
CRON_SECRET=your-random-secret-here
```

**Generate a secure secret:**
```bash
openssl rand -hex 32
```

Or use: https://generate-secret.vercel.app/32

---

### Step 4: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployed site!

---

## 🔧 Post-Deployment Setup

### 1. Run Database Migrations

In your local terminal:

```bash
# Set DATABASE_URL to your production database
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Verify Cron Jobs

Vercel should automatically set up two cron jobs:
- **Daily Sync**: 6:00 AM UTC - Syncs transactions from Xero/QuickBooks
- **Weekly Digest**: 8:00 AM UTC Monday - Sends email summaries

Verify in: Vercel Dashboard → Your Project → Cron Jobs

### 3. Test Webhooks

**Clerk Webhook:**
```bash
curl -X POST https://your-domain.vercel.app/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test"
```

Should return 400 (signature verification failed) - this is expected and means the endpoint is working.

**Stripe Webhook:**
Use Stripe Dashboard → Webhooks → Send test webhook

### 4. Set Up Custom Domain (Optional)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `cashpilot.app`)
3. Update DNS records as instructed
4. Update environment variable:
   ```bash
   NEXT_PUBLIC_APP_URL=https://cashpilot.app
   ```
5. Update all OAuth redirect URIs in Clerk, Stripe, Xero, QuickBooks

---

## 🎯 Production Checklist

Before launching to real users:

- [ ] All environment variables set correctly
- [ ] Database migrations run successfully
- [ ] Can sign up and sign in with Clerk
- [ ] Demo data generation works
- [ ] Xero/QuickBooks connection works
- [ ] Stripe checkout creates subscription
- [ ] Email alerts are being sent
- [ ] Cron jobs are running
- [ ] Custom domain configured (if applicable)
- [ ] All OAuth redirect URIs updated for production domain
- [ ] Switch Stripe to live keys (not test keys)
- [ ] Sentry is receiving errors (if configured)
- [ ] Rate limiting is working (check Upstash or logs)

---

## 🐛 Troubleshooting

### Build Fails with TypeScript Errors

The build should now pass. If not:
```bash
npm run build
```

Fix any TypeScript errors locally first.

### Database Connection Issues

Make sure:
- `DATABASE_URL` ends with `?sslmode=require`
- Database is accessible from Vercel (Neon is always accessible)
- Migrations are run: `npx prisma migrate deploy`

### Clerk Webhook Not Working

1. Check webhook endpoint is correct: `https://your-domain.vercel.app/api/webhooks/clerk`
2. Verify webhook secret is set correctly
3. Check Vercel logs for errors

### Stripe Webhook Not Working

1. Use Stripe test mode initially
2. Verify webhook events are subscribed
3. Check webhook secret matches
4. View webhook logs in Stripe dashboard

### Emails Not Sending

1. Verify Resend API key is correct
2. Check `NEXT_PUBLIC_APP_URL` is set (used in email templates)
3. In Resend dashboard, verify domain is verified (if using custom domain)

### Rate Limiting Not Working

If Upstash is not configured:
- App falls back to in-memory rate limiting
- Limits reset on each deployment
- For production, configure Upstash Redis

---

## 📊 Monitoring

### View Logs

```bash
vercel logs
```

Or in Vercel Dashboard → Your Project → Logs

### Check Cron Job Execution

Vercel Dashboard → Your Project → Cron Jobs → View execution logs

### Monitor Errors

If Sentry is configured, errors will appear in Sentry dashboard.

---

## 🔄 Redeployment

To redeploy after code changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically redeploy on push to main branch.

---

## 🆘 Support

If you encounter issues:

1. Check Vercel build logs
2. Check Vercel function logs
3. Check Sentry (if configured)
4. Review this guide thoroughly
5. Check environment variables are set correctly

---

## 🎉 You're Done!

Your CashPilot app should now be live and running on Vercel!

Next steps:
1. Test all functionality thoroughly
2. Invite beta users
3. Monitor logs and errors
4. Iterate based on feedback

**CashPilot is now helping UK SMEs never miss payroll!** 🚀
