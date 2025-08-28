import type { Chatbot, UsageMetric } from "@/types/chatbot"

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.chatbuilder.com"

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new ApiError(response.status, `API Error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(500, "Network error occurred")
  }
}

// API functions
export const api = {
  // Chatbots
  getChatbots: (): Promise<Chatbot[]> => apiRequest("/chatbots"),

  createChatbot: (data: Omit<Chatbot, "id">): Promise<Chatbot> =>
    apiRequest("/chatbots", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateChatbot: (id: number, data: Partial<Chatbot>): Promise<Chatbot> =>
    apiRequest(`/chatbots/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteChatbot: (id: number): Promise<void> =>
    apiRequest(`/chatbots/${id}`, {
      method: "DELETE",
    }),

  // Usage metrics
  getUsageMetrics: (): Promise<UsageMetric[]> => apiRequest("/metrics"),

  // Search
  searchChatbots: (query: string): Promise<Chatbot[]> => apiRequest(`/chatbots/search?q=${encodeURIComponent(query)}`),
}

// Mock API for development
export const mockApi = {
  getChatbots: (): Promise<Chatbot[]> =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            name: "Customer Support Bot",
            status: "active",
            messages: 1247,
            performance: 94,
            lastActive: "2 minutes ago",
            description: "Handles customer inquiries and support tickets",
          },
          {
            id: 2,
            name: "Sales Assistant",
            status: "active",
            messages: 856,
            performance: 89,
            lastActive: "5 minutes ago",
            description: "Assists with product recommendations and sales",
          },
          {
            id: 3,
            name: "FAQ Bot",
            status: "inactive",
            messages: 432,
            performance: 76,
            lastActive: "2 hours ago",
            description: "Answers frequently asked questions",
          },
        ])
      }, 1000)
    }),

  getUsageMetrics: (): Promise<UsageMetric[]> =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            title: "Messages Sent",
            value: "2,769",
            change: "+12% from last month",
            changeType: "positive",
            icon: () => null,
          },
          {
            title: "Active Bots",
            value: "3",
            change: "+1 from last week",
            changeType: "positive",
            icon: () => null,
          },
          {
            title: "Knowledge Docs",
            value: "47",
            change: "+5 from last week",
            changeType: "positive",
            icon: () => null,
          },
          {
            title: "Avg. Performance",
            value: "91%",
            change: "+2% from last month",
            changeType: "positive",
            icon: () => null,
          },
        ])
      }, 800)
    }),

  deleteChatbot: (id: number): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(() => resolve(), 500)
    }),
}
