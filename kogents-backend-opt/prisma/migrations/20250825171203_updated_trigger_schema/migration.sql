/*
  Warnings:

  - You are about to drop the column `leftOperandKey` on the `TriggerCondition` table. All the data in the column will be lost.
  - Added the required column `leftOperand` to the `TriggerCondition` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TriggerConditionField" AS ENUM ('HOUR_OF_DAY', 'DAY_OF_WEEK', 'STILL_ON_PAGE', 'STILL_ON_SITE', 'VISITOR_COUNTRY_CODE', 'VISITOR_COUNTRY_NAME', 'VISITOR_CITY', 'VISITOR_REGION', 'VISITOR_PREVIOUS_CHATS', 'VISITOR_PREVIOUS_VISITS', 'VISITOR_PAGE_URL', 'VISITOR_PAGE_TITLE', 'VISITOR_PAGE_COUNT', 'VISITOR_PREVIOUS_PAGE', 'VISITOR_NAME', 'VISITOR_EMAIL', 'VISITOR_REFERRER', 'VISITOR_SEARCH_ENGINE', 'VISITOR_SEARCH_TERMS', 'VISITOR_TAG', 'VISITOR_DEPARTMENT', 'VISITOR_USER_AGENT', 'VISITOR_BROWSER', 'VISITOR_PLATFORM', 'ACCOUNT_STATUS', 'DEPARTMENT_STATUS', 'VISITOR_STATUS', 'VISITOR_IS_CHATTING', 'VISITOR_INCOMING_REQUEST', 'VISITOR_CURRENTLY_SERVED', 'DEPARTMENT', 'SENDER', 'SENDER_TYPE', 'MESSAGE', 'QUEUE_SIZE');

-- AlterTable
ALTER TABLE "TriggerCondition" DROP COLUMN "leftOperandKey",
ADD COLUMN     "leftOperand" "TriggerConditionField" NOT NULL,
ALTER COLUMN "predicate" DROP NOT NULL;
