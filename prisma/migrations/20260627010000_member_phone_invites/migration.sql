-- AlterTable
ALTER TABLE "space_members" ADD COLUMN "phone" TEXT;

-- AlterTable
ALTER TABLE "space_invitations" ADD COLUMN "phone" TEXT;
ALTER TABLE "space_invitations" ADD COLUMN "displayName" TEXT;
ALTER TABLE "space_invitations" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "space_invitations" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "space_invitations_phone_idx" ON "space_invitations"("phone");
