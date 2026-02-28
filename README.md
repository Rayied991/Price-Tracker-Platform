# Smart Product Price Tracker

Track product prices across e-commerce sites and get instant alerts on price drops. Built with Next.js, Firecrawl, Supabase, and Resend.

## 🎯 Features

- 🔍 **Track Any Product** - Works with Amazon, Zara, Walmart, and more
- 🔗 **Short URL Support** - Automatically resolves short URLs (a.co, amzn.to, etc.)
- 📊 **Price History Charts** - Interactive graphs showing price trends over time
- 🔐 **Google Authentication** - Secure sign-in with Google OAuth
- 🔄 **Automated Daily Checks** - Scheduled cron jobs check prices automatically
- 📧 **Email Alerts** - Get notified when prices drop via Resend

## 🛠️ Tech Stack

- **Next.js 16** - React framework with App Router
- **Firecrawl** - Web data extraction API
  - Handles JavaScript rendering
  - Rotating proxies & anti-bot bypass
  - Structured data extraction with AI
  - Works across different e-commerce sites
- **Supabase** - Backend platform
  - PostgreSQL Database
  - Google Authentication
  - Row Level Security (RLS)
  - pg_cron for scheduled jobs
- **Resend** - Transactional emails
- **shadcn/ui** - UI component library
- **Recharts** - Interactive charts
- **Tailwind CSS** - Styling

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A [Supabase](https://supabase.com) account
- A [Firecrawl](https://firecrawl.dev) account
- A [Resend](https://resend.com) account
- Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/Rayied991/Price-Tracker-Platform.git
cd Price-Tracker-Platform
npm install
```

### 2. Supabase Setup

#### Create Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Wait for the project to be ready

#### Run Database Migrations

Go to SQL Editor in your Supabase dashboard and run these migrations:

**Migration 1: Database Schema** (`supabase/migrations/001_schema.sql`)

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products table
create table products (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  name text not null,
  current_price numeric(10,2) not null,
  currency text not null default 'USD',
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Price history table
create table price_history (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade not null,
  price numeric(10,2) not null,
  currency text not null,
  checked_at timestamp with time zone default now()
);

-- Add unique constraint for upsert functionality
ALTER TABLE products
ADD CONSTRAINT products_user_url_unique UNIQUE (user_id, url);

-- Enable Row Level Security
alter table products enable row level security;
alter table price_history enable row level security;

-- Policies for products
create policy "Users can view their own products"
  on products for select
  using (auth.uid() = user_id);

create policy "Users can insert their own products"
  on products for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own products"
  on products for update
  using (auth.uid() = user_id);

create policy "Users can delete their own products"
  on products for delete
  using (auth.uid() = user_id);

-- Policies for price_history
create policy "Users can view price history for their products"
  on price_history for select
  using (
    exists (
      select 1 from products
      where products.id = price_history.product_id
      and products.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index products_user_id_idx on products(user_id);
create index price_history_product_id_idx on price_history(product_id);
create index price_history_checked_at_idx on price_history(checked_at desc);
```

**Migration 2: Setup Cron Job** (`supabase/migrations/002_setup_cron.sql`)

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to trigger price check via HTTP
CREATE OR REPLACE FUNCTION trigger_price_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-app-url.vercel.app/api/cron/check-prices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'
    )
  );
END;
$$;

-- Schedule cron job to run daily at 9 AM UTC
SELECT cron.schedule(
  'daily-price-check',
  '0 9 * * *',
  'SELECT trigger_price_check();'
);
```

> ⚠️ Update the URL and Authorization Bearer token in the function after deployment.

#### Enable Google Authentication

1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Google** provider
3. Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/):
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

#### Get API Credentials

1. Go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public** key
4. Copy your **service_role** key (keep this secret!)

### 3. Firecrawl Setup

1. Sign up at [firecrawl.dev](https://firecrawl.dev)
2. Go to dashboard and get your API key

### 4. Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. For **testing**: use `onboarding@resend.dev` as the sender — emails will only deliver to your Resend account's registered email address
4. For **production**: verify your own domain at resend.com/domains and use `noreply@yourdomain.com`

> ⚠️ **Important:** With `onboarding@resend.dev`, Resend only delivers to the email you signed up with. To send alerts to real users, you must verify a custom domain.

### 5. Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Firecrawl
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev   # replace with your verified domain in production

# Cron Job Security
CRON_SECRET=your_generated_cron_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Generate CRON_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel for automatic deployments, or use the CLI:

   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Add Environment Variables in Vercel** — add all variables from `.env.local`:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (never expose publicly)
   - `FIRECRAWL_API_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)

3. **Update Supabase Cron Function** with your production URL:

   ```sql
   CREATE OR REPLACE FUNCTION trigger_price_check()
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     PERFORM net.http_post(
       url := 'https://your-actual-vercel-url.vercel.app/api/cron/check-prices',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer your_actual_cron_secret'
       )
     );
   END;
   $$;
   ```

4. **Update Google OAuth Redirect URI** — add your Vercel domain to Google Cloud Console authorized redirect URIs.

## 🔍 How It Works

### User Flow

1. **User adds product** — paste any e-commerce URL (including short URLs like `a.co/...`)
2. **URL resolved** — short URLs are automatically expanded to their full form before scraping
3. **Firecrawl scrapes** — extracts product name, price, currency, and image
4. **Data stored** — product saved to Supabase with the full resolved URL
5. **View tracking** — see current price and interactive price history chart

