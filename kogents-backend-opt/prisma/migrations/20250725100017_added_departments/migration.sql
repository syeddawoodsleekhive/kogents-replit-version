-- CreateEnum
CREATE TYPE "VisitorSessionStatus" AS ENUM ('ACTIVE', 'IDLE', 'AWAY', 'INCOMING');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "branding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "apiToken" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "workspaceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "avatarUrl" TEXT,
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignmentHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "previousRoleId" TEXT,
    "assignmentType" TEXT NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "RoleAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "currentStep" TEXT NOT NULL DEFAULT 'email',
    "totalSteps" INTEGER NOT NULL DEFAULT 4,
    "completionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pageLoadTime" INTEGER,
    "formInteractionTime" INTEGER,
    "totalSessionTime" INTEGER,
    "country" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "screenResolution" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "isVpn" BOOLEAN NOT NULL DEFAULT false,
    "isTor" BOOLEAN NOT NULL DEFAULT false,
    "isProxy" BOOLEAN NOT NULL DEFAULT false,
    "registrationSuccessful" BOOLEAN NOT NULL DEFAULT false,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingAttribution" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "referrerUrl" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "landingPage" TEXT,
    "campaignId" TEXT,
    "adGroupId" TEXT,
    "keyword" TEXT,
    "gclid" TEXT,
    "fbclid" TEXT,
    "conversionValue" DECIMAL(10,2),
    "conversionCurrency" TEXT DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "description" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "location" JSONB,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "threatIndicators" JSONB,
    "mitigationActions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ms',
    "pageUrl" TEXT,
    "apiEndpoint" TEXT,
    "databaseQuery" TEXT,
    "browser" TEXT,
    "deviceType" TEXT,
    "networkType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormInteraction" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    "fieldFocusTime" INTEGER,
    "typingSpeed" DECIMAL(5,2),
    "fieldCompleted" BOOLEAN NOT NULL DEFAULT false,
    "validationPassed" BOOLEAN,
    "errorMessage" TEXT,
    "attemptsCount" INTEGER NOT NULL DEFAULT 1,
    "inputLength" INTEGER,
    "backspaceCount" INTEGER NOT NULL DEFAULT 0,
    "pasteDetected" BOOLEAN NOT NULL DEFAULT false,
    "autocompleteUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBehavior" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "behaviorType" TEXT NOT NULL,
    "elementId" TEXT,
    "elementClass" TEXT,
    "elementText" TEXT,
    "coordinates" JSONB,
    "scrollPosition" JSONB,
    "viewportSize" JSONB,
    "timestampMs" BIGINT NOT NULL,
    "duration" INTEGER,
    "pageUrl" TEXT,
    "referrerUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "visitorSessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "primaryAgentId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'visitor',
    "permissions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "replyToId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypingEvent" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "isTyping" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "availability" TEXT NOT NULL DEFAULT 'available',
    "currentRoomId" TEXT,
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "maxConcurrentChats" INTEGER NOT NULL DEFAULT 5,
    "currentChats" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoutingRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "routingType" TEXT NOT NULL DEFAULT 'round_robin',
    "targetAgents" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAnalytics" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "firstResponseTime" INTEGER,
    "averageResponseTime" INTEGER,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "visitorMessageCount" INTEGER NOT NULL DEFAULT 0,
    "agentMessageCount" INTEGER NOT NULL DEFAULT 0,
    "internalMessageCount" INTEGER NOT NULL DEFAULT 0,
    "chatDuration" INTEGER,
    "activeDuration" INTEGER,
    "agentCount" INTEGER NOT NULL DEFAULT 0,
    "participantCount" INTEGER NOT NULL DEFAULT 1,
    "rating" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatPerformanceMetric" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ms',
    "timePeriod" TEXT NOT NULL,
    "agentId" TEXT,
    "roomId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatTransfer" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "fromAgentId" TEXT,
    "toAgentId" TEXT,
    "reason" TEXT,
    "transferType" TEXT NOT NULL DEFAULT 'manual',
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSessionHistory" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,

    CONSTRAINT "ChatSessionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProactiveTrigger" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "delaySeconds" INTEGER NOT NULL DEFAULT 30,
    "maxTriggers" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'proactive',
    "visitorType" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "triggeredCount" INTEGER NOT NULL DEFAULT 0,
    "convertedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProactiveTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProactiveTriggerLog" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "message" TEXT NOT NULL,
    "wasTriggered" BOOLEAN NOT NULL DEFAULT false,
    "wasAccepted" BOOLEAN NOT NULL DEFAULT false,
    "response" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ProactiveTriggerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "uploaderId" TEXT NOT NULL,
    "uploaderType" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "roomId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isIdentified" BOOLEAN NOT NULL DEFAULT false,
    "identifiedAt" TIMESTAMP(3),
    "mergedIntoVisitorId" TEXT,
    "mergedAt" TIMESTAMP(3),
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "pageViewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "referrerUrl" TEXT,
    "landingPage" TEXT,
    "hasInteracted" BOOLEAN NOT NULL DEFAULT false,
    "totalChats" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorMergeLog" (
    "id" TEXT NOT NULL,
    "unifiedVisitorId" TEXT NOT NULL,
    "mergedVisitorIds" TEXT[],
    "workspaceId" TEXT NOT NULL,
    "mergeReason" TEXT NOT NULL,
    "identityData" JSONB,
    "mergedSessionsCount" INTEGER NOT NULL DEFAULT 0,
    "mergedMessagesCount" INTEGER NOT NULL DEFAULT 0,
    "mergedFilesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorMergeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorSession" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "pageUrl" TEXT,
    "referrerUrl" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" JSONB,
    "status" "VisitorSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorAnalytics" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "totalChats" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "averageChatDuration" INTEGER,
    "averageRating" DECIMAL(3,2),
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "firstVisitAt" TIMESTAMP(3),
    "lastVisitAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitorAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Widget" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "theme" JSONB NOT NULL,
    "position" JSONB NOT NULL,
    "businessHours" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Widget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetAnalytics" (
    "id" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "visitorCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "returningVisitors" INTEGER NOT NULL DEFAULT 0,
    "chatStarted" INTEGER NOT NULL DEFAULT 0,
    "messagesReceived" INTEGER NOT NULL DEFAULT 0,
    "averageSessionDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proactiveTriggersShown" INTEGER NOT NULL DEFAULT 0,
    "proactiveTriggersAccepted" INTEGER NOT NULL DEFAULT 0,
    "averageLoadTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "uptime" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "goalCompletions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT,

    CONSTRAINT "WidgetAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DepartmentUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DepartmentUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_apiToken_key" ON "Workspace"("apiToken");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_adminId_key" ON "Workspace"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_managerId_key" ON "Department"("managerId");

