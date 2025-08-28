-- CreateEnum
CREATE TYPE "UserSessionStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionStatus" "UserSessionStatus" NOT NULL DEFAULT 'OFFLINE';
