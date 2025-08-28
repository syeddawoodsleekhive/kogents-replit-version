/*
  Warnings:

  - You are about to drop the column `priority` on the `ChatRoom` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ChatRoom` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "VisitorSessionStatus" ADD VALUE 'CURRENTLY_SERVED';

-- DropIndex
DROP INDEX "ChatRoom_status_idx";

-- AlterTable
ALTER TABLE "ChatRoom" DROP COLUMN "priority",
DROP COLUMN "status";