### Automated Price Checking

1. **Supabase pg_cron** runs daily at 9 AM UTC
2. **Triggers API endpoint** — makes a secure POST request to `/api/cron/check-prices`
3. **Firecrawl re-scrapes all products** and compares prices
4. **Updates database** — saves new prices and adds to history if changed
5. **Sends email alerts** via Resend when a price drops

### Short URL Handling

Amazon and other retailers use short URLs (`a.co`, `amzn.to`) that redirect to the full product page. Firecrawl cannot reliably scrape these redirects, so the app resolves them first:

```js
async function resolveUrl(url) {
  const response = await fetch(url, { method: "HEAD", redirect: "follow" });
  return response.url || url;
}
```

The resolved full URL is saved to the database so cron jobs always scrape the stable, direct product URL.

### Why Firecrawl?

Firecrawl solves the hard problems of web scraping:

- ✅ **JavaScript Rendering** — handles dynamic content loaded via JS
- ✅ **Anti-bot Bypass** — built-in mechanisms to avoid detection
- ✅ **Rotating Proxies** — prevents IP blocking
- ✅ **AI-Powered Extraction** — uses prompts to extract structured data
- ✅ **Multi-site Support** — same code works across different e-commerce platforms

## 📁 Project Structure

```
dealdrop/
├── app/
│   ├── page.js                         # Landing page with product input
│   ├── actions.js                      # Server actions for DB operations
│   ├── auth/
│   │   └── callback/
│   │       └── route.js                # OAuth callback handler
│   └── api/
│       └── cron/
│           └── check-prices/
│               └── route.js            # Cron endpoint for price checks
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── AddProductForm.js               # Product URL input with auth modal
│   ├── ProductCard.js                  # Product display with chart toggle
│   ├── PriceChart.js                   # Recharts price history
│   └── AuthModal.js                    # Google sign-in modal
├── lib/
│   ├── firecrawl.js                    # Firecrawl API + short URL resolver
│   ├── email.js                        # Resend email templates
│   └── utils.js                        # Utility functions
├── utils/
│   └── supabase/
│       ├── client.js                   # Browser Supabase client
│       ├── server.js                   # Server Supabase client
│       └── middleware.js               # Session refresh middleware
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql              # Database tables & RLS
│       └── 002_setup_cron.sql          # Cron job setup
├── proxy.ts                            # Next.js proxy
└── .env.local                          # Environment variables
```

## 🧪 Testing

### Test the Cron Endpoint

```bash
# Local
curl -X POST http://localhost:3000/api/cron/check-prices \
  -H "Authorization: Bearer your_cron_secret"

# Production
curl -X POST https://your-app.vercel.app/api/cron/check-prices \
  -H "Authorization: Bearer your_cron_secret"
```

> ⚠️ **Common mistake:** Do not double the `https://` in the URL. Use `https://your-app.vercel.app/...`, not `https://https://your-app.vercel.app/...`

### Verify Cron Job

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- View run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Test Email Alerts Locally

Since prices rarely change between test runs, temporarily inflate the old price to trigger the alert path:

```js
// In route.js — temporary test only, remove after confirming emails work
const oldPrice = parseFloat(product.current_price) + 50;
```

Then run the curl command and check your terminal for `Email result: {"success":true,...}`.

## 🎨 Customization

### Change Cron Schedule

Edit the cron expression in `002_setup_cron.sql`:

```sql
'0 9 * * *'      -- Daily at 9 AM UTC
'0 */6 * * *'    -- Every 6 hours
'0 9,21 * * *'   -- Daily at 9 AM and 9 PM
'0 9 * * 1'      -- Every Monday at 9 AM
```

### Email Template

Customize the HTML template in `lib/email.js` to change styling or content.

### Extract More Product Data

Update the Firecrawl prompt in `lib/firecrawl.js`:

```js
prompt: "Extract product name, price, currency, image URL, brand, rating, and availability";
```

## 🐛 Troubleshooting

### `curl: (6) Could not resolve host: https`

You have a duplicate `https://` in your curl command. Use:
```bash
curl -X POST https://your-app.vercel.app/api/cron/check-prices ...
#                 ↑ only one https://
```

### `Failed to scrape product: No data extracted from URL`

Amazon short URLs (`a.co/...`) are not scraped directly — they need to be resolved first. Make sure `resolveUrl()` is called in `firecrawl.js` before passing the URL to Firecrawl. The app resolves and saves the full URL on first add so cron jobs work reliably.

### Email alerts not sending to Gmail

Using `onboarding@resend.dev` as the sender only allows delivery to the email registered on your Resend account. To send to any Gmail address, verify a custom domain at [resend.com/domains](https://resend.com/domains) and update `RESEND_FROM_EMAIL` in your environment variables.

### `priceChanges: 0` in cron results

The scraped price matches what's already in the database — no change occurred. This is normal. Use the `+50` test trick described above to verify the email pipeline end-to-end.

### Products not found in cron job

Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not just the anon key). The service role key bypasses RLS and allows the cron job to access all users' products.

### Cron job not running

1. Check the job exists: `SELECT * FROM cron.job;`
2. Verify the URL and Authorization header in the cron SQL function are correct
3. Check Supabase logs for HTTP errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request