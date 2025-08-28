/*
  Warnings:

  - You are about to drop the `ChatFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatFile" DROP CONSTRAINT "ChatFile_workspaceId_fkey";

-- DropTable
DROP TABLE "ChatFile";

-- CreateTable
CREATE TABLE "CannedResponse" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "shortcut" TEXT,
    "categoryId" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cannedResponseFolderId" TEXT,

    CONSTRAINT "CannedResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CannedResponseCategory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CannedResponseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CannedResponseUsage" (
    "id" TEXT NOT NULL,
    "cannedResponseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CannedResponseUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CannedResponseFolder" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CannedResponseFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CannedResponseUserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "cannedResponseId" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CannedResponseUserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CannedResponseFolder_workspaceId_idx" ON "CannedResponseFolder"("workspaceId");

-- CreateIndex
CREATE INDEX "CannedResponseFolder_parentId_idx" ON "CannedResponseFolder"("parentId");

-- CreateIndex
CREATE INDEX "CannedResponseFolder_sortOrder_idx" ON "CannedResponseFolder"("sortOrder");

-- CreateIndex
CREATE INDEX "CannedResponseFolder_createdAt_idx" ON "CannedResponseFolder"("createdAt");

-- CreateIndex
CREATE INDEX "CannedResponseFolder_updatedAt_idx" ON "CannedResponseFolder"("updatedAt");

-- AddForeignKey
ALTER TABLE "CannedResponse" ADD CONSTRAINT "CannedResponse_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponse" ADD CONSTRAINT "CannedResponse_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CannedResponseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponse" ADD CONSTRAINT "CannedResponse_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponse" ADD CONSTRAINT "CannedResponse_cannedResponseFolderId_fkey" FOREIGN KEY ("cannedResponseFolderId") REFERENCES "CannedResponseFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponseCategory" ADD CONSTRAINT "CannedResponseCategory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponseUsage" ADD CONSTRAINT "CannedResponseUsage_cannedResponseId_fkey" FOREIGN KEY ("cannedResponseId") REFERENCES "CannedResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponseUsage" ADD CONSTRAINT "CannedResponseUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponseUsage" ADD CONSTRAINT "CannedResponseUsage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponseFolder" ADD CONSTRAINT "CannedResponseFolder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponseFolder" ADD CONSTRAINT "CannedResponseFolder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponseFolder" ADD CONSTRAINT "CannedResponseFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CannedResponseFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponseUserPreference" ADD CONSTRAINT "CannedResponseUserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponseUserPreference" ADD CONSTRAINT "CannedResponseUserPreference_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
