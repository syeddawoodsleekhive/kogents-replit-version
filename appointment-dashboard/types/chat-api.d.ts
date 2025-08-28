interface ChatHistoryParams {
  page: number;
  limit: number;
}

interface ChatHistoryResponse {
  chatHistory: ChatHistorySummaryType[];
  total: number;
  page: number;
  limit: number;
}

interface ChatSearchParams {
  query: string;
  page: number;
  limit: number;
}

// Type for the summary chat history (used in /history and /search endpoints)
interface ChatHistorySummaryType {
  id: string;
  visitorId: string;
  visitorName: string | null;
  visitorEmail: string | null;
  totalMessages: number;
  lastMessage: MessageType;
  agentsInRoom: AgentInRoomType[];
  createdAt: string;
}
