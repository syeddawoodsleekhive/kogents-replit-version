import Axios from "@/lib/axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.autobotx.ai";

export const chatApi = {
  /**
   * Fetch chat history with pagination
   */
  getChatHistory: async (
    params: ChatHistoryParams
  ): Promise<ChatHistoryResponse> => {
    try {
      const response = await Axios.get(`${API_BASE_URL}/chat/history`, {
        params,
      });
      return response.data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        throw new Error(
          axiosError.response?.data?.message || "Failed to fetch chat history"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },

  /**
   * Search chat history
   */
  searchChatHistory: async (
    params: ChatSearchParams
  ): Promise<ChatHistoryResponse> => {
    try {
      const response = await Axios.get(`${API_BASE_URL}/chat/history/search`, {
        params,
      });
      return response.data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        throw new Error(
          axiosError.response?.data?.message || "Failed to search chat history"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },

  /**
   * Get chat room details by ID
   */
  getChatRoomDetails: async (
    roomId: string
  ): Promise<conversationSessionType> => {
    try {
      const response = await Axios.get(
        `${API_BASE_URL}/chat/history/room/${roomId}`
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        throw new Error(
          axiosError.response?.data?.message ||
            "Failed to fetch chat room details"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },
};
