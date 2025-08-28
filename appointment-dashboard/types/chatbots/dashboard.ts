import type React from "react"
export interface Chatbot {
  id: number
  name: string
  status: "active" | "inactive"
  messages: number
  performance: number
  lastActive: string
  description: string
}

export interface NavigationItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  url: string
  isActive?: boolean
}

export interface UsageMetric {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative"
  icon: React.ComponentType<{ className?: string }>
}

export interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
}
