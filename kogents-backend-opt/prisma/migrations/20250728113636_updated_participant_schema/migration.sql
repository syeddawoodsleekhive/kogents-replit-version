/*
  Warnings:

  - The values [TYPING] on the enum `ParticipantStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isTyping` on the `ChatParticipant` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ParticipantStatus_new" AS ENUM ('ACTIVE', 'AWAY', 'OFFLINE');
ALTER TABLE "ChatParticipant" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ChatParticipant" ALTER COLUMN "status" TYPE "ParticipantStatus_new" USING ("status"::text::"ParticipantStatus_new");
ALTER TYPE "ParticipantStatus" RENAME TO "ParticipantStatus_old";
ALTER TYPE "ParticipantStatus_new" RENAME TO "ParticipantStatus";
DROP TYPE "ParticipantStatus_old";
ALTER TABLE "ChatParticipant" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "ChatParticipant" DROP COLUMN "isTyping";
