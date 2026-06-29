-- RenameForeignKey
ALTER TABLE "allowance_jars" RENAME CONSTRAINT "allowance_jars_childProfileId_fkey" TO "allowance_jars_childId_fkey";

-- RenameForeignKey
ALTER TABLE "users" RENAME CONSTRAINT "users_activeSpaceId_fkey" TO "users_spaceId_fkey";

-- RenameIndex
ALTER INDEX "allowance_jars_childProfileId_idx" RENAME TO "allowance_jars_childId_idx";

-- RenameIndex
ALTER INDEX "billing_subscriptions_stripeSubscriptionId_key" RENAME TO "billing_subscriptions_subId_key";

-- RenameIndex
ALTER INDEX "user_billing_stripeCustomerId_key" RENAME TO "user_billing_customerId_key";
