-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "processingStartedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "emails_status_processingStartedAt_idx" ON "emails"("status", "processingStartedAt");
