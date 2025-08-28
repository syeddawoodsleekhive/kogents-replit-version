/*
  Warnings:

  - You are about to drop the column `predicate` on the `TriggerCondition` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TriggerCondition" DROP COLUMN "predicate",
ADD COLUMN     "operator" "PredicateOperator";
