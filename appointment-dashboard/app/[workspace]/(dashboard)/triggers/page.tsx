"use client";

import { useState } from "react";
import { Plus, Settings, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTriggers } from "@/hooks/useTriggers";
import { TriggersList } from "@/components/triggers/TriggersList";
import { TriggerStats } from "@/components/triggers/TriggerStats";
import { AddTriggerDialog } from "@/components/triggers/AddTriggerDialog";
import { EditTriggerDialog } from "@/components/triggers/EditTriggerDialog";
import { DeleteTriggerDialog } from "@/components/triggers/DeleteTriggerDialog";
import { TriggerExecutions } from "@/components/triggers/TriggerExecutions";
import type { Trigger } from "@/types/triggers";

export default function TriggersPage() {
  const {
    triggers,
    stats,
    loading,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    toggleTrigger,
    duplicateTrigger,
    testWebhookAction,
  } = useTriggers();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);

  const handleEditTrigger = (trigger: Trigger) => {
    setSelectedTrigger(trigger);
    setEditDialogOpen(true);
  };

  const handleDeleteTrigger = (trigger: Trigger) => {
    setSelectedTrigger(trigger);
    setDeleteDialogOpen(true);
  };

  const handleDuplicateTrigger = async (trigger: Trigger) => {
    await duplicateTrigger(trigger.id);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Triggers</h1>
          <p className="text-sm text-muted-foreground">
            Automate actions based on conversation conditions
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Trigger
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Triggers
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTriggers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Triggers
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTriggers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Executions
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="triggers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="executions">Execution Log</TabsTrigger>
        </TabsList>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Triggers</CardTitle>
              <CardDescription>
                Create and manage automated triggers for your conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TriggersList
                triggers={triggers}
                loading={loading}
                onEdit={handleEditTrigger}
                onDelete={handleDeleteTrigger}
                onToggle={toggleTrigger}
                onDuplicate={handleDuplicateTrigger}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <TriggerExecutions />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddTriggerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={createTrigger}
        onTestWebhook={testWebhookAction}
      />

      <EditTriggerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        trigger={selectedTrigger}
        onSubmit={updateTrigger}
        onTestWebhook={testWebhookAction}
      />

      <DeleteTriggerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        trigger={selectedTrigger}
        onConfirm={deleteTrigger}
      />
    </div>
  );
}
