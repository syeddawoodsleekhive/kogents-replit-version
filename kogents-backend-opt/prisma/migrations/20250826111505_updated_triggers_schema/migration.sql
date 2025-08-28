/*
  Warnings:

  - The values [widget_enter,incoming_request,chat_message] on the enum `TriggerEvent` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TriggerEvent_new" AS ENUM ('WIDGET_ENTER', 'INCOMING_REQUEST', 'CHAT_MESSAGE');
ALTER TABLE "Trigger" ALTER COLUMN "event" TYPE "TriggerEvent_new" USING ("event"::text::"TriggerEvent_new");
ALTER TYPE "TriggerEvent" RENAME TO "TriggerEvent_old";
ALTER TYPE "TriggerEvent_new" RENAME TO "TriggerEvent";
DROP TYPE "TriggerEvent_old";
COMMIT;

-- AlterTable
ALTER TABLE "TriggerExecutionLog" ADD COLUMN     "chatRoomId" TEXT;

-- AddForeignKey
ALTER TABLE "TriggerExecutionLog" ADD CONSTRAINT "TriggerExecutionLog_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