-- CreateIndex
CREATE INDEX "Department_workspaceId_idx" ON "Department"("workspaceId");

-- CreateIndex
CREATE INDEX "Department_isActive_idx" ON "Department"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Department_workspaceId_name_key" ON "Department"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Role_workspaceId_idx" ON "Role"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "RoleAssignmentHistory_userId_workspaceId_idx" ON "RoleAssignmentHistory"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "RoleAssignmentHistory_assignedAt_idx" ON "RoleAssignmentHistory"("assignedAt");

-- CreateIndex
CREATE INDEX "RoleAssignmentHistory_workspaceId_idx" ON "RoleAssignmentHistory"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationSession_sessionToken_key" ON "RegistrationSession"("sessionToken");

-- CreateIndex
CREATE INDEX "RegistrationSession_sessionToken_idx" ON "RegistrationSession"("sessionToken");

-- CreateIndex
CREATE INDEX "RegistrationSession_ipAddress_idx" ON "RegistrationSession"("ipAddress");

-- CreateIndex
CREATE INDEX "RegistrationSession_deviceFingerprint_idx" ON "RegistrationSession"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "RegistrationSession_startedAt_idx" ON "RegistrationSession"("startedAt");

-- CreateIndex
CREATE INDEX "RegistrationSession_riskScore_idx" ON "RegistrationSession"("riskScore");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingAttribution_sessionToken_key" ON "MarketingAttribution"("sessionToken");

-- CreateIndex
CREATE INDEX "MarketingAttribution_utmSource_utmCampaign_idx" ON "MarketingAttribution"("utmSource", "utmCampaign");

-- CreateIndex
CREATE INDEX "MarketingAttribution_campaignId_idx" ON "MarketingAttribution"("campaignId");

-- CreateIndex
CREATE INDEX "SecurityEvent_sessionToken_idx" ON "SecurityEvent"("sessionToken");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_idx" ON "SecurityEvent"("severity");

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_riskScore_idx" ON "SecurityEvent"("riskScore");

-- CreateIndex
CREATE INDEX "PerformanceMetric_sessionToken_idx" ON "PerformanceMetric"("sessionToken");

