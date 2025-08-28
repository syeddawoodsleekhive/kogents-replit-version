/*
  Warnings:

  - You are about to drop the `_ChatRoomToDepartment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ChatRoomToDepartment" DROP CONSTRAINT "_ChatRoomToDepartment_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChatRoomToDepartment" DROP CONSTRAINT "_ChatRoomToDepartment_B_fkey";

-- DropTable
DROP TABLE "_ChatRoomToDepartment";

-- CreateTable
CREATE TABLE "_NonServingDepartments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NonServingDepartments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_NonServingDepartments_B_index" ON "_NonServingDepartments"("B");

-- AddForeignKey
ALTER TABLE "_NonServingDepartments" ADD CONSTRAINT "_NonServingDepartments_A_fkey" FOREIGN KEY ("A") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NonServingDepartments" ADD CONSTRAINT "_NonServingDepartments_B_fkey" FOREIGN KEY ("B") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
