"use client"

import { useState, useEffect, useCallback } from "react"
import type { Trigger, TriggerStats, TriggerExecution, WebhookConfig } from "@/types/triggers"
import { useToast } from "@/hooks/use-toast"
import { testWebhook } from "@/utils/triggerUtils"

// Mock data for development
const mockTriggers: Trigger[] = [
  {
    id: "1",
    name: "Auto-assign billing inquiries",
    description: "Automatically assign conversations containing billing keywords to billing team",
    enabled: true,
    conditions: [
      {
        id: "c1",
        field: "message_content",
        operator: "contains",
        value: "billing,invoice,payment,refund",
        logicalOperator: "AND",
      },
    ],
    actions: [
      {
        id: "a1",
        type: "assign_department",
        value: "billing",
      },
      {
        id: "a2",
        type: "add_tag",
        value: "billing-inquiry",
      },
    ],
    priority: 1,
    workspaceId: "workspace-1",
    createdBy: "user-1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    lastTriggered: new Date("2024-01-20"),
    triggerCount: 45,
  },
  {
    id: "2",
    name: "VIP customer priority",
    description: "Escalate conversations from VIP customers",
    enabled: true,
    conditions: [
      {
        id: "c2",
        field: "tags",
        operator: "contains",
        value: "vip",
      },
    ],
    actions: [
      {
        id: "a3",
        type: "change_priority",
        value: "high",
      },
      {
        id: "a4",
        type: "send_notification",
        value: "manager@company.com",
      },
    ],
    priority: 2,
    workspaceId: "workspace-1",
    createdBy: "user-1",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    lastTriggered: new Date("2024-01-19"),
    triggerCount: 12,
  },
  {
    id: "3",
    name: "Long wait time response",
    description: "Send automated response when customer waits too long",
    enabled: false,
    conditions: [
      {
        id: "c3",
        field: "wait_time",
        operator: "greater_than",
        value: 300, // 5 minutes
      },
    ],
    actions: [
      {
        id: "a5",
        type: "send_response",
        value: "Thanks for your patience! An agent will be with you shortly.",
      },
    ],
    priority: 3,
    workspaceId: "workspace-1",
    createdBy: "user-1",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-18"),
    triggerCount: 0,
  },
  {
    id: "4",
    name: "CRM Integration Webhook",
    description: "Send customer data to CRM when conversation starts",
    enabled: true,
    conditions: [
      {
        id: "c4",
        field: "customer_visits",
        operator: "equals",
        value: 1,
      },
    ],
    actions: [
      {
        id: "a6",
        type: "webhook",
        value: "CRM Integration",
        webhookConfig: {
          url: "https://api.example-crm.com/webhooks/conversations",
          method: "POST",
          headers: {
            "X-API-Version": "v1",
          },
          payloadTemplate: `{
            "customer_email": "{{customer.email}}",
            "conversation_id": "{{conversation.id}}",
            "source": "chat_widget"
          }`,
          timeout: 30,
          retryAttempts: 3,
          authentication: {
            type: "bearer",
            token: "your-api-token-here",
          },
        },
      },
    ],
    priority: 4,
    workspaceId: "workspace-1",
    createdBy: "user-1",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
    lastTriggered: new Date("2024-01-21"),
    triggerCount: 23,
  },
]

const mockStats: TriggerStats = {
  totalTriggers: 4,
  activeTriggers: 3,
  totalExecutions: 80,
  successRate: 97.5,
  webhookExecutions: 23,
  webhookSuccessRate: 95.7,
  topTriggers: [
    { id: "1", name: "Auto-assign billing inquiries", executions: 45 },
    { id: "4", name: "CRM Integration Webhook", executions: 23 },
    { id: "2", name: "VIP customer priority", executions: 12 },
  ],
}

export function useTriggers() {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [stats, setStats] = useState<TriggerStats | null>(null)
  const [executions, setExecutions] = useState<TriggerExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load triggers
  const loadTriggers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setTriggers(mockTriggers)
      setStats(mockStats)
    } catch (err) {
      setError("Failed to load triggers")
      toast({
        title: "Error",
        description: "Failed to load triggers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Create trigger
  const createTrigger = useCallback(
    async (triggerData: Omit<Trigger, "id" | "createdAt" | "updatedAt" | "triggerCount">) => {
      try {
        setLoading(true)

        const newTrigger: Trigger = {
          ...triggerData,
          id: `trigger-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          triggerCount: 0,
        }

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        setTriggers((prev) => [...prev, newTrigger])

        toast({
          title: "Success",
          description: "Trigger created successfully",
        })

        return newTrigger
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to create trigger",
          variant: "destructive",
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  // Update trigger
  const updateTrigger = useCallback(
    async (id: string, updates: Partial<Trigger>) => {
      try {
        setLoading(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        setTriggers((prev) =>
          prev.map((trigger) => (trigger.id === id ? { ...trigger, ...updates, updatedAt: new Date() } : trigger)),
        )

        toast({
          title: "Success",
          description: "Trigger updated successfully",
        })
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to update trigger",
          variant: "destructive",
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  // Delete trigger
  const deleteTrigger = useCallback(
    async (id: string) => {
      try {
        setLoading(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        setTriggers((prev) => prev.filter((trigger) => trigger.id !== id))

        toast({
          title: "Success",
          description: "Trigger deleted successfully",
        })
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to delete trigger",
          variant: "destructive",
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  // Toggle trigger enabled state
  const toggleTrigger = useCallback(
    async (id: string) => {
      const trigger = triggers.find((t) => t.id === id)
      if (!trigger) return

      await updateTrigger(id, { enabled: !trigger.enabled })
    },
    [triggers, updateTrigger],
  )

  // Duplicate trigger
  const duplicateTrigger = useCallback(
    async (id: string) => {
      const trigger = triggers.find((t) => t.id === id)
      if (!trigger) return

      const duplicatedTrigger = {
        ...trigger,
        name: `${trigger.name} (Copy)`,
        enabled: false,
      }

      delete (duplicatedTrigger as any).id
      delete (duplicatedTrigger as any).createdAt
      delete (duplicatedTrigger as any).updatedAt
      delete (duplicatedTrigger as any).triggerCount

      return await createTrigger(duplicatedTrigger)
    },
    [triggers, createTrigger],
  )

  // Test webhook
  const testWebhookAction = useCallback(
    async (webhookConfig: WebhookConfig) => {
      try {
        const testPayload = {
          trigger: { id: "test", name: "Test Trigger" },
          conversation: { id: "test-conv", wait_time: 120, priority: "normal", department: "support" },
          customer: { email: "test@example.com", name: "Test Customer", tags: ["test"] },
          message: { content: "Test message", timestamp: new Date().toISOString() },
          agent: { id: "test-agent", name: "Test Agent", department: "support" },
        }

        const result = await testWebhook(webhookConfig, testPayload)

        if (result.success) {
          toast({
            title: "Webhook Test Successful",
            description: `Response received in ${result.responseTime}ms`,
          })
        } else {
          toast({
            title: "Webhook Test Failed",
            description: result.error,
            variant: "destructive",
          })
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error"
        toast({
          title: "Webhook Test Failed",
          description: error,
          variant: "destructive",
        })
        return { success: false, error, responseTime: 0 }
      }
    },
    [toast],
  )

  useEffect(() => {
    loadTriggers()
  }, [loadTriggers])

  return {
    triggers,
    stats,
    executions,
    loading,
    error,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    toggleTrigger,
    duplicateTrigger,
    testWebhookAction,
    refetch: loadTriggers,
  }
}
