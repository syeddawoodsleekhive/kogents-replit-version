/*
  Warnings:

  - You are about to drop the column `pageReferrer` on the `VisitorPageTracking` table. All the data in the column will be lost.
  - You are about to drop the column `pageReferrerDomain` on the `VisitorPageTracking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VisitorPageTracking" DROP COLUMN "pageReferrer",
DROP COLUMN "pageReferrerDomain",
ADD COLUMN     "previousPage" TEXT,
ADD COLUMN     "previousPageDomain" TEXT;
