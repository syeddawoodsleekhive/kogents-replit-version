/*
  Warnings:

  - You are about to drop the column `identifiedAt` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `isIdentified` on the `Visitor` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Visitor_isIdentified_idx";

-- AlterTable
ALTER TABLE "Visitor" DROP COLUMN "identifiedAt",
DROP COLUMN "isIdentified";
