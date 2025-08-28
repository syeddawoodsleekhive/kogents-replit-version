"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockApi } from "@/lib/chatbots/api";
import type { Chatbot } from "@/types/chatbot";

// Optimized version of useDashboard with better memoization
export function useOptimizedDashboard() {
  const queryClient = useQueryClient();

  // Memoized query options to prevent unnecessary re-renders
  const chatbotsQueryOptions = useMemo(
    () => ({
      queryKey: ["chatbots"] as const,
      queryFn: mockApi.getChatbots,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      retryDelay: 1000,
      select: (data: Chatbot[]) => data, // Identity function, but allows for future transformations
    }),
    []
  );

  const metricsQueryOptions = useMemo(
    () => ({
      queryKey: ["usage-metrics"] as const,
      queryFn: mockApi.getUsageMetrics,
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      retryDelay: 1000,
    }),
    []
  );

  // Fetch chatbots with optimized options
  const {
    data: chatbots = [],
    isLoading: isLoadingChatbots,
    error: chatbotsError,
  } = useQuery(chatbotsQueryOptions);

  // Fetch usage metrics with optimized options
  const {
    data: usageMetrics = [],
    isLoading: isLoadingMetrics,
    error: metricsError,
  } = useQuery(metricsQueryOptions);

  // Memoized mutation options
  const deleteChatbotMutation = useMutation({
    mutationFn: mockApi.deleteChatbot,
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
    }, [queryClient]),
    onError: useCallback((error: Error) => {
      console.error("Failed to delete chatbot:", error);
    }, []),
  });

  // Memoized action handlers to prevent unnecessary re-renders
  const handleCreateChatbot = useCallback(() => {
    console.log("Creating new chatbot...");
    // Navigate to create page
    window.location.href = "/chatbots/create";
  }, []);

  const handleUploadKnowledge = useCallback(() => {
    console.log("Uploading knowledge...");
    // Navigate to knowledge page
    window.location.href = "/knowledge";
  }, []);

  const handleViewAnalytics = useCallback(() => {
    console.log("Viewing analytics...");
    // Navigate to analytics page
    window.location.href = "/analytics";
  }, []);

  const handleEditChatbot = useCallback((id: number) => {
    console.log(`Editing chatbot ${id}`);
    // Navigate to edit page
    window.location.href = `/chatbots/${id}/edit`;
  }, []);

  const handleDeleteChatbot = useCallback(
    (id: number) => {
      deleteChatbotMutation.mutate(id);
    },
    [deleteChatbotMutation]
  );

  // Memoized search functionality
  const createFilteredChatbots = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return chatbots;

      const query = searchQuery.toLowerCase();
      return chatbots.filter(
        (bot) =>
          bot.name.toLowerCase().includes(query) ||
          bot.description?.toLowerCase().includes(query)
      );
    },
    [chatbots]
  );

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Data
      chatbots,
      usageMetrics,
      createFilteredChatbots,

      // Loading states
      isLoadingChatbots,
      isLoadingMetrics,
      isDeletingChatbot: deleteChatbotMutation.isPending,

      // Error states
      chatbotsError,
      metricsError,
      deleteError: deleteChatbotMutation.error,

      // Actions
      handleCreateChatbot,
      handleUploadKnowledge,
      handleViewAnalytics,
      handleEditChatbot,
      handleDeleteChatbot,
    }),
    [
      chatbots,
      usageMetrics,
      createFilteredChatbots,
      isLoadingChatbots,
      isLoadingMetrics,
      deleteChatbotMutation.isPending,
      chatbotsError,
      metricsError,
      deleteChatbotMutation.error,
      handleCreateChatbot,
      handleUploadKnowledge,
      handleViewAnalytics,
      handleEditChatbot,
      handleDeleteChatbot,
    ]
  );
}
