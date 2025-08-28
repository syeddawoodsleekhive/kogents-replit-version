/*
  Warnings:

  - You are about to drop the column `sessionStatus` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "sessionStatus";

-- DropEnum
DROP TYPE "UserSessionStatus";
