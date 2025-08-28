// Message types for the chat system

export interface MessagesType {
  id: string
  content: string
  senderType: "visitor" | "agent" | "ai-agent" | "system"
  senderName?: string
  user?: {
    name?: string
  }
  createdAt?: Date
  deliveredAt?: Date
  readAt?: Date
  attachment?: {
    name: string
    type: string
    url: string
    size: number
  }
}

export interface MessageMetadata {
  currentUrl?: string
  previousUrl?: string
  changeType?: string
  timestamp?: Date
}

export interface MessageStatus {
  sent: boolean
  delivered: boolean
  read: boolean
  error?: string
}
