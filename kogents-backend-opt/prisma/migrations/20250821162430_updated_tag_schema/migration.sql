/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_createdBy_fkey";

-- DropIndex
DROP INDEX "Tag_name_key";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "createdBy",
ADD COLUMN     "createdByUser" TEXT,
ADD COLUMN     "createdByVisitor" TEXT;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_createdByUser_fkey" FOREIGN KEY ("createdByUser") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_createdByVisitor_fkey" FOREIGN KEY ("createdByVisitor") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
