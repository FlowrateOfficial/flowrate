-- CreateTable
CREATE TABLE "user_usage" (
    "userId" TEXT NOT NULL,
    "syncCountMonth" INTEGER NOT NULL DEFAULT 0,
    "syncMonthKey" TEXT NOT NULL DEFAULT '',
    "lastSyncAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_usage_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
