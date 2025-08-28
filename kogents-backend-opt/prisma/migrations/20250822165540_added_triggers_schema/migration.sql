-- CreateEnum
CREATE TYPE "TriggerEvent" AS ENUM ('widget_enter', 'incoming_request', 'chat_message');

-- CreateEnum
CREATE TYPE "LogicalOperator" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "PredicateOperator" AS ENUM ('EQ', 'NE', 'LT', 'LTE', 'GT', 'GTE', 'CONTAINS', 'ICONTAINS', 'STARTS_WITH', 'ISTARTS_WITH', 'ENDS_WITH', 'IENDS_WITH');

-- CreateEnum
CREATE TYPE "ValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('WAIT', 'SEND_MESSAGE_TO_VISITOR', 'SET_NAME_OF_VISITOR', 'ADD_TAG', 'REMOVE_TAG', 'SET_VISITOR_DEPARTMENT', 'REPLACE_NOTE', 'APPEND_NOTE');

-- CreateTable
CREATE TABLE "Trigger" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event" "TriggerEvent" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT,

    CONSTRAINT "Trigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerConditionGroup" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "parentId" TEXT,
    "operator" "LogicalOperator" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TriggerConditionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerCondition" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "predicate" "PredicateOperator" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "leftOperandKey" TEXT NOT NULL,
    "rightType" "ValueType" NOT NULL,
    "rightString" TEXT,
    "rightNumber" INTEGER,
    "rightBoolean" BOOLEAN,

    CONSTRAINT "TriggerCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerAction" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "waitSeconds" INTEGER,
    "senderName" TEXT,
    "messageText" TEXT,

    CONSTRAINT "TriggerAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trigger_workspaceId_enabled_event_idx" ON "Trigger"("workspaceId", "enabled", "event");

-- CreateIndex
CREATE INDEX "Trigger_sortOrder_idx" ON "Trigger"("sortOrder");

-- CreateIndex
CREATE INDEX "Trigger_updatedAt_idx" ON "Trigger"("updatedAt");

-- CreateIndex
CREATE INDEX "TriggerConditionGroup_triggerId_idx" ON "TriggerConditionGroup"("triggerId");

-- CreateIndex
CREATE INDEX "TriggerConditionGroup_parentId_idx" ON "TriggerConditionGroup"("parentId");

-- CreateIndex
CREATE INDEX "TriggerConditionGroup_sortOrder_idx" ON "TriggerConditionGroup"("sortOrder");

-- CreateIndex
CREATE INDEX "TriggerCondition_groupId_idx" ON "TriggerCondition"("groupId");

-- CreateIndex
CREATE INDEX "TriggerCondition_sortOrder_idx" ON "TriggerCondition"("sortOrder");

-- CreateIndex
CREATE INDEX "TriggerAction_triggerId_idx" ON "TriggerAction"("triggerId");

-- CreateIndex
CREATE INDEX "TriggerAction_sortOrder_idx" ON "TriggerAction"("sortOrder");

-- AddForeignKey
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerConditionGroup" ADD CONSTRAINT "TriggerConditionGroup_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerConditionGroup" ADD CONSTRAINT "TriggerConditionGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TriggerConditionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerCondition" ADD CONSTRAINT "TriggerCondition_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TriggerConditionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerAction" ADD CONSTRAINT "TriggerAction_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;
