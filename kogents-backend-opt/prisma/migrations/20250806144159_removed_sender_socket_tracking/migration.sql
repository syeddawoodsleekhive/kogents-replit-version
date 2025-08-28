/*
  Warnings:

  - You are about to drop the column `senderSocketId` on the `ChatMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "senderSocketId";
