/*
  Warnings:

  - You are about to drop the column `permissions` on the `ChatParticipant` table. All the data in the column will be lost.
  - The `status` column on the `ChatParticipant` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('ACTIVE', 'TYPING', 'AWAY', 'OFFLINE');

-- AlterTable
ALTER TABLE "ChatParticipant" DROP COLUMN "permissions",
DROP COLUMN "status",
ADD COLUMN     "status" "ParticipantStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "ChatParticipant_status_idx" ON "ChatParticipant"("status");
