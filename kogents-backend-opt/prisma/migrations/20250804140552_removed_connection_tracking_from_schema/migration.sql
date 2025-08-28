/*
  Warnings:

  - You are about to drop the column `connectionIds` on the `VisitorSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VisitorSession" DROP COLUMN "connectionIds";
