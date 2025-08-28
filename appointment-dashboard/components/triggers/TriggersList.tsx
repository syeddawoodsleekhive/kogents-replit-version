"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Zap,
  Clock,
  ExternalLink,
  Webhook,
} from "lucide-react";
import type { Trigger } from "@/types/triggers";
import { formatDistanceToNow } from "date-fns";

interface TriggersListProps {
  triggers: Trigger[];
  loading: boolean;
  onEdit: (trigger: Trigger) => void;
  onDelete: (trigger: Trigger) => void;
  onToggle: (id: string) => void;
  onDuplicate: (trigger: Trigger) => void;
}

export function TriggersList({
  triggers,
  loading,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
}: TriggersListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (triggers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No triggers found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first trigger to automate actions based on conversation
            conditions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "webhook":
        return <Webhook className="h-3 w-3" />;
      case "send_response":
        return <span className="text-xs">💬</span>;
      case "assign_agent":
        return <span className="text-xs">👤</span>;
      case "assign_department":
        return <span className="text-xs">🏢</span>;
      case "add_tag":
        return <span className="text-xs">🏷️</span>;
      case "change_priority":
        return <span className="text-xs">⚡</span>;
      case "send_notification":
        return <span className="text-xs">📧</span>;
      default:
        return <span className="text-xs">⚙️</span>;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case "webhook":
        return "Webhook";
      case "send_response":
        return "Send Response";
      case "assign_agent":
        return "Assign Agent";
      case "assign_department":
        return "Assign Department";
      case "add_tag":
        return "Add Tag";
      case "remove_tag":
        return "Remove Tag";
      case "change_priority":
        return "Change Priority";
      case "send_notification":
        return "Send Notification";
      case "close_conversation":
        return "Close Conversation";
      case "escalate":
        return "Escalate";
      default:
        return actionType;
    }
  };

  return (
    <div className="space-y-4">
      {triggers.map((trigger) => (
        <Card key={trigger.id} className={trigger.enabled ? "" : "opacity-60"}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{trigger.name}</CardTitle>
                  <Badge variant={trigger.enabled ? "default" : "secondary"}>
                    {trigger.enabled ? "Active" : "Inactive"}
                  </Badge>
                  {trigger.actions.some(
                    (action) => action.type === "webhook"
                  ) && (
                    <Badge variant="outline" className="text-xs">
                      <Webhook className="mr-1 h-3 w-3" />
                      Webhook
                    </Badge>
                  )}
                </div>
                {trigger.description && (
                  <CardDescription>{trigger.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={trigger.enabled}
                  onCheckedChange={() => onToggle(trigger.id)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(trigger)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(trigger)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(trigger)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Conditions */}
              <div>
                <h4 className="text-sm font-medium mb-2">Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {trigger.conditions.map((condition, index) => (
                    <div key={condition.id} className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {condition.field} {condition.operator} {condition.value}
                      </Badge>
                      {index < trigger.conditions.length - 1 &&
                        condition.logicalOperator && (
                          <span className="text-xs text-muted-foreground font-medium">
                            {condition.logicalOperator}
                          </span>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="text-sm font-medium mb-2">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {trigger.actions.map((action) => (
                    <div key={action.id} className="flex items-center gap-1">
                      <Badge
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        {getActionIcon(action.type)}
                        {getActionLabel(action.type)}
                      </Badge>
                      {action.type === "webhook" &&
                        action.webhookConfig?.url && (
                          <Badge variant="outline" className="text-xs">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            {new URL(action.webhookConfig.url).hostname}
                          </Badge>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{trigger.triggerCount} executions</span>
                </div>
                {trigger.lastTriggered && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Last triggered{" "}
                      {formatDistanceToNow(trigger.lastTriggered, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>Priority: {trigger.priority}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