-- CreateIndex
CREATE INDEX "PerformanceMetric_metricType_idx" ON "PerformanceMetric"("metricType");

-- CreateIndex
CREATE INDEX "PerformanceMetric_createdAt_idx" ON "PerformanceMetric"("createdAt");

-- CreateIndex
CREATE INDEX "FormInteraction_sessionToken_idx" ON "FormInteraction"("sessionToken");

-- CreateIndex
CREATE INDEX "FormInteraction_fieldName_idx" ON "FormInteraction"("fieldName");

-- CreateIndex
CREATE INDEX "FormInteraction_interactionType_idx" ON "FormInteraction"("interactionType");

-- CreateIndex
CREATE INDEX "FormInteraction_createdAt_idx" ON "FormInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "UserBehavior_sessionToken_idx" ON "UserBehavior"("sessionToken");

-- CreateIndex
CREATE INDEX "UserBehavior_behaviorType_idx" ON "UserBehavior"("behaviorType");

-- CreateIndex
CREATE INDEX "UserBehavior_createdAt_idx" ON "UserBehavior"("createdAt");

-- CreateIndex
CREATE INDEX "ChatRoom_workspaceId_idx" ON "ChatRoom"("workspaceId");

-- CreateIndex
CREATE INDEX "ChatRoom_visitorId_idx" ON "ChatRoom"("visitorId");

-- CreateIndex
CREATE INDEX "ChatRoom_visitorSessionId_idx" ON "ChatRoom"("visitorSessionId");

-- CreateIndex
CREATE INDEX "ChatRoom_status_idx" ON "ChatRoom"("status");

-- CreateIndex
CREATE INDEX "ChatRoom_primaryAgentId_idx" ON "ChatRoom"("primaryAgentId");

-- CreateIndex
CREATE INDEX "ChatRoom_createdAt_idx" ON "ChatRoom"("createdAt");

-- CreateIndex
CREATE INDEX "ChatParticipant_roomId_idx" ON "ChatParticipant"("roomId");

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_idx" ON "ChatParticipant"("userId");

-- CreateIndex
CREATE INDEX "ChatParticipant_visitorId_idx" ON "ChatParticipant"("visitorId");

-- CreateIndex
CREATE INDEX "ChatParticipant_status_idx" ON "ChatParticipant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_roomId_userId_key" ON "ChatParticipant"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_roomId_visitorId_key" ON "ChatParticipant"("roomId", "visitorId");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_idx" ON "ChatMessage"("roomId");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatMessage_isInternal_idx" ON "ChatMessage"("isInternal");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "TypingEvent_roomId_idx" ON "TypingEvent"("roomId");

-- CreateIndex
CREATE INDEX "TypingEvent_participantId_idx" ON "TypingEvent"("participantId");

-- CreateIndex
CREATE INDEX "TypingEvent_expiresAt_idx" ON "TypingEvent"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentStatus_userId_key" ON "AgentStatus"("userId");

-- CreateIndex
CREATE INDEX "AgentStatus_workspaceId_idx" ON "AgentStatus"("workspaceId");

-- CreateIndex
CREATE INDEX "AgentStatus_status_idx" ON "AgentStatus"("status");

-- CreateIndex
CREATE INDEX "AgentStatus_availability_idx" ON "AgentStatus"("availability");

-- CreateIndex
CREATE INDEX "ChatRoutingRule_workspaceId_idx" ON "ChatRoutingRule"("workspaceId");

-- CreateIndex
CREATE INDEX "ChatRoutingRule_isActive_idx" ON "ChatRoutingRule"("isActive");

-- CreateIndex
CREATE INDEX "ChatRoutingRule_priority_idx" ON "ChatRoutingRule"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "ChatAnalytics_roomId_key" ON "ChatAnalytics"("roomId");

-- CreateIndex
CREATE INDEX "ChatAnalytics_createdAt_idx" ON "ChatAnalytics"("createdAt");

-- CreateIndex
CREATE INDEX "ChatPerformanceMetric_workspaceId_idx" ON "ChatPerformanceMetric"("workspaceId");

-- CreateIndex
CREATE INDEX "ChatPerformanceMetric_metricType_idx" ON "ChatPerformanceMetric"("metricType");

-- CreateIndex
CREATE INDEX "ChatPerformanceMetric_recordedAt_idx" ON "ChatPerformanceMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "ChatTransfer_roomId_idx" ON "ChatTransfer"("roomId");

-- CreateIndex
CREATE INDEX "ChatTransfer_transferredAt_idx" ON "ChatTransfer"("transferredAt");

