/*
  Warnings:

  - You are about to drop the column `city` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `landingPage` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `referrerUrl` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `Visitor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Visitor" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "ipAddress",
DROP COLUMN "landingPage",
DROP COLUMN "referrerUrl",
DROP COLUMN "userAgent";

-- AlterTable
ALTER TABLE "VisitorSession" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "deviceFingerprint" JSONB,
ADD COLUMN     "hostName" TEXT,
ADD COLUMN     "location" JSONB,
ADD COLUMN     "pageTitle" TEXT;
