/*
  Warnings:

  - Added the required column `currentStatus` to the `TriggerExecutionLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TriggerExecutionStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "TriggerExecutionLog" ADD COLUMN     "currentStatus" "TriggerExecutionStatus" NOT NULL,
ADD COLUMN     "executionDetails" JSONB;
