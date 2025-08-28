/*
  Warnings:

  - You are about to drop the column `previousPage` on the `VisitorPageTracking` table. All the data in the column will be lost.
  - You are about to drop the column `previousPageDomain` on the `VisitorPageTracking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VisitorPageTracking" DROP COLUMN "previousPage",
DROP COLUMN "previousPageDomain";
