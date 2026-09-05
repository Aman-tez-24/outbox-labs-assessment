/*
  Warnings:

  - A unique constraint covering the columns `[userId,idempotencyKey]` on the table `campaigns` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_userId_idempotencyKey_key" ON "campaigns"("userId", "idempotencyKey");
