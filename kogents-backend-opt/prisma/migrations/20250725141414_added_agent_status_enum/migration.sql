/*
  Warnings:

  - You are about to drop the column `availability` on the `AgentStatus` table. All the data in the column will be lost.
  - The `status` column on the `AgentStatus` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AgentAvailability" AS ENUM ('ONLINE', 'BUSY', 'OFFLINE');

-- DropIndex
DROP INDEX "AgentStatus_availability_idx";

-- AlterTable
ALTER TABLE "AgentStatus" DROP COLUMN "availability",
DROP COLUMN "status",
ADD COLUMN     "status" "AgentAvailability" NOT NULL DEFAULT 'OFFLINE';

-- CreateIndex
CREATE INDEX "AgentStatus_status_idx" ON "AgentStatus"("status");
