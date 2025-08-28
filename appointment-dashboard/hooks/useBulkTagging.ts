"use client"

import { useState, useCallback } from "react"
import type { BulkTagOperation, BulkTagResult } from "@/types/tags"
import { useToast } from "@/hooks/use-toast"

export const useBulkTagging = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedConversations, setSelectedConversations] = useState<string[]>([])
  const { toast } = useToast()

  // Select/deselect conversation
  const toggleConversationSelection = useCallback((conversationId: string) => {
    setSelectedConversations((prev) =>
      prev.includes(conversationId) ? prev.filter((id) => id !== conversationId) : [...prev, conversationId],
    )
  }, [])

  // Select all conversations
  const selectAllConversations = useCallback((conversationIds: string[]) => {
    setSelectedConversations(conversationIds)
  }, [])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedConversations([])
  }, [])

  // Bulk add tags
  const bulkAddTags = useCallback(
    async (tagIds: string[]): Promise<BulkTagResult> => {
      if (selectedConversations.length === 0) {
        toast({
          title: "No conversations selected",
          description: "Please select conversations to apply tags to.",
          variant: "destructive",
        })
        return { success: false, processedCount: 0, failedCount: 0 }
      }

      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const operation: BulkTagOperation = {
          operation: "add",
          conversationIds: selectedConversations,
          tagIds,
          assignedBy: "current-user",
        }

        // Simulate processing
        const processedCount = selectedConversations.length
        const failedCount = 0

        toast({
          title: "Tags added successfully",
          description: `Added ${tagIds.length} tag(s) to ${processedCount} conversation(s).`,
        })

        // Clear selection after successful operation
        clearSelection()

        return { success: true, processedCount, failedCount }
      } catch (error) {
        toast({
          title: "Error adding tags",
          description: "Failed to add tags to selected conversations.",
          variant: "destructive",
        })
        return { success: false, processedCount: 0, failedCount: selectedConversations.length }
      } finally {
        setIsLoading(false)
      }
    },
    [selectedConversations, toast, clearSelection],
  )

  // Bulk remove tags
  const bulkRemoveTags = useCallback(
    async (tagIds: string[]): Promise<BulkTagResult> => {
      if (selectedConversations.length === 0) {
        toast({
          title: "No conversations selected",
          description: "Please select conversations to remove tags from.",
          variant: "destructive",
        })
        return { success: false, processedCount: 0, failedCount: 0 }
      }

      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const operation: BulkTagOperation = {
          operation: "remove",
          conversationIds: selectedConversations,
          tagIds,
          assignedBy: "current-user",
        }

        // Simulate processing
        const processedCount = selectedConversations.length
        const failedCount = 0

        toast({
          title: "Tags removed successfully",
          description: `Removed ${tagIds.length} tag(s) from ${processedCount} conversation(s).`,
        })

        // Clear selection after successful operation
        clearSelection()

        return { success: true, processedCount, failedCount }
      } catch (error) {
        toast({
          title: "Error removing tags",
          description: "Failed to remove tags from selected conversations.",
          variant: "destructive",
        })
        return { success: false, processedCount: 0, failedCount: selectedConversations.length }
      } finally {
        setIsLoading(false)
      }
    },
    [selectedConversations, toast, clearSelection],
  )

  // Bulk replace tags
  const bulkReplaceTags = useCallback(
    async (tagIds: string[]): Promise<BulkTagResult> => {
      if (selectedConversations.length === 0) {
        toast({
          title: "No conversations selected",
          description: "Please select conversations to replace tags on.",
          variant: "destructive",
        })
        return { success: false, processedCount: 0, failedCount: 0 }
      }

      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const operation: BulkTagOperation = {
          operation: "replace",
          conversationIds: selectedConversations,
          tagIds,
          assignedBy: "current-user",
        }

        // Simulate processing
        const processedCount = selectedConversations.length
        const failedCount = 0

        toast({
          title: "Tags replaced successfully",
          description: `Replaced tags with ${tagIds.length} tag(s) on ${processedCount} conversation(s).`,
        })

        // Clear selection after successful operation
        clearSelection()

        return { success: true, processedCount, failedCount }
      } catch (error) {
        toast({
          title: "Error replacing tags",
          description: "Failed to replace tags on selected conversations.",
          variant: "destructive",
        })
        return { success: false, processedCount: 0, failedCount: selectedConversations.length }
      } finally {
        setIsLoading(false)
      }
    },
    [selectedConversations, toast, clearSelection],
  )

  return {
    selectedConversations,
    isLoading,
    toggleConversationSelection,
    selectAllConversations,
    clearSelection,
    bulkAddTags,
    bulkRemoveTags,
    bulkReplaceTags,
  }
}
