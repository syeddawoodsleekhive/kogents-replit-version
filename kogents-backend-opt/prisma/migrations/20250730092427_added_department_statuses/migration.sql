-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('ONLINE', 'OFFLINE', 'BUSY');

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "status" "DepartmentStatus" NOT NULL DEFAULT 'OFFLINE';
