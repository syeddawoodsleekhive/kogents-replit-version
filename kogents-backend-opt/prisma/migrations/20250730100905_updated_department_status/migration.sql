/*
  Warnings:

  - The values [ONLINE] on the enum `DepartmentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DepartmentStatus_new" AS ENUM ('AVAILABLE', 'OFFLINE', 'BUSY');
ALTER TABLE "Department" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Department" ALTER COLUMN "status" TYPE "DepartmentStatus_new" USING ("status"::text::"DepartmentStatus_new");
ALTER TYPE "DepartmentStatus" RENAME TO "DepartmentStatus_old";
ALTER TYPE "DepartmentStatus_new" RENAME TO "DepartmentStatus";
DROP TYPE "DepartmentStatus_old";
ALTER TABLE "Department" ALTER COLUMN "status" SET DEFAULT 'OFFLINE';
COMMIT;
