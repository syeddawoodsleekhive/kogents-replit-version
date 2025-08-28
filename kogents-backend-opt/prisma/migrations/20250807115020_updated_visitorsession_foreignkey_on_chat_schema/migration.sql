/*
  Warnings:

  - You are about to drop the column `visitorId` on the `ChatMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_visitorId_fkey";

-- DropIndex
DROP INDEX "ChatMessage_visitorId_idx";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "visitorId",
ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisitorSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
