# Harina Spender

A secure, mobile-first personal finance dashboard. Track expenses and income from an iPhone Shortcut, review cash flow on a dark analytics UI, export CSV, and protect access with TOTP two-factor authentication.

Built with **Next.js 15**, **Supabase** (Auth + Postgres RLS), **Recharts**, and **Cloudflare Workers** via OpenNext — designed as a portfolio-ready open-source project.

## Features

- Email/password auth with **required TOTP 2FA** (Authenticator / 1Password / Authy)
- Row Level Security so users only ever see their own data
- Apple Shortcut ingestion via `POST /api/expenses` + `x-api-key`
- Income vs expenses (`category: "income"`)
- Optional **starting balance** → cash on hand = starting + income − expenses
- Mobile-first dashboard: period filters, category filter, search, charts, activity feed
- CSV export of all transactions
- Cloudflare deploy with GitHub Actions

## Architecture

```text
iPhone Shortcut ──x-api-key──► /api/expenses ──service role──► Postgres (transactions)
Browser ──Supabase Auth + MFA──► Dashboard / Settings ──RLS──► Postgres
GitHub main ──Actions──► OpenNext build ──► Cloudflare Worker
```

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js App Router, TypeScript, Tailwind, shadcn/ui |
| Charts | Recharts (dark mode) |
| Backend / Auth / DB | Supabase |
| Hosting | Cloudflare Workers (`@opennextjs/cloudflare`) |

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/omora14/harinaSpender.git
cd harinaSpender
npm install
```

### 2. Create a Supabase project

1. [Create a project](https://supabase.com/dashboard)
2. Open **SQL Editor** and run, in order:
   - [`supabase/migrations/001_transactions.sql`](supabase/migrations/001_transactions.sql)
   - [`supabase/migrations/002_user_settings.sql`](supabase/migrations/002_user_settings.sql)
3. **Authentication → Providers**: enable Email
4. **Authentication → Multi-Factor** (or MFA): enable **TOTP**
5. **Authentication → URL Configuration** (after you have a deploy URL):
   - Site URL: your Workers URL
   - Redirect URLs: `https://your-worker.workers.dev/**`

### 3. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / legacy `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret / legacy `service_role` (server only) |
| `EXPENSE_API_KEY` | Long random secret for Shortcut (`openssl rand -hex 32`) |
| `INGEST_USER_ID` | Your Auth user UUID (set after first signup) |

> Supabase may label keys **Publishable** / **Secret** instead of anon / service_role. They map 1:1 for this app. Find them under **Project Settings → API Keys**.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, complete 2FA (scan QR), then set `INGEST_USER_ID` in `.env.local` and restart.

LAN testing for Shortcuts:

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

## Apple Shortcut

`POST /api/expenses`

Headers:

- `Content-Type: application/json`
- `x-api-key: <EXPENSE_API_KEY>`

Expense:

```json
{ "amount": 12.5, "category": "Coffee", "note": "Morning latte" }
```

Income (used for cash-on-hand and income charts):

```json
{ "amount": 2000, "category": "income", "note": "Paycheck" }
```

Category matching for income is case-insensitive (`income`, `Income`, etc.).

## Cash on hand

In **Settings**, set an optional **starting balance**. The dashboard shows:

```text
cash on hand = starting balance + Σ income − Σ expenses
```

Adjust starting balance when money arrives outside the Shortcut (gifts, cash, transfers you do not want as “income” entries).

## Security

- Browser clients use the anon/publishable key + user session; **RLS** enforces `auth.uid() = user_id`
- Ingestion uses a shared API key and the **service role** only on the server, inserting under `INGEST_USER_ID`
- Never commit `.env.local` or the service role / API key
- MFA (TOTP) is required after password login

## Deploy to Cloudflare

### One-time: Wrangler / secrets

```bash
npx wrangler login
npm run deploy
```

Set Worker secrets (same five env vars as `.env.local`):

```bash
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put EXPENSE_API_KEY
npx wrangler secret put INGEST_USER_ID
```

### Continuous deploy (GitHub Actions)

On every push to `main`, [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds with OpenNext and deploys.

Add these **GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token with Workers edit permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as local |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as local |
| `EXPENSE_API_KEY` | Same as local |
| `INGEST_USER_ID` | Same as local |

Create an API token: [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) → template **Edit Cloudflare Workers**.

After merge to `main`, Actions deploys to your Worker (default name `harina-spender`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local Next.js dev server |
| `npm run build` | Production Next.js build |
| `npm run preview` | OpenNext build + local Workers preview |
| `npm run deploy` | OpenNext build + Cloudflare deploy |

## Project layout

```text
src/app/dashboard          Mobile-first analytics UI
src/app/settings           Starting balance, CSV, sign out
src/app/mfa                TOTP enroll + verify
src/app/api/expenses       Shortcut ingestion
src/app/api/export/csv     Authenticated CSV download
src/lib/expenses           Income/expense analytics
supabase/migrations        Schema + RLS
.github/workflows          Cloudflare deploy CI
```

## License

MIT — see [LICENSE](LICENSE).
