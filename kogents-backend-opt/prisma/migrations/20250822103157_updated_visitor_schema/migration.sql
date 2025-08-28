/*
  Warnings:

  - You are about to drop the column `metadata` on the `Visitor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Visitor" DROP COLUMN "metadata",
ADD COLUMN     "notes" TEXT;
