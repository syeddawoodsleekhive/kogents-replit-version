-- CreateTable
CREATE TABLE "TriggerExecutionLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "departmentId" TEXT,
    "triggerId" TEXT NOT NULL,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "totalSuccesses" INTEGER NOT NULL DEFAULT 0,
    "totalFailures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastTriggeredAt" TIMESTAMP(3),

    CONSTRAINT "TriggerExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TriggerExecutionLog_triggerId_idx" ON "TriggerExecutionLog"("triggerId");

-- CreateIndex
CREATE INDEX "TriggerExecutionLog_departmentId_idx" ON "TriggerExecutionLog"("departmentId");

-- CreateIndex
CREATE INDEX "TriggerExecutionLog_workspaceId_idx" ON "TriggerExecutionLog"("workspaceId");

-- AddForeignKey
ALTER TABLE "TriggerExecutionLog" ADD CONSTRAINT "TriggerExecutionLog_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerExecutionLog" ADD CONSTRAINT "TriggerExecutionLog_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
