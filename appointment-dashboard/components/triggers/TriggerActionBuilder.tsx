"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, ExternalLink } from "lucide-react";
import type { TriggerAction, WebhookConfig } from "@/types/triggers";
import { triggerActions } from "@/utils/triggerUtils";
import { WebhookConfigDialog } from "./WebhookConfigDialog";

interface TriggerActionBuilderProps {
  action: TriggerAction;
  onChange: (updates: Partial<TriggerAction>) => void;
  onTestWebhook?: (
    config: WebhookConfig
  ) => Promise<{ success: boolean; error?: string; responseTime: number }>;
}

export function TriggerActionBuilder({
  action,
  onChange,
  onTestWebhook,
}: TriggerActionBuilderProps) {
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const actionDef = triggerActions.find((a) => a.type === action.type);

  const handleWebhookConfigSave = (config: WebhookConfig) => {
    onChange({
      webhookConfig: config,
      value: `${config.method} ${config.url}`,
    });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action Type Selection */}
          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select
              value={action.type}
              onValueChange={(value) =>
                onChange({
                  type: value as any,
                  value: "",
                  webhookConfig:
                    value === "webhook"
                      ? {
                          url: "",
                          method: "POST",
                          headers: {},
                          payloadTemplate: "",
                          timeout: 30,
                          retryAttempts: 3,
                        }
                      : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerActions.map((actionType) => (
                  <SelectItem key={actionType.type} value={actionType.type}>
                    {actionType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {actionDef?.description && (
              <p className="text-xs text-muted-foreground">
                {actionDef.description}
              </p>
            )}
          </div>

          {/* Value Input */}
          {actionDef?.requiresValue && action.type !== "webhook" && (
            <div className="space-y-2">
              <Label>{actionDef.valueLabel || "Value"}</Label>
              {actionDef.valueType === "select" && actionDef.options ? (
                <Select
                  value={action.value?.toString()}
                  onValueChange={(value) => onChange({ value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionDef.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : actionDef.type === "send_response" ? (
                <Select
                  value={action.value?.toString()}
                  onValueChange={(value) => onChange({ value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select canned response" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Message</SelectItem>
                    <SelectItem value="wait">Please Wait</SelectItem>
                    <SelectItem value="billing">Billing Inquiry</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                  </SelectContent>
                </Select>
              ) : actionDef.type === "assign_agent" ? (
                <Select
                  value={action.value?.toString()}
                  onValueChange={(value) => onChange({ value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent1">John Doe</SelectItem>
                    <SelectItem value="agent2">Jane Smith</SelectItem>
                    <SelectItem value="agent3">Mike Johnson</SelectItem>
                  </SelectContent>
                </Select>
              ) : actionDef.type === "assign_department" ? (
                <Select
                  value={action.value?.toString()}
                  onValueChange={(value) => onChange({ value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={action.value?.toString() || ""}
                  onChange={(e) => onChange({ value: e.target.value })}
                  placeholder={actionDef.valueLabel || "Enter value"}
                />
              )}
            </div>
          )}

          {/* Webhook Configuration */}
          {action.type === "webhook" && (
            <div className="space-y-2">
              <Label>Webhook Configuration</Label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setWebhookDialogOpen(true)}
                  className="w-full justify-start"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {action.webhookConfig?.url
                    ? "Edit Configuration"
                    : "Configure Webhook"}
                </Button>

                {action.webhookConfig?.url && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {action.webhookConfig.method}
                      </Badge>
                      <span className="text-sm text-muted-foreground truncate">
                        {action.webhookConfig.url}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {action.webhookConfig.authentication?.type !== "none" && (
                      <Badge variant="secondary" className="text-xs">
                        Auth: {action.webhookConfig.authentication?.type}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delay Option */}
        <div className="space-y-2">
          <Label>Delay (seconds)</Label>
          <Input
            type="number"
            value={action.delay || ""}
            onChange={(e) =>
              onChange({
                delay: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="0"
            min="0"
            max="3600"
          />
          <p className="text-xs text-muted-foreground">
            Optional delay before executing this action (0-3600 seconds)
          </p>
        </div>

        {/* Webhook Configuration Dialog */}
        <WebhookConfigDialog
          open={webhookDialogOpen}
          onOpenChange={setWebhookDialogOpen}
          config={action.webhookConfig || null}
          onSave={handleWebhookConfigSave}
          onTest={onTestWebhook}
        />
      </CardContent>
    </Card>
  );
}
