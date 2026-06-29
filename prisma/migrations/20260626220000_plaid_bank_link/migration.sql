-- CreateEnum
CREATE TYPE "BankLinkProvider" AS ENUM ('STRIPE', 'PLAID');

-- CreateTable
CREATE TABLE "plaid_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "institution" TEXT,
    "visibility" "AccountVisibility" NOT NULL DEFAULT 'PERSONAL',
    "transactionsCursor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plaid_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN "bankLinkProvider" "BankLinkProvider" NOT NULL DEFAULT 'STRIPE';
ALTER TABLE "accounts" ADD COLUMN "plaidAccountId" TEXT;
ALTER TABLE "accounts" ADD COLUMN "plaidItemId" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "plaidTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "plaid_items_itemId_key" ON "plaid_items"("itemId");

-- CreateIndex
CREATE INDEX "plaid_items_userId_idx" ON "plaid_items"("userId");

-- CreateIndex
CREATE INDEX "plaid_items_spaceId_idx" ON "plaid_items"("spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_plaidAccountId_key" ON "accounts"("plaidAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_plaidTransactionId_key" ON "transactions"("plaidTransactionId");

-- AddForeignKey
ALTER TABLE "plaid_items" ADD CONSTRAINT "plaid_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
