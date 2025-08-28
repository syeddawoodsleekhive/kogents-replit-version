/*
  Warnings:

  - You are about to drop the column `messageText` on the `TriggerAction` table. All the data in the column will be lost.
  - You are about to drop the column `senderName` on the `TriggerAction` table. All the data in the column will be lost.
  - You are about to drop the column `waitSeconds` on the `TriggerAction` table. All the data in the column will be lost.
  - You are about to drop the column `rightType` on the `TriggerCondition` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Trigger" ALTER COLUMN "priority" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "TriggerAction" DROP COLUMN "messageText",
DROP COLUMN "senderName",
DROP COLUMN "waitSeconds",
ADD COLUMN     "primaryBooleanValue" BOOLEAN,
ADD COLUMN     "primaryIntValue" INTEGER,
ADD COLUMN     "primaryStringValue" TEXT,
ADD COLUMN     "secondaryBooleanValue" BOOLEAN,
ADD COLUMN     "secondaryIntValue" INTEGER,
ADD COLUMN     "secondaryStringValue" TEXT;

-- AlterTable
ALTER TABLE "TriggerCondition" DROP COLUMN "rightType";

-- DropEnum
DROP TYPE "ValueType";
