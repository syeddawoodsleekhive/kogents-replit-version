/*
  Warnings:

  - You are about to drop the `_DepartmentUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DepartmentUsers" DROP CONSTRAINT "_DepartmentUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_DepartmentUsers" DROP CONSTRAINT "_DepartmentUsers_B_fkey";

-- DropTable
DROP TABLE "_DepartmentUsers";

-- CreateTable
CREATE TABLE "User_Departments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "assignedReason" TEXT,

    CONSTRAINT "User_Departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_Departments_userId_idx" ON "User_Departments"("userId");

-- CreateIndex
CREATE INDEX "User_Departments_departmentId_idx" ON "User_Departments"("departmentId");

-- CreateIndex
CREATE INDEX "User_Departments_userId_departmentId_idx" ON "User_Departments"("userId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_Departments_userId_departmentId_key" ON "User_Departments"("userId", "departmentId");

-- AddForeignKey
ALTER TABLE "User_Departments" ADD CONSTRAINT "User_Departments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Departments" ADD CONSTRAINT "User_Departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
