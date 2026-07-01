<p align="center">
  <img src="./public/flowrate_logo.png" alt="FlowRate" width="88" height="88" />
</p>

<h1 align="center">FlowRate</h1>

<p align="center">
  <strong>Your financial operating system.</strong><br />
  One login. Independent, Household, Family, and Company money — in separate spaces, same calm dashboard.
</p>

<p align="center">
  <a href="https://nuxt.com"><img src="https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&labelColor=020420" alt="Nuxt 4" /></a>
  <a href="https://ui.nuxt.com"><img src="https://img.shields.io/badge/Nuxt%20UI-4-00DC82?logo=nuxt&labelColor=020420" alt="Nuxt UI" /></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-Neon-2D3748?logo=prisma" alt="Prisma + Neon" />
</p>

---

## What FlowRate does today

FlowRate is a full-stack personal and business finance app built with **Nuxt 4**. Right now it ships:

| Area | What you get |
|------|----------------|
| **Financial Spaces** | Independent, Household, Family, and Company — switch context without juggling logins |
| **Bank linking** | **Plaid** (EU) and **Stripe Financial Connections** (US test/live) |
| **Money view** | Accounts, transactions, budgets, analytics, burn rate & runway (company) |
| **Subscriptions** | SaaS Shield — detect recurring spend and duplicates |
| **Family** | Member invites, allowances, supervised teen dashboard |
| **Billing** | Stripe Checkout + Customer Portal (Pro plans) |
| **Feedback** | In-app bug reports & feature requests → private GitHub issues (markdown, images, thread) |
| **i18n** | English (US/UK) and French |

Auth runs on **Neon Auth** (Better Auth). Data lives in **PostgreSQL** via **Prisma**. Production deploys target **Vercel**.

---

## Branches

| Branch | Role | Deploy |
|--------|------|--------|
| **`master`** | Production — stable, deployable | Vercel production |
| **`feature`** | Development — day-to-day work | Local / preview deploys |

```text
master   ───●────────●──────►  production (Vercel)
              \
feature  ──────●──●──●──►     local dev, PRs → master
```

**Workflow**

1. Clone and work on `feature` (see below).
2. Open PRs from `feature` → `master` when ready.
3. Merge to `master` to ship production.

> **Note:** Feedback media lives on a separate orphan Git branch (`issues_medias`). It is never merged into app code. Exclude it from fetch: `sh scripts/git-ignore-feedback-media-branch.sh`.

---

## Quick start (clone)

Clone **only** the branch you need — skips the large feedback-media branch:

```bash
git clone --single-branch --branch master git@github.com:FlowrateOfficial/flowrate.git
cd flowrate
git checkout -b feature   # optional: create local dev branch tracking your workflow
```

HTTPS:

```bash
git clone --single-branch --branch master https://github.com/FlowrateOfficial/flowrate.git
```

For daily development, switch to `feature` after clone:

```bash
git fetch origin feature
git checkout feature
```

---

## Development (`feature` branch)

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- [Neon](https://neon.tech) project (database + auth)
- [Stripe](https://stripe.com) account (test mode for local)
- Optional: [Plaid](https://plaid.com) sandbox, [GitHub PAT](https://github.com/settings/tokens) for in-app feedback

### Setup

```bash
pnpm install
cp .env.example .env
# Fill in DATABASE_URL, NUXT_NEON_AUTH_URL, Stripe test keys, etc.
pnpm prisma generate
pnpm dev
```

App runs at **http://localhost:3000**.

### Common dev commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Nuxt dev server |
| `pnpm dev:all` | Dev server + Stripe webhook listener |
| `pnpm stripe:listen` | Forward Stripe webhooks to localhost |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:migrate` | Apply migrations |
| `sh scripts/git-ignore-feedback-media-branch.sh` | Skip `issues_medias` on fetch |

### Dev environment tips

- Use **Stripe test keys** (`sk_test_…` / `pk_test_…`) and run `pnpm stripe:listen` for webhooks.
- Set `APP_URL=http://localhost:3000`.
- Plaid sandbox works on localhost; live US bank linking needs HTTPS (production).
- Feedback (`GITHUB_TOKEN` + `GITHUB_FEEDBACK_REPO`) is optional — without it, the feedback page shows as disabled.

---

## Production (`master` branch)

Production runs on **Vercel** (or any Node host that supports Nuxt SSR).

### Deploy checklist

1. Merge tested work into **`master`**.
2. Set production env vars in Vercel (see [`.env.example`](./.env.example)):
   - `APP_URL` → your HTTPS domain
   - `NUXT_SESSION_PASSWORD` → strong random secret (32+ chars)
   - `DATABASE_URL`, `NUXT_NEON_AUTH_URL`, Neon auth domains
   - **Live** Stripe keys + live webhook endpoint → `/api/stripe/webhook`
   - Plaid / GitHub feedback vars if enabled
3. Vercel build: `pnpm build` (runs `prisma generate` + `nuxt build`).
4. Run migrations against production DB: `pnpm exec prisma migrate deploy`.

### Prod vs dev at a glance

| | **Development** (`feature`) | **Production** (`master`) |
|--|---------------------------|-----------------------------|
| Branch | `feature` | `master` |
| URL | `http://localhost:3000` | `https://your-domain.com` |
| Stripe | Test mode + CLI webhooks | Live keys + dashboard webhook |
| Database | Neon dev branch | Neon production branch |
| Auth domains | localhost + preview URLs | Production + custom domain |
| Builds | Local `pnpm dev` | Vercel on push to `master` |

---

## Project structure

```text
app/           Nuxt UI, pages, components, stores
server/        API routes, Prisma services, Stripe/Plaid/GitHub libs
prisma/        Schema and migrations
shared/        Types and constants used by app + server
locales/       en, en-GB, fr copy
docs/          Operational notes (e.g. feedback media branch)
```

---

## CI & required status checks

Every PR into **`feature`** or **`master`** runs [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build` (with placeholder env — no secrets in GitHub Actions)

GitHub Actions reports this as a **check** named **`CI / Build & verify`** on the PR (see [About status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)).

### One-time setup (maintainer)

After the workflow has run at least once on the repo:

1. **GitHub** → **FlowrateOfficial/flowrate** → **Settings** → **Branches**
2. **Add branch protection rule** (or edit existing) for **`feature`**
3. Enable **Require status checks to pass before merging**
4. Search and tick **`CI / Build & verify`**
5. Enable **Require branches to be up to date before merging** (recommended)
6. Save

Repeat for **`master`** if you want the same gate before production merges.

Until the check is required, PRs can merge even when CI fails — the check still appears on the **Checks** tab so the team can see pass/fail.

### If CI fails on your PR

Open the PR → **Checks** tab → click the failed run → read the step log (`Lint`, `Typecheck`, `Test`, or `Build`). Fix locally, push again; the check re-runs automatically.

---

## Environment variables

All variables are documented in **[`.env.example`](./.env.example)** — copy to `.env` and fill in values. Never commit `.env`.

Minimum for local dashboard:

- `DATABASE_URL`, `NUXT_NEON_AUTH_URL`, `NUXT_SESSION_PASSWORD`, `APP_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (with `stripe listen`)

---

## License

**Proprietary — all rights reserved.** See [LICENSE](./LICENSE).

Use, copying, modification, and commercial exploitation are not permitted without
written authorization from Mathieu-AI. Only the Maintainer (or persons explicitly
authorized in writing) may merge to `master` and approve production deployments.
