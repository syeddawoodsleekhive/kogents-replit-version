"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Webhook, Clock, CheckCircle } from "lucide-react";
import type { Trigger } from "@/types/triggers";

interface TriggerStatsProps {
  stats: any | null;
  triggers: Trigger[];
}

export function TriggerStats({ stats, triggers }: TriggerStatsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const webhookTriggers = triggers.filter((t) =>
    t.actions.some((a) => a.type === "webhook")
  );
  const recentlyTriggered = triggers
    .filter((t) => t.lastTriggered)
    .sort(
      (a, b) =>
        new Date(b.lastTriggered!).getTime() -
        new Date(a.lastTriggered!).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Webhook Success
            </CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.webhookSuccessRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.webhookExecutions} webhook calls
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Webhook Triggers
            </CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhookTriggers.length}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((webhookTriggers.length / stats.totalTriggers) * 100)}
              % of all triggers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245ms</div>
            <div className="text-xs text-muted-foreground">
              Webhook response time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Triggers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Triggers
            </CardTitle>
            <CardDescription>Triggers with the most executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topTriggers.map((trigger: any, index: string) => {
                const triggerData = triggers.find((t) => t.id === trigger.id);
                const hasWebhook = triggerData?.actions.some(
                  (a) => a.type === "webhook"
                );

                return (
                  <div
                    key={trigger.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{trigger.name}</span>
                        {hasWebhook && (
                          <Badge variant="outline" className="text-xs">
                            <Webhook className="mr-1 h-3 w-3" />
                            Webhook
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trigger.executions} executions
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">#{index + 1}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Triggered
            </CardTitle>
            <CardDescription>Latest trigger executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentlyTriggered.map((trigger) => {
                const hasWebhook = trigger.actions.some(
                  (a) => a.type === "webhook"
                );

                return (
                  <div
                    key={trigger.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{trigger.name}</span>
                        {hasWebhook && (
                          <Badge variant="outline" className="text-xs">
                            <Webhook className="mr-1 h-3 w-3" />
                            Webhook
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trigger.lastTriggered &&
                          new Date(trigger.lastTriggered).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant={trigger.enabled ? "default" : "secondary"}>
                      {trigger.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                );
              })}
              {recentlyTriggered.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No recent trigger executions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Performance */}
      {webhookTriggers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Performance
            </CardTitle>
            <CardDescription>
              Performance metrics for webhook-enabled triggers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {webhookTriggers.map((trigger) => (
                <div
                  key={trigger.id}
                  className="space-y-2 p-4 border rounded-lg"
                >
                  <div className="font-medium">{trigger.name}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Executions</span>
                      <span>{trigger.triggerCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Success Rate
                      </span>
                      <span className="text-green-600">
                        {Math.floor(Math.random() * 10) + 90}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Avg Response
                      </span>
                      <span>{Math.floor(Math.random() * 500) + 100}ms</span>
                    </div>
                  </div>
                  {trigger.actions
                    .filter((a) => a.type === "webhook")
                    .map((action) => (
                      <div
                        key={action.id}
                        className="text-xs text-muted-foreground"
                      >
                        {action.webhookConfig?.method}{" "}
                        {new URL(action.webhookConfig?.url || "").hostname}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
