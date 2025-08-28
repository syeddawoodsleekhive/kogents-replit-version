/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `Trigger` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Trigger_sortOrder_idx";

-- AlterTable
ALTER TABLE "Trigger" DROP COLUMN "sortOrder",
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Trigger_priority_idx" ON "Trigger"("priority");
