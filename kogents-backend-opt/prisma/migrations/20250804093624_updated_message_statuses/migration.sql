-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "deliveredTo" TEXT[],
ADD COLUMN     "readBy" TEXT[];
