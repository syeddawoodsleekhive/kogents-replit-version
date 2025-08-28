/*
  Warnings:

  - You are about to drop the column `leftOperand` on the `TriggerCondition` table. All the data in the column will be lost.
  - Added the required column `field` to the `TriggerCondition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TriggerCondition" DROP COLUMN "leftOperand",
ADD COLUMN     "field" "TriggerConditionField" NOT NULL;
