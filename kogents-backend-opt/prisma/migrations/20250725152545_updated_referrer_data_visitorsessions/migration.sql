/*
  Warnings:

  - You are about to drop the column `referrerUrl` on the `VisitorSession` table. All the data in the column will be lost.
  - You are about to drop the column `utmCampaign` on the `VisitorSession` table. All the data in the column will be lost.
  - You are about to drop the column `utmContent` on the `VisitorSession` table. All the data in the column will be lost.
  - You are about to drop the column `utmMedium` on the `VisitorSession` table. All the data in the column will be lost.
  - You are about to drop the column `utmSource` on the `VisitorSession` table. All the data in the column will be lost.
  - You are about to drop the column `utmTerm` on the `VisitorSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[visitorSessionId]` on the table `ChatRoom` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "VisitorSession" DROP COLUMN "referrerUrl",
DROP COLUMN "utmCampaign",
DROP COLUMN "utmContent",
DROP COLUMN "utmMedium",
DROP COLUMN "utmSource",
DROP COLUMN "utmTerm",
ADD COLUMN     "referrerData" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_visitorSessionId_key" ON "ChatRoom"("visitorSessionId");
