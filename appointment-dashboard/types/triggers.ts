export interface TriggerCondition {
  id: string
  field:
    | "message_content"
    | "customer_email"
    | "wait_time"
    | "department"
    | "tags"
    | "agent_status"
    | "time_of_day"
    | "customer_visits"
  operator:
    | "contains"
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty"
  value: string | number
  logicalOperator?: "AND" | "OR"
}

export interface WebhookConfig {
  url: string
  method: "POST" | "PUT" | "PATCH"
  headers: Record<string, string>
  payloadTemplate: string
  timeout: number
  retryAttempts: number
  authentication?: {
    type: "none" | "bearer" | "basic" | "api_key"
    token?: string
    username?: string
    password?: string
    apiKey?: string
    apiKeyHeader?: string
  }
}

export interface TriggerAction {
  id: string
  type:
    | "send_response"
    | "assign_agent"
    | "assign_department"
    | "add_tag"
    | "remove_tag"
    | "change_priority"
    | "send_notification"
    | "close_conversation"
    | "escalate"
    | "webhook"
  value: string
  delay?: number // in seconds
  metadata?: Record<string, any>
  webhookConfig?: WebhookConfig
}

export interface Trigger {
  id: string
  name: string
  description?: string
  enabled: boolean
  conditions: TriggerCondition[]
  actions: TriggerAction[]
  priority: number
  workspaceId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  lastTriggered?: Date
  triggerCount: number
}

export interface WebhookExecution {
  id: string
  triggerId: string
  actionId: string
  url: string
  method: string
  statusCode: number
  responseTime: number
  success: boolean
  error?: string
  requestPayload: string
  responsePayload?: string
  executedAt: Date
}

export interface TriggerExecution {
  id: string
  triggerId: string
  chatId: string
  executedAt: Date
  success: boolean
  error?: string
  actionsExecuted: string[]
  webhookExecutions?: WebhookExecution[]
}

export interface TriggerStats {
  totalTriggers: number
  activeTriggers: number
  totalExecutions: number
  successRate: number
  webhookExecutions: number
  webhookSuccessRate: number
  topTriggers: Array<{
    id: string
    name: string
    executions: number
  }>
}

export type TriggerFieldType = "text" | "number" | "select" | "multiselect" | "boolean" | "datetime"

export interface TriggerFieldDefinition {
  field: string
  label: string
  type: TriggerFieldType
  operators: string[]
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  description?: string
}
