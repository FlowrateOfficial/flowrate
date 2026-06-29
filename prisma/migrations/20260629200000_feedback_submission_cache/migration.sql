-- AlterTable
ALTER TABLE "feedback_submissions" ADD COLUMN "issueState" TEXT NOT NULL DEFAULT 'open';
ALTER TABLE "feedback_submissions" ADD COLUMN "replyCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "feedback_submissions" ADD COLUMN "labelsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "feedback_submissions" ADD COLUMN "syncedAt" TIMESTAMP(3);
