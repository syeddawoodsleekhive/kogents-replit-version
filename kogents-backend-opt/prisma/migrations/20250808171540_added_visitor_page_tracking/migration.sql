-- CreateTable
CREATE TABLE "VisitorPageTracking" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "pageTitle" TEXT,
    "pagePath" TEXT,
    "pageHash" TEXT,
    "pageQuery" TEXT,
    "pageReferrer" TEXT,
    "pageReferrerDomain" TEXT,
    "pageCategory" TEXT,
    "pageType" TEXT,
    "pageTemplate" TEXT,
    "pageLanguage" TEXT,
    "timeOnPage" INTEGER,
    "pageLoadTime" INTEGER,
    "navigationMethod" TEXT,
    "navigationSource" TEXT,
    "navigationIntent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitorPageTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitorPageTracking_sessionId_key" ON "VisitorPageTracking"("sessionId");

-- CreateIndex
CREATE INDEX "VisitorPageTracking_visitorId_idx" ON "VisitorPageTracking"("visitorId");

-- CreateIndex
CREATE INDEX "VisitorPageTracking_sessionId_idx" ON "VisitorPageTracking"("sessionId");

-- CreateIndex
CREATE INDEX "VisitorPageTracking_workspaceId_idx" ON "VisitorPageTracking"("workspaceId");

-- CreateIndex
CREATE INDEX "VisitorPageTracking_pageUrl_idx" ON "VisitorPageTracking"("pageUrl");

-- CreateIndex
CREATE INDEX "VisitorPageTracking_pageCategory_idx" ON "VisitorPageTracking"("pageCategory");

-- CreateIndex
CREATE INDEX "VisitorPageTracking_pageType_idx" ON "VisitorPageTracking"("pageType");

-- CreateIndex
CREATE INDEX "VisitorPageTracking_viewedAt_idx" ON "VisitorPageTracking"("viewedAt");

-- CreateIndex
CREATE INDEX "VisitorPageTracking_navigationSource_idx" ON "VisitorPageTracking"("navigationSource");

-- AddForeignKey
ALTER TABLE "VisitorPageTracking" ADD CONSTRAINT "VisitorPageTracking_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorPageTracking" ADD CONSTRAINT "VisitorPageTracking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorPageTracking" ADD CONSTRAINT "VisitorPageTracking_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
