-- CreateEnum
CREATE TYPE "ChatWindowStatus" AS ENUM ('OPEN', 'CLOSED', 'MINIMIZED', 'IN_BACKGROUND');

-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "chatWindowStatus" "ChatWindowStatus" NOT NULL DEFAULT 'CLOSED';
