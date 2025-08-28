-- DropForeignKey
ALTER TABLE "CannedResponse" DROP CONSTRAINT "CannedResponse_cannedResponseFolderId_fkey";

-- AlterTable
ALTER TABLE "CannedResponseUserPreference" ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagCategory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationTag" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedBy" TEXT,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "ConversationTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagUsage" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTagPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTagPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_workspaceId_idx" ON "Tag"("workspaceId");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_createdAt_idx" ON "Tag"("createdAt");

-- CreateIndex
CREATE INDEX "Tag_updatedAt_idx" ON "Tag"("updatedAt");

-- CreateIndex
CREATE INDEX "TagCategory_workspaceId_idx" ON "TagCategory"("workspaceId");

-- CreateIndex
CREATE INDEX "TagCategory_name_idx" ON "TagCategory"("name");

-- CreateIndex
CREATE INDEX "TagCategory_createdAt_idx" ON "TagCategory"("createdAt");

-- CreateIndex
CREATE INDEX "TagCategory_updatedAt_idx" ON "TagCategory"("updatedAt");

-- CreateIndex
CREATE INDEX "ConversationTag_tagId_idx" ON "ConversationTag"("tagId");

-- CreateIndex
CREATE INDEX "ConversationTag_conversationId_idx" ON "ConversationTag"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationTag_assignedBy_idx" ON "ConversationTag"("assignedBy");

-- CreateIndex
CREATE INDEX "ConversationTag_removedBy_idx" ON "ConversationTag"("removedBy");

-- CreateIndex
CREATE INDEX "ConversationTag_assignedAt_idx" ON "ConversationTag"("assignedAt");

-- CreateIndex
CREATE INDEX "ConversationTag_removedAt_idx" ON "ConversationTag"("removedAt");

-- CreateIndex
CREATE INDEX "TagUsage_tagId_idx" ON "TagUsage"("tagId");

-- CreateIndex
CREATE INDEX "TagUsage_workspaceId_idx" ON "TagUsage"("workspaceId");

-- CreateIndex
CREATE INDEX "TagUsage_usageCount_idx" ON "TagUsage"("usageCount");

-- CreateIndex
CREATE INDEX "TagUsage_lastUsedAt_idx" ON "TagUsage"("lastUsedAt");

-- CreateIndex
CREATE INDEX "TagUsage_createdAt_idx" ON "TagUsage"("createdAt");

-- CreateIndex
CREATE INDEX "TagUsage_updatedAt_idx" ON "TagUsage"("updatedAt");

-- CreateIndex
CREATE INDEX "UserTagPreference_userId_idx" ON "UserTagPreference"("userId");

-- CreateIndex
CREATE INDEX "UserTagPreference_workspaceId_idx" ON "UserTagPreference"("workspaceId");

-- CreateIndex
CREATE INDEX "UserTagPreference_tagId_idx" ON "UserTagPreference"("tagId");

-- CreateIndex
CREATE INDEX "UserTagPreference_isFavorite_idx" ON "UserTagPreference"("isFavorite");

-- CreateIndex
CREATE INDEX "UserTagPreference_usageCount_idx" ON "UserTagPreference"("usageCount");

-- CreateIndex
CREATE INDEX "UserTagPreference_lastUsedAt_idx" ON "UserTagPreference"("lastUsedAt");

-- CreateIndex
CREATE INDEX "UserTagPreference_createdAt_idx" ON "UserTagPreference"("createdAt");

-- CreateIndex
CREATE INDEX "UserTagPreference_updatedAt_idx" ON "UserTagPreference"("updatedAt");

-- CreateIndex
CREATE INDEX "CannedResponseUserPreference_userId_idx" ON "CannedResponseUserPreference"("userId");

-- CreateIndex
CREATE INDEX "CannedResponseUserPreference_workspaceId_idx" ON "CannedResponseUserPreference"("workspaceId");

-- CreateIndex
CREATE INDEX "CannedResponseUserPreference_cannedResponseId_idx" ON "CannedResponseUserPreference"("cannedResponseId");

-- CreateIndex
CREATE INDEX "CannedResponseUserPreference_isFavorite_idx" ON "CannedResponseUserPreference"("isFavorite");

-- CreateIndex
CREATE INDEX "CannedResponseUserPreference_usageCount_idx" ON "CannedResponseUserPreference"("usageCount");

-- CreateIndex
CREATE INDEX "CannedResponseUserPreference_createdAt_idx" ON "CannedResponseUserPreference"("createdAt");

-- CreateIndex
CREATE INDEX "CannedResponseUserPreference_updatedAt_idx" ON "CannedResponseUserPreference"("updatedAt");

-- AddForeignKey
ALTER TABLE "CannedResponse" ADD CONSTRAINT "CannedResponse_cannedResponseFolderId_fkey" FOREIGN KEY ("cannedResponseFolderId") REFERENCES "CannedResponseFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TagCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagCategory" ADD CONSTRAINT "TagCategory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagCategory" ADD CONSTRAINT "TagCategory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTag" ADD CONSTRAINT "ConversationTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTag" ADD CONSTRAINT "ConversationTag_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTag" ADD CONSTRAINT "ConversationTag_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTag" ADD CONSTRAINT "ConversationTag_removedBy_fkey" FOREIGN KEY ("removedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagUsage" ADD CONSTRAINT "TagUsage_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagUsage" ADD CONSTRAINT "TagUsage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagPreference" ADD CONSTRAINT "UserTagPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagPreference" ADD CONSTRAINT "UserTagPreference_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagPreference" ADD CONSTRAINT "UserTagPreference_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
