-- User
ALTER TABLE "users" RENAME COLUMN "activeSpaceId" TO "spaceId";
ALTER TABLE "users" RENAME COLUMN "phoneVerifiedAt" TO "phoneVerified";
ALTER TABLE "users" RENAME COLUMN "avatarUrl" TO "avatar";
ALTER TABLE "users" RENAME COLUMN "dateOfBirth" TO "birthday";

-- UserBilling
ALTER TABLE "user_billing" RENAME COLUMN "stripeCustomerId" TO "customerId";

-- BillingSubscription
ALTER TYPE "BillingSubscriptionStatus" RENAME TO "SubStatus";
ALTER TABLE "billing_subscriptions" RENAME COLUMN "stripeSubscriptionId" TO "subId";
ALTER TABLE "billing_subscriptions" RENAME COLUMN "stripePriceId" TO "priceId";
ALTER TABLE "billing_subscriptions" RENAME COLUMN "stripeProductId" TO "productId";
ALTER TABLE "billing_subscriptions" RENAME COLUMN "currentPeriodStart" TO "periodStart";
ALTER TABLE "billing_subscriptions" RENAME COLUMN "currentPeriodEnd" TO "periodEnd";
ALTER TABLE "billing_subscriptions" RENAME COLUMN "cancelAtPeriodEnd" TO "cancelAtEnd";

-- SpaceMember
ALTER TABLE "space_members" RENAME COLUMN "displayName" TO "name";
ALTER TABLE "space_members" RENAME COLUMN "dateOfBirth" TO "birthday";

-- SpaceInvitation
ALTER TABLE "space_invitations" RENAME COLUMN "displayName" TO "name";
ALTER TABLE "space_invitations" RENAME COLUMN "phoneVerifiedAt" TO "phoneVerified";

-- ChildProfile
ALTER TABLE "child_profiles" RENAME COLUMN "allowanceAmount" TO "allowance";
ALTER TABLE "child_profiles" RENAME COLUMN "allowanceFrequency" TO "frequency";
ALTER TABLE "child_profiles" RENAME COLUMN "spendingLimits" TO "limits";

-- AllowanceJar
ALTER TABLE "allowance_jars" RENAME COLUMN "childProfileId" TO "childId";
ALTER TABLE "allowance_jars" RENAME COLUMN "targetAmount" TO "target";

-- Account
ALTER TABLE "accounts" RENAME COLUMN "lastSynced" TO "syncedAt";

-- DetectedSubscription
ALTER TABLE "detected_subscriptions" RENAME COLUMN "lastCharged" TO "lastCharge";
ALTER TABLE "detected_subscriptions" RENAME COLUMN "priceAlert" TO "alert";

-- SplitRule
ALTER TABLE "split_rules" RENAME COLUMN "ruleType" TO "mode";