-- CreateIndex
CREATE INDEX "ChatSessionHistory_roomId_idx" ON "ChatSessionHistory"("roomId");

-- CreateIndex
CREATE INDEX "ChatSessionHistory_participantId_idx" ON "ChatSessionHistory"("participantId");

-- CreateIndex
CREATE INDEX "ChatSessionHistory_startedAt_idx" ON "ChatSessionHistory"("startedAt");

-- CreateIndex
CREATE INDEX "ProactiveTrigger_workspaceId_idx" ON "ProactiveTrigger"("workspaceId");

-- CreateIndex
CREATE INDEX "ProactiveTrigger_isActive_idx" ON "ProactiveTrigger"("isActive");

-- CreateIndex
CREATE INDEX "ProactiveTrigger_triggerType_idx" ON "ProactiveTrigger"("triggerType");

-- CreateIndex
CREATE INDEX "ProactiveTrigger_priority_idx" ON "ProactiveTrigger"("priority");

-- CreateIndex
CREATE INDEX "ProactiveTriggerLog_triggerId_idx" ON "ProactiveTriggerLog"("triggerId");

-- CreateIndex
CREATE INDEX "ProactiveTriggerLog_sessionId_idx" ON "ProactiveTriggerLog"("sessionId");

-- CreateIndex
CREATE INDEX "ProactiveTriggerLog_visitorId_idx" ON "ProactiveTriggerLog"("visitorId");

-- CreateIndex
CREATE INDEX "ProactiveTriggerLog_triggeredAt_idx" ON "ProactiveTriggerLog"("triggeredAt");

-- CreateIndex
CREATE INDEX "ChatFile_workspaceId_idx" ON "ChatFile"("workspaceId");

-- CreateIndex
CREATE INDEX "ChatFile_roomId_idx" ON "ChatFile"("roomId");

-- CreateIndex
CREATE INDEX "ChatFile_uploaderId_idx" ON "ChatFile"("uploaderId");

-- CreateIndex
CREATE INDEX "ChatFile_status_idx" ON "ChatFile"("status");

-- CreateIndex
CREATE INDEX "ChatFile_createdAt_idx" ON "ChatFile"("createdAt");

-- CreateIndex
CREATE INDEX "Visitor_workspaceId_idx" ON "Visitor"("workspaceId");

-- CreateIndex
CREATE INDEX "Visitor_email_idx" ON "Visitor"("email");

-- CreateIndex
CREATE INDEX "Visitor_phone_idx" ON "Visitor"("phone");

-- CreateIndex
CREATE INDEX "Visitor_isIdentified_idx" ON "Visitor"("isIdentified");

-- CreateIndex
CREATE INDEX "Visitor_mergedIntoVisitorId_idx" ON "Visitor"("mergedIntoVisitorId");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_email_workspaceId_key" ON "Visitor"("email", "workspaceId");

-- CreateIndex
CREATE INDEX "VisitorMergeLog_unifiedVisitorId_idx" ON "VisitorMergeLog"("unifiedVisitorId");

-- CreateIndex
CREATE INDEX "VisitorMergeLog_workspaceId_idx" ON "VisitorMergeLog"("workspaceId");

-- CreateIndex
CREATE INDEX "VisitorMergeLog_createdAt_idx" ON "VisitorMergeLog"("createdAt");

-- CreateIndex
CREATE INDEX "VisitorSession_workspaceId_idx" ON "VisitorSession"("workspaceId");

-- CreateIndex
CREATE INDEX "VisitorSession_visitorId_idx" ON "VisitorSession"("visitorId");

-- CreateIndex
CREATE INDEX "VisitorSession_status_idx" ON "VisitorSession"("status");

-- CreateIndex
CREATE INDEX "VisitorSession_startedAt_idx" ON "VisitorSession"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorSession_visitorId_workspaceId_key" ON "VisitorSession"("visitorId", "workspaceId");

-- CreateIndex
CREATE INDEX "VisitorAnalytics_workspaceId_idx" ON "VisitorAnalytics"("workspaceId");

-- CreateIndex
CREATE INDEX "VisitorAnalytics_visitorId_idx" ON "VisitorAnalytics"("visitorId");

-- CreateIndex
CREATE INDEX "VisitorAnalytics_lastVisitAt_idx" ON "VisitorAnalytics"("lastVisitAt");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorAnalytics_visitorId_workspaceId_key" ON "VisitorAnalytics"("visitorId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Widget_widgetId_key" ON "Widget"("widgetId");

