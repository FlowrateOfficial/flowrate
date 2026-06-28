-- Billing profile + subscription tables; migrate stripeCustomerId off users.

-- CreateEnum
CREATE TYPE "BillingSubscriptionStatus" AS ENUM (
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
  'PAUSED'
);

-- CreateTable
CREATE TABLE "user_billing" (
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_billing_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "billing_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "stripeProductId" TEXT,
    "status" "BillingSubscriptionStatus" NOT NULL,
    "planKey" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Migrate existing Stripe customer IDs
INSERT INTO "user_billing" ("userId", "stripeCustomerId", "createdAt", "updatedAt")
SELECT "id", "stripeCustomerId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users"
WHERE "stripeCustomerId" IS NOT NULL;

-- DropIndex
DROP INDEX "users_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "stripeCustomerId";

-- CreateIndex
CREATE UNIQUE INDEX "user_billing_stripeCustomerId_key" ON "user_billing"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_subscriptions_userId_key" ON "billing_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_subscriptions_stripeSubscriptionId_key" ON "billing_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "billing_subscriptions_status_idx" ON "billing_subscriptions"("status");

-- AddForeignKey
ALTER TABLE "user_billing" ADD CONSTRAINT "user_billing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_billing"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
