/*
  Warnings:

  - You are about to drop the column `assignedBy` on the `ConversationTag` table. All the data in the column will be lost.
  - You are about to drop the column `removedBy` on the `ConversationTag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,createdByVisitor]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ConversationTag" DROP CONSTRAINT "ConversationTag_assignedBy_fkey";

-- DropForeignKey
ALTER TABLE "ConversationTag" DROP CONSTRAINT "ConversationTag_removedBy_fkey";

-- DropIndex
DROP INDEX "ConversationTag_assignedBy_idx";

-- DropIndex
DROP INDEX "ConversationTag_removedBy_idx";

-- AlterTable
ALTER TABLE "ConversationTag" DROP COLUMN "assignedBy",
DROP COLUMN "removedBy",
ADD COLUMN     "assignedByUser" TEXT,
ADD COLUMN     "assignedByVisitor" TEXT,
ADD COLUMN     "removedByUser" TEXT,
ADD COLUMN     "removedByVisitor" TEXT;

-- CreateIndex
CREATE INDEX "ConversationTag_assignedByUser_idx" ON "ConversationTag"("assignedByUser");

-- CreateIndex
CREATE INDEX "ConversationTag_assignedByVisitor_idx" ON "ConversationTag"("assignedByVisitor");

-- CreateIndex
CREATE INDEX "ConversationTag_removedByUser_idx" ON "ConversationTag"("removedByUser");

-- CreateIndex
CREATE INDEX "ConversationTag_removedByVisitor_idx" ON "ConversationTag"("removedByVisitor");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_createdByVisitor_key" ON "Tag"("name", "createdByVisitor");

-- AddForeignKey
ALTER TABLE "ConversationTag" ADD CONSTRAINT "ConversationTag_assignedByUser_fkey" FOREIGN KEY ("assignedByUser") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTag" ADD CONSTRAINT "ConversationTag_assignedByVisitor_fkey" FOREIGN KEY ("assignedByVisitor") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTag" ADD CONSTRAINT "ConversationTag_removedByUser_fkey" FOREIGN KEY ("removedByUser") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTag" ADD CONSTRAINT "ConversationTag_removedByVisitor_fkey" FOREIGN KEY ("removedByVisitor") REFERENCES "VisitorSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
