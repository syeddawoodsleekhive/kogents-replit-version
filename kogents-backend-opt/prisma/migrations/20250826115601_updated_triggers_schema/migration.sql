/*
  Warnings:

  - The values [DEPARTMENT] on the enum `TriggerConditionField` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `rightBoolean` on the `TriggerCondition` table. All the data in the column will be lost.
  - You are about to drop the column `rightNumber` on the `TriggerCondition` table. All the data in the column will be lost.
  - You are about to drop the column `rightString` on the `TriggerCondition` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TriggerConditionField_new" AS ENUM ('HOUR_OF_DAY', 'DAY_OF_WEEK', 'STILL_ON_PAGE', 'STILL_ON_SITE', 'VISITOR_COUNTRY_CODE', 'VISITOR_COUNTRY_NAME', 'VISITOR_CITY', 'VISITOR_REGION', 'VISITOR_PREVIOUS_CHATS', 'VISITOR_PREVIOUS_VISITS', 'VISITOR_PAGE_URL', 'VISITOR_PAGE_TITLE', 'VISITOR_PAGE_COUNT', 'VISITOR_PREVIOUS_PAGE', 'VISITOR_NAME', 'VISITOR_EMAIL', 'VISITOR_REFERRER', 'VISITOR_SEARCH_ENGINE', 'VISITOR_SEARCH_TERMS', 'VISITOR_TAG', 'VISITOR_DEPARTMENT', 'VISITOR_USER_AGENT', 'VISITOR_BROWSER', 'VISITOR_PLATFORM', 'ACCOUNT_STATUS', 'DEPARTMENT_STATUS', 'VISITOR_STATUS', 'VISITOR_IS_CHATTING', 'VISITOR_INCOMING_REQUEST', 'VISITOR_CURRENTLY_SERVED', 'SENDER', 'SENDER_TYPE', 'MESSAGE', 'QUEUE_SIZE');
ALTER TABLE "TriggerCondition" ALTER COLUMN "field" TYPE "TriggerConditionField_new" USING ("field"::text::"TriggerConditionField_new");
ALTER TYPE "TriggerConditionField" RENAME TO "TriggerConditionField_old";
ALTER TYPE "TriggerConditionField_new" RENAME TO "TriggerConditionField";
DROP TYPE "TriggerConditionField_old";
COMMIT;

-- AlterTable
ALTER TABLE "TriggerCondition" DROP COLUMN "rightBoolean",
DROP COLUMN "rightNumber",
DROP COLUMN "rightString",
ADD COLUMN     "primaryRightBoolean" BOOLEAN,
ADD COLUMN     "primaryRightNumber" INTEGER,
ADD COLUMN     "primaryRightString" TEXT,
ADD COLUMN     "secondaryRightBoolean" BOOLEAN,
ADD COLUMN     "secondaryRightNumber" INTEGER,
ADD COLUMN     "secondaryRightString" TEXT;
