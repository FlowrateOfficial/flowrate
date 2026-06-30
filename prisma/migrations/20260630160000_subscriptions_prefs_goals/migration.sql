-- AlterTable
ALTER TABLE "users" ADD COLUMN "prefs" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "detected_subscriptions" ADD COLUMN "excluded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "detected_subscriptions" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "detected_subscriptions" ADD COLUMN "displayName" TEXT;
ALTER TABLE "detected_subscriptions" ADD COLUMN "merchantDomain" TEXT;

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target" DECIMAL(12,2),
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "savings_goals_userId_idx" ON "savings_goals"("userId");
CREATE INDEX "savings_goals_spaceId_idx" ON "savings_goals"("spaceId");

ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "financial_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
