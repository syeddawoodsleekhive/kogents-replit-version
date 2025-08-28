/*
  Warnings:

  - You are about to drop the column `departmentId` on the `ChatRoom` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_departmentId_fkey";

-- AlterTable
ALTER TABLE "ChatRoom" DROP COLUMN "departmentId",
ADD COLUMN     "currentServingDepartmentId" TEXT;

-- CreateTable
CREATE TABLE "_ChatRoomToDepartment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChatRoomToDepartment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ChatRoomToDepartment_B_index" ON "_ChatRoomToDepartment"("B");

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_currentServingDepartmentId_fkey" FOREIGN KEY ("currentServingDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatRoomToDepartment" ADD CONSTRAINT "_ChatRoomToDepartment_A_fkey" FOREIGN KEY ("A") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatRoomToDepartment" ADD CONSTRAINT "_ChatRoomToDepartment_B_fkey" FOREIGN KEY ("B") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