-- CreateIndex
CREATE INDEX "Widget_domain_idx" ON "Widget"("domain");

-- CreateIndex
CREATE INDEX "Widget_widgetId_idx" ON "Widget"("widgetId");

-- CreateIndex
CREATE INDEX "Widget_workspaceId_idx" ON "Widget"("workspaceId");

-- CreateIndex
CREATE INDEX "Widget_isActive_idx" ON "Widget"("isActive");

-- CreateIndex
CREATE INDEX "WidgetAnalytics_date_idx" ON "WidgetAnalytics"("date");

-- CreateIndex
CREATE INDEX "WidgetAnalytics_widgetId_idx" ON "WidgetAnalytics"("widgetId");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetAnalytics_widgetId_date_key" ON "WidgetAnalytics"("widgetId", "date");

-- CreateIndex
CREATE INDEX "_DepartmentUsers_B_index" ON "_DepartmentUsers"("B");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignmentHistory" ADD CONSTRAINT "RoleAssignmentHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignmentHistory" ADD CONSTRAINT "RoleAssignmentHistory_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignmentHistory" ADD CONSTRAINT "RoleAssignmentHistory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignmentHistory" ADD CONSTRAINT "RoleAssignmentHistory_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingAttribution" ADD CONSTRAINT "MarketingAttribution_sessionToken_fkey" FOREIGN KEY ("sessionToken") REFERENCES "RegistrationSession"("sessionToken") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_sessionToken_fkey" FOREIGN KEY ("sessionToken") REFERENCES "RegistrationSession"("sessionToken") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_sessionToken_fkey" FOREIGN KEY ("sessionToken") REFERENCES "RegistrationSession"("sessionToken") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormInteraction" ADD CONSTRAINT "FormInteraction_sessionToken_fkey" FOREIGN KEY ("sessionToken") REFERENCES "RegistrationSession"("sessionToken") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBehavior" ADD CONSTRAINT "UserBehavior_sessionToken_fkey" FOREIGN KEY ("sessionToken") REFERENCES "RegistrationSession"("sessionToken") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_visitorSessionId_fkey" FOREIGN KEY ("visitorSessionId") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_primaryAgentId_fkey" FOREIGN KEY ("primaryAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypingEvent" ADD CONSTRAINT "TypingEvent_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ChatParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypingEvent" ADD CONSTRAINT "TypingEvent_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentStatus" ADD CONSTRAINT "AgentStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentStatus" ADD CONSTRAINT "AgentStatus_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentStatus" ADD CONSTRAINT "AgentStatus_currentRoomId_fkey" FOREIGN KEY ("currentRoomId") REFERENCES "ChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoutingRule" ADD CONSTRAINT "ChatRoutingRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatPerformanceMetric" ADD CONSTRAINT "ChatPerformanceMetric_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatPerformanceMetric" ADD CONSTRAINT "ChatPerformanceMetric_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatTransfer" ADD CONSTRAINT "ChatTransfer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatTransfer" ADD CONSTRAINT "ChatTransfer_fromAgentId_fkey" FOREIGN KEY ("fromAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatTransfer" ADD CONSTRAINT "ChatTransfer_toAgentId_fkey" FOREIGN KEY ("toAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSessionHistory" ADD CONSTRAINT "ChatSessionHistory_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ChatParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSessionHistory" ADD CONSTRAINT "ChatSessionHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProactiveTrigger" ADD CONSTRAINT "ProactiveTrigger_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProactiveTriggerLog" ADD CONSTRAINT "ProactiveTriggerLog_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProactiveTriggerLog" ADD CONSTRAINT "ProactiveTriggerLog_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "ProactiveTrigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatFile" ADD CONSTRAINT "ChatFile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorMergeLog" ADD CONSTRAINT "VisitorMergeLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorSession" ADD CONSTRAINT "VisitorSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorSession" ADD CONSTRAINT "VisitorSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorAnalytics" ADD CONSTRAINT "VisitorAnalytics_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorAnalytics" ADD CONSTRAINT "VisitorAnalytics_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Widget" ADD CONSTRAINT "Widget_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetAnalytics" ADD CONSTRAINT "WidgetAnalytics_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "Widget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetAnalytics" ADD CONSTRAINT "WidgetAnalytics_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentUsers" ADD CONSTRAINT "_DepartmentUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentUsers" ADD CONSTRAINT "_DepartmentUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
