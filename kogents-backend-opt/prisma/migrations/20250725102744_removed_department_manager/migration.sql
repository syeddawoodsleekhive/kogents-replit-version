/*
  Warnings:

  - You are about to drop the column `managerId` on the `Department` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_managerId_fkey";

-- DropIndex
DROP INDEX "Department_managerId_key";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "managerId";
