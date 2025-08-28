import type { TriggerFieldDefinition, WebhookConfig } from "@/types/triggers"

export const triggerFields: TriggerFieldDefinition[] = [
  {
    field: "message_content",
    label: "Message Content",
    type: "text",
    operators: ["contains", "not_equals", "starts_with", "ends_with", "is_empty", "is_not_empty"],
    placeholder: "Enter keywords separated by commas",
    description: "Match against the content of customer messages",
  },
  {
    field: "customer_email",
    label: "Customer Email",
    type: "text",
    operators: ["equals", "not_equals", "contains", "ends_with"],
    placeholder: "customer@example.com",
    description: "Match against customer email address",
  },
  {
    field: "wait_time",
    label: "Wait Time (seconds)",
    type: "number",
    operators: ["greater_than", "less_than", "equals"],
    placeholder: "300",
    description: "Time customer has been waiting for response",
  },
  {
    field: "department",
    label: "Department",
    type: "select",
    operators: ["equals", "not_equals"],
    options: [
      { value: "support", label: "Support" },
      { value: "billing", label: "Billing" },
      { value: "sales", label: "Sales" },
      { value: "technical", label: "Technical" },
    ],
    description: "Current department assignment",
  },
  {
    field: "tags",
    label: "Tags",
    type: "text",
    operators: ["contains", "not_equals"],
    placeholder: "vip,priority,urgent",
    description: "Customer or conversation tags",
  },
  {
    field: "agent_status",
    label: "Agent Status",
    type: "select",
    operators: ["equals", "not_equals"],
    options: [
      { value: "online", label: "Online" },
      { value: "away", label: "Away" },
      { value: "offline", label: "Offline" },
      { value: "busy", label: "Busy" },
    ],
    description: "Current agent availability status",
  },
  {
    field: "time_of_day",
    label: "Time of Day",
    type: "select",
    operators: ["equals", "not_equals"],
    options: [
      { value: "business_hours", label: "Business Hours" },
      { value: "after_hours", label: "After Hours" },
      { value: "weekend", label: "Weekend" },
    ],
    description: "Time when the conversation occurs",
  },
  {
    field: "customer_visits",
    label: "Customer Visit Count",
    type: "number",
    operators: ["equals", "greater_than", "less_than"],
    placeholder: "1",
    description: "Number of times customer has visited",
  },
]

export const triggerActions = [
  {
    type: "send_response",
    label: "Send Canned Response",
    description: "Automatically send a predefined response",
    requiresValue: true,
    valueType: "select" as const,
    valueLabel: "Select Response",
  },
  {
    type: "assign_agent",
    label: "Assign to Agent",
    description: "Assign conversation to specific agent",
    requiresValue: true,
    valueType: "select" as const,
    valueLabel: "Select Agent",
  },
  {
    type: "assign_department",
    label: "Assign to Department",
    description: "Assign conversation to department",
    requiresValue: true,
    valueType: "select" as const,
    valueLabel: "Select Department",
  },
  {
    type: "add_tag",
    label: "Add Tag",
    description: "Add tag to conversation",
    requiresValue: true,
    valueType: "text" as const,
    valueLabel: "Tag Name",
  },
  {
    type: "remove_tag",
    label: "Remove Tag",
    description: "Remove tag from conversation",
    requiresValue: true,
    valueType: "text" as const,
    valueLabel: "Tag Name",
  },
  {
    type: "change_priority",
    label: "Change Priority",
    description: "Change conversation priority",
    requiresValue: true,
    valueType: "select" as const,
    valueLabel: "Priority Level",
    options: [
      { value: "low", label: "Low" },
      { value: "normal", label: "Normal" },
      { value: "high", label: "High" },
      { value: "urgent", label: "Urgent" },
    ],
  },
  {
    type: "send_notification",
    label: "Send Notification",
    description: "Send email notification",
    requiresValue: true,
    valueType: "text" as const,
    valueLabel: "Email Address",
  },
  {
    type: "close_conversation",
    label: "Close Conversation",
    description: "Automatically close the conversation",
    requiresValue: false,
  },
  {
    type: "escalate",
    label: "Escalate to Supervisor",
    description: "Escalate conversation to supervisor",
    requiresValue: false,
  },
  {
    type: "webhook",
    label: "Send Webhook",
    description: "Send data to external webhook URL",
    requiresValue: true,
    valueType: "webhook" as const,
    valueLabel: "Webhook Configuration",
  },
]

