-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "starred" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "emails_starred_idx" ON "emails"("starred");

-- CreateIndex
CREATE INDEX "emails_archived_idx" ON "emails"("archived");
