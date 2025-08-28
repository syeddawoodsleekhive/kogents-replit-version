/*
  Warnings:

  - You are about to drop the `ProactiveTrigger` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProactiveTriggerLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProactiveTrigger" DROP CONSTRAINT "ProactiveTrigger_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "ProactiveTriggerLog" DROP CONSTRAINT "ProactiveTriggerLog_triggerId_fkey";

-- DropForeignKey
ALTER TABLE "ProactiveTriggerLog" DROP CONSTRAINT "ProactiveTriggerLog_visitorId_fkey";

-- DropTable
DROP TABLE "ProactiveTrigger";

-- DropTable
DROP TABLE "ProactiveTriggerLog";
