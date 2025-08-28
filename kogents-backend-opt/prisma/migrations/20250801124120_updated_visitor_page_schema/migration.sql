/*
  Warnings:

  - You are about to drop the column `pageTitle` on the `VisitorSession` table. All the data in the column will be lost.
  - You are about to drop the column `pageUrl` on the `VisitorSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VisitorSession" DROP COLUMN "pageTitle",
DROP COLUMN "pageUrl",
ADD COLUMN     "pageDetails" JSONB;
