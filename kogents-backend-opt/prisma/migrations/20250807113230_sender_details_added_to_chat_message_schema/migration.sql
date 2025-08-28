/*
  Warnings:

  - You are about to drop the column `senderId` on the `ChatMessage` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ChatMessage_senderId_idx";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "senderId",
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "visitorId" TEXT;

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_visitorId_idx" ON "ChatMessage"("visitorId");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
