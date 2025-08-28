/*
  Warnings:

  - A unique constraint covering the columns `[visitorId]` on the table `VisitorSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VisitorSession_visitorId_key" ON "VisitorSession"("visitorId");
