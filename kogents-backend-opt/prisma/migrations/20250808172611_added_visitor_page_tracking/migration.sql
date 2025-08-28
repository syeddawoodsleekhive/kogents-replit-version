/*
  Warnings:

  - You are about to drop the column `pageCategory` on the `VisitorPageTracking` table. All the data in the column will be lost.
  - You are about to drop the column `pageLanguage` on the `VisitorPageTracking` table. All the data in the column will be lost.
  - You are about to drop the column `pageTemplate` on the `VisitorPageTracking` table. All the data in the column will be lost.
  - You are about to drop the column `pageType` on the `VisitorPageTracking` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "VisitorPageTracking_pageCategory_idx";

-- DropIndex
DROP INDEX "VisitorPageTracking_pageType_idx";

-- AlterTable
ALTER TABLE "VisitorPageTracking" DROP COLUMN "pageCategory",
DROP COLUMN "pageLanguage",
DROP COLUMN "pageTemplate",
DROP COLUMN "pageType",
ADD COLUMN     "navigationPath" JSONB[];
