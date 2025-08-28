/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `avgResponseTime` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `firstVisitAt` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `hasInteracted` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `lastSeenAt` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `mergedAt` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `mergedIntoVisitorId` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `pageViewCount` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `sessionCount` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `totalChats` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `totalTimeSpent` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the `VisitorMergeLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VisitorMergeLog" DROP CONSTRAINT "VisitorMergeLog_workspaceId_fkey";

-- DropIndex
DROP INDEX "Visitor_mergedIntoVisitorId_idx";

-- AlterTable
ALTER TABLE "Visitor" DROP COLUMN "avatarUrl",
DROP COLUMN "avgResponseTime",
DROP COLUMN "firstVisitAt",
DROP COLUMN "hasInteracted",
DROP COLUMN "lastSeenAt",
DROP COLUMN "mergedAt",
DROP COLUMN "mergedIntoVisitorId",
DROP COLUMN "pageViewCount",
DROP COLUMN "sessionCount",
DROP COLUMN "totalChats",
DROP COLUMN "totalTimeSpent";

-- DropTable
DROP TABLE "VisitorMergeLog";
