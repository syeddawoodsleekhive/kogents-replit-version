/*
  Warnings:

  - A unique constraint covering the columns `[visitorId]` on the table `ChatRoom` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_visitorId_key" ON "ChatRoom"("visitorId");
