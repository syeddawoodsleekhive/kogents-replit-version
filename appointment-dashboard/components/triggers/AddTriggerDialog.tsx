"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import type {
  Trigger,
  TriggerCondition,
  TriggerAction,
  WebhookConfig,
} from "@/types/triggers";
import { TriggerConditionBuilder } from "./TriggerConditionBuilder";
import { TriggerActionBuilder } from "./TriggerActionBuilder";
import {
  validateTriggerCondition,
  validateTriggerAction,
} from "@/utils/triggerUtils";

interface AddTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    trigger: Omit<Trigger, "id" | "createdAt" | "updatedAt" | "triggerCount">
  ) => Promise<Trigger>;
  onTestWebhook?: (
    config: WebhookConfig
  ) => Promise<{ success: boolean; error?: string; responseTime: number }>;
}

export function AddTriggerDialog({
  open,
  onOpenChange,
  onSubmit,
  onTestWebhook,
}: AddTriggerDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    enabled: true,
    priority: 1,
  });

  const [conditions, setConditions] = useState<TriggerCondition[]>([
    {
      id: `condition-${Date.now()}`,
      field: "message_content" as const,
      operator: "contains" as const,
      value: "",
    },
  ]);

  const [actions, setActions] = useState<TriggerAction[]>([
    {
      id: `action-${Date.now()}`,
      type: "send_response" as const,
      value: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Trigger name is required";
    }

    conditions.forEach((condition, index) => {
      const error = validateTriggerCondition(condition);
      if (error) {
        newErrors[`condition-${index}`] = error;
      }
    });

    actions.forEach((action, index) => {
      const error = validateTriggerAction(action);
      if (error) {
        newErrors[`action-${index}`] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description || undefined,
        enabled: formData.enabled,
        conditions,
        actions,
        priority: formData.priority,
        workspaceId: "workspace-1", // This would come from context
        createdBy: "current-user", // This would come from auth context
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        enabled: true,
        priority: 1,
      });
      setConditions([
        {
          id: `condition-${Date.now()}`,
          field: "message_content",
          operator: "contains",
          value: "",
        },
      ]);
      setActions([
        {
          id: `action-${Date.now()}`,
          type: "send_response",
          value: "",
        },
      ]);
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setLoading(false);
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `condition-${Date.now()}`,
        field: "message_content",
        operator: "contains",
        value: "",
        logicalOperator: "AND",
      },
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<TriggerCondition>) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const addAction = () => {
    setActions([
      ...actions,
      {
        id: `action-${Date.now()}`,
        type: "send_response",
        value: "",
      },
    ]);
  };

  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  const updateAction = (id: string, updates: Partial<TriggerAction>) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Trigger</DialogTitle>
          <DialogDescription>
            Set up automated actions that will be executed when specific
            conditions are met.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Trigger Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter trigger name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this trigger does"
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Conditions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conditions</h3>
              <Button onClick={addCondition} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Condition
              </Button>
            </div>
            <div className="space-y-4">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="relative">
                  <TriggerConditionBuilder
                    condition={condition}
                    onChange={(updates) =>
                      updateCondition(condition.id, updates)
                    }
                    showLogicalOperator={index < conditions.length - 1}
                  />
                  {conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {errors[`condition-${index}`] && (
                    <p className="text-sm text-destructive mt-2">
                      {errors[`condition-${index}`]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Actions</h3>
              <Button onClick={addAction} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Action
              </Button>
            </div>
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div key={action.id} className="relative">
                  <TriggerActionBuilder
                    action={action}
                    onChange={(updates) => updateAction(action.id, updates)}
                    onTestWebhook={onTestWebhook}
                  />
                  {actions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeAction(action.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {errors[`action-${index}`] && (
                    <p className="text-sm text-destructive mt-2">
                      {errors[`action-${index}`]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Trigger"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
