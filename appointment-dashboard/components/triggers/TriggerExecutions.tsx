"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Webhook,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Mock execution data
const mockExecutions = [
  {
    id: "exec-1",
    triggerId: "1",
    triggerName: "Auto-assign billing inquiries",
    chatId: "chat-123",
    executedAt: new Date("2024-01-21T10:30:00"),
    success: true,
    actionsExecuted: ["assign_department", "add_tag"],
    webhookExecutions: [],
  },
  {
    id: "exec-2",
    triggerId: "4",
    triggerName: "CRM Integration Webhook",
    chatId: "chat-124",
    executedAt: new Date("2024-01-21T10:25:00"),
    success: true,
    actionsExecuted: ["webhook"],
    webhookExecutions: [
      {
        id: "webhook-1",
        triggerId: "4",
        actionId: "a6",
        url: "https://api.example-crm.com/webhooks/conversations",
        method: "POST",
        statusCode: 200,
        responseTime: 245,
        success: true,
        requestPayload:
          '{"customer_email":"john@example.com","conversation_id":"chat-124"}',
        responsePayload: '{"status":"success","id":"crm-123"}',
        executedAt: new Date("2024-01-21T10:25:01"),
      },
    ],
  },
  {
    id: "exec-3",
    triggerId: "2",
    triggerName: "VIP customer priority",
    chatId: "chat-125",
    executedAt: new Date("2024-01-21T09:45:00"),
    success: true,
    actionsExecuted: ["change_priority", "send_notification"],
    webhookExecutions: [],
  },
  {
    id: "exec-4",
    triggerId: "4",
    triggerName: "CRM Integration Webhook",
    chatId: "chat-126",
    executedAt: new Date("2024-01-21T09:30:00"),
    success: false,
    error: "Webhook timeout after 30 seconds",
    actionsExecuted: [],
    webhookExecutions: [
      {
        id: "webhook-2",
        triggerId: "4",
        actionId: "a6",
        url: "https://api.example-crm.com/webhooks/conversations",
        method: "POST",
        statusCode: 0,
        responseTime: 30000,
        success: false,
        error: "Request timeout",
        requestPayload:
          '{"customer_email":"jane@example.com","conversation_id":"chat-126"}',
        executedAt: new Date("2024-01-21T09:30:01"),
      },
    ],
  },
];

export function TriggerExecutions() {
  const [executions] = useState(mockExecutions);
  const [filteredExecutions, setFilteredExecutions] = useState(mockExecutions);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "success" | "failed"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "webhook" | "standard">(
    "all"
  );

  // Filter executions based on search and filters
  const applyFilters = () => {
    let filtered = executions;

    if (searchTerm) {
      filtered = filtered.filter(
        (exec) =>
          exec.triggerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exec.chatId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((exec) =>
        statusFilter === "success" ? exec.success : !exec.success
      );
    }

    if (typeFilter !== "all") {
      if (typeFilter === "webhook") {
        filtered = filtered.filter(
          (exec) => exec.webhookExecutions && exec.webhookExecutions.length > 0
        );
      } else {
        filtered = filtered.filter(
          (exec) =>
            !exec.webhookExecutions || exec.webhookExecutions.length === 0
        );
      }
    }

    setFilteredExecutions(filtered);
  };

  // Apply filters when dependencies change
  useState(() => {
    applyFilters();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution Log</CardTitle>
        <CardDescription>
          View detailed logs of trigger executions and webhook calls
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by trigger name or chat ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  applyFilters();
                }}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | "success" | "failed") => {
              setStatusFilter(value);
              applyFilters();
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(value: "all" | "webhook" | "standard") => {
              setTypeFilter(value);
              applyFilters();
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Executions Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trigger</TableHead>
                <TableHead>Chat ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Executed</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExecutions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{execution.triggerName}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {execution.triggerId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {execution.chatId}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {execution.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <Badge
                        variant={execution.success ? "default" : "destructive"}
                      >
                        {execution.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {execution.actionsExecuted.map((action) => (
                        <Badge
                          key={action}
                          variant="secondary"
                          className="text-xs"
                        >
                          {action === "webhook" && (
                            <Webhook className="mr-1 h-3 w-3" />
                          )}
                          {action.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(execution.executedAt, {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {execution.error && (
                        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          {execution.error}
                        </div>
                      )}
                      {execution.webhookExecutions?.map((webhook) => (
                        <div key={webhook.id} className="text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {webhook.method}
                            </Badge>
                            <span className="text-muted-foreground">
                              {webhook.statusCode} • {webhook.responseTime}ms
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="text-muted-foreground truncate max-w-48">
                            {new URL(webhook.url).hostname}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredExecutions.length === 0 && (
          <div className="text-center py-8">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No executions found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "Trigger executions will appear here once triggers start running."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
