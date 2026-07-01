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
| **Bank linking** | **Plaid** (EU, sandbox only for now, need prod access) and **Stripe Financial Connections** (US test/live) |
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
| **`master`** | Production — stable, deployable | [flowrate-app.vercel.app](https://flowrate-app.vercel.app) |
| **`feature`** | Development — day-to-day work | [flowrate-dev.vercel.app](https://flowrate-dev.vercel.app) + local |

```text
master   ───●────────●──────►  production → flowrate-app.vercel.app  (.env)
              \
feature  ──────●──●──●──►     preview    → flowrate-dev.vercel.app  (.env.dev)
                              local      → localhost:3000             (.env.dev)
```

**Workflow**

1. Branch off **`feature`** — never delete `feature`; it is our long-lived integration branch.
2. Name your branch with a `feature-…` prefix (see below).
3. Open a PR **into `feature`** — not into `master`.
4. After review and a green preview on [flowrate-dev.vercel.app](https://flowrate-dev.vercel.app), open a PR **`feature` → `master`** to ship production.

### Branch naming

Use a `feature-…` prefix so work is easy to scan in GitHub and Vercel:

```bash
# ✓
git checkout feature
git pull
git checkout -b feature-space-switch
git checkout -b feature-subscriptions-cache

# ✗
git checkout -b fix-space-switch
git checkout -b my-branch
```

> **Note:** Feedback media lives on a separate orphan Git branch (`issues_medias`). It is never merged into app code. Exclude it from fetch: `sh scripts/git-ignore-feedback-media-branch.sh`.

---

## Quick start (clone)

Clone **only** the branch you need — skips the large feedback-media branch:

```bash
git clone --single-branch --branch master git@github.com:FlowrateOfficial/flowrate.git
cd flowrate
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
cp .env.example .env.dev
# Fill in DATABASE_URL, NUXT_NEON_AUTH_URL, Stripe test keys, etc.
pnpm prisma generate
pnpm dev
```

App runs at **<http://localhost:3000>**.

### Common dev commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Nuxt dev server (loads `.env.dev`) |
| `pnpm dev:prod` | Dev server with production env (loads `.env`) |
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

## Deployments (Vercel)

Vercel is already wired for this repo — domains, branch mapping, and env scopes are set. You do not need to change project settings.

| Environment | Git branch | URL | Env |
|-------------|------------|-----|-----|
| **Preview** | `feature` | [flowrate-dev.vercel.app](https://flowrate-dev.vercel.app) | `.env.dev` |
| **Production** | `master` | [flowrate-app.vercel.app](https://flowrate-app.vercel.app) | `.env` |

**How we ship**

- Merge your PR into **`feature`** → Vercel deploys preview automatically.
- When the team is ready for prod, merge **`feature` → `master`** → production deploys.
- **`feature` must stay** — do not delete it after a merge; it is the base we branch from and PR back into.

**Env files (local only)** — ask a teammate or the maintainer for a filled `.env.dev` if you are new. Production secrets live in Vercel (Production scope); preview secrets are already in Vercel (Preview scope). See [`.env.example`](./.env.example) for the full variable list.

**Production migrations** — after a `master` deploy that includes schema changes, run against the prod DB:

```bash
pnpm exec prisma migrate deploy
```

(Use production `DATABASE_URL` — only when explicitly asked to run migrations.)

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

Documented in **[`.env.example`](./.env.example)**. For local work, copy it to `.env.dev` or get a filled file from the team.

| File | When |
|------|------|
| `.env.dev` | `pnpm dev`, `db:*`, `test` — same values as preview |
| `.env` | `pnpm build` / `preview` locally — same shape as production |

Do not commit `.env` or `.env.dev`.

---

## License

**Proprietary — all rights reserved.** See [LICENSE](./LICENSE).

Use, copying, modification, and commercial exploitation are not permitted without
written authorization from Mathieu-AI. Only the Maintainer (or persons explicitly
authorized in writing) may merge to `master` and approve production deployments.
