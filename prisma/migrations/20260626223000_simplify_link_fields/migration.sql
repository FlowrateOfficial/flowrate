-- Rename enum
ALTER TYPE "BankLinkProvider" RENAME TO "LinkProvider";

-- Plaid item table → plaid_links with shorter columns
ALTER TABLE "plaid_items" RENAME TO "plaid_links";
ALTER TABLE "plaid_links" RENAME COLUMN "itemId" TO "ref";
ALTER TABLE "plaid_links" RENAME COLUMN "accessToken" TO "token";
ALTER TABLE "plaid_links" RENAME COLUMN "transactionsCursor" TO "syncCursor";

ALTER INDEX "plaid_items_pkey" RENAME TO "plaid_links_pkey";
ALTER INDEX "plaid_items_itemId_key" RENAME TO "plaid_links_ref_key";
ALTER INDEX "plaid_items_userId_idx" RENAME TO "plaid_links_userId_idx";
ALTER INDEX "plaid_items_spaceId_idx" RENAME TO "plaid_links_spaceId_idx";
ALTER TABLE "plaid_links" RENAME CONSTRAINT "plaid_items_userId_fkey" TO "plaid_links_userId_fkey";

-- Account link fields
ALTER TABLE "accounts" RENAME COLUMN "bankLinkProvider" TO "provider";
ALTER TABLE "accounts" RENAME COLUMN "stripeFinancialConnId" TO "stripeId";
ALTER TABLE "accounts" RENAME COLUMN "plaidAccountId" TO "plaidId";
ALTER TABLE "accounts" RENAME COLUMN "plaidItemId" TO "linkId";

ALTER INDEX "accounts_stripeFinancialConnId_key" RENAME TO "accounts_stripeId_key";
ALTER INDEX "accounts_plaidAccountId_key" RENAME TO "accounts_plaidId_key";

-- Transaction link fields
ALTER TABLE "transactions" RENAME COLUMN "plaidTransactionId" TO "plaidId";
ALTER INDEX "transactions_plaidTransactionId_key" RENAME TO "transactions_plaidId_key";