export const operatorLabels: Record<string, string> = {
  contains: "Contains",
  equals: "Equals",
  not_equals: "Does not equal",
  greater_than: "Greater than",
  less_than: "Less than",
  starts_with: "Starts with",
  ends_with: "Ends with",
  is_empty: "Is empty",
  is_not_empty: "Is not empty",
}

export const defaultWebhookPayload = `{
  "trigger_id": "{{trigger.id}}",
  "trigger_name": "{{trigger.name}}",
  "conversation_id": "{{conversation.id}}",
  "customer": {
    "email": "{{customer.email}}",
    "name": "{{customer.name}}",
    "tags": {{customer.tags}}
  },
  "message": {
    "content": "{{message.content}}",
    "timestamp": "{{message.timestamp}}"
  },
  "agent": {
    "id": "{{agent.id}}",
    "name": "{{agent.name}}",
    "department": "{{agent.department}}"
  },
  "metadata": {
    "wait_time": {{conversation.wait_time}},
    "priority": "{{conversation.priority}}",
    "department": "{{conversation.department}}"
  }
}`

export function validateTriggerCondition(condition: any): string | null {
  if (!condition.field) return "Field is required"
  if (!condition.operator) return "Operator is required"
  if (!condition.value && condition.operator !== "is_empty" && condition.operator !== "is_not_empty") {
    return "Value is required"
  }
  return null
}

export function validateTriggerAction(action: any): string | null {
  if (!action.type) return "Action type is required"

  const actionDef = triggerActions.find((a) => a.type === action.type)
  if (actionDef?.requiresValue && !action.value && action.type !== "webhook") {
    return "Value is required for this action"
  }

  if (action.type === "webhook") {
    return validateWebhookConfig(action.webhookConfig)
  }

  return null
}

export function validateWebhookConfig(config: WebhookConfig | undefined): string | null {
  if (!config) return "Webhook configuration is required"

  if (!config.url) return "Webhook URL is required"

  try {
    new URL(config.url)
  } catch {
    return "Invalid webhook URL format"
  }

  if (!config.method) return "HTTP method is required"

  if (config.timeout && (config.timeout < 1 || config.timeout > 60)) {
    return "Timeout must be between 1 and 60 seconds"
  }

  if (config.retryAttempts && (config.retryAttempts < 0 || config.retryAttempts > 5)) {
    return "Retry attempts must be between 0 and 5"
  }

  if (config.authentication?.type === "bearer" && !config.authentication.token) {
    return "Bearer token is required"
  }

  if (config.authentication?.type === "basic" && (!config.authentication.username || !config.authentication.password)) {
    return "Username and password are required for basic auth"
  }

  if (
    config.authentication?.type === "api_key" &&
    (!config.authentication.apiKey || !config.authentication.apiKeyHeader)
  ) {
    return "API key and header name are required"
  }

  return null
}

export function testWebhook(
  config: WebhookConfig,
  testPayload: any,
): Promise<{ success: boolean; error?: string; responseTime: number }> {
  return new Promise(async (resolve) => {
    const startTime = Date.now()

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...config.headers,
      }

      // Add authentication headers
      if (config.authentication) {
        switch (config.authentication.type) {
          case "bearer":
            headers.Authorization = `Bearer ${config.authentication.token}`
            break
          case "basic":
            const credentials = btoa(`${config.authentication.username}:${config.authentication.password}`)
            headers.Authorization = `Basic ${credentials}`
            break
          case "api_key":
            headers[config.authentication.apiKeyHeader!] = config.authentication.apiKey!
            break
        }
      }

      const response = await fetch(config.url, {
        method: config.method,
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout((config.timeout || 30) * 1000),
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        resolve({ success: true, responseTime })
      } else {
        resolve({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
        })
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      resolve({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      })
    }
  })
}

export function interpolatePayload(template: string, data: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path.trim())
    return value !== undefined ? JSON.stringify(value) : match
  })
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}
