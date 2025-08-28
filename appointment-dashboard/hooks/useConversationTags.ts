"use client";

import { useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTags } from "./useTags";
import { useSelector } from "react-redux";

export const useConversationTags = (
  conversationId: string,
  assignTagToChat?: (roomId: string, tagId: string) => void,
  unassignTagFromChat?: (roomId: string, tagId: string) => void
) => {
  const { tags: availableTags, tagCategories } = useTags();
  
  // Get tags from Redux chat state based on roomId
  const roomDetails = useSelector(
    (state: RootReducerState) => state.chat.roomDetails[conversationId]
  );
  
  // Get conversation tags from Redux state
  const conversationTags = useMemo(() => {
    if (!roomDetails?.tags || !Array.isArray(roomDetails.tags)) return [];
    return roomDetails.tags;
  }, [roomDetails?.tags]);

  // Get unassigned tags (tags not currently applied to this conversation)
  const unassignedTags = useMemo(() => {
    const assignedTagIds = new Set(conversationTags.map(t => t.id));
    return availableTags.filter(tag => !assignedTagIds.has(tag.id));
  }, [availableTags, conversationTags]);

  // Get category name for a tag
  const getCategoryName = useCallback(
    (categoryId: string) => tagCategories.find(c => c.id === categoryId)?.name,
    [tagCategories]
  );

  // Search tags with memoization
  const searchTags = useCallback(
    (query: string) => {
      if (!query.trim()) return availableTags;

      const lowercaseQuery = query.toLowerCase();
      return availableTags.filter(tag => 
        tag.name.toLowerCase().includes(lowercaseQuery) ||
        (tag.categoryId && getCategoryName(tag.categoryId)?.toLowerCase().includes(lowercaseQuery))
      );
    },
    [availableTags, getCategoryName]
  );

  // Get tags by category
  const getTagsByCategory = useCallback(
    (categoryId: string) => availableTags.filter(tag => tag.categoryId === categoryId),
    [availableTags]
  );

  const { toast } = useToast();

  // Add tag to conversation
  const addTag = useCallback(
    async (tag: Tag) => {
      if (conversationTags.some(t => t.id === tag.id)) {
        toast({
          title: "Tag already exists",
          description: "This tag is already applied to the conversation.",
          variant: "destructive",
        });
        return false;
      }

      try {
        if (assignTagToChat) {
          assignTagToChat(conversationId, tag.id);
        }

        // toast({
        //   title: "Tag added",
        //   description: `Tag "${tag.name}" has been added to the conversation.`,
        // });

        return true;
      } catch (error) {
        toast({
          title: "Error adding tag",
          description: "Failed to add tag to conversation.",
          variant: "destructive",
        });
        return false;
      }
    },
    [conversationTags, conversationId, toast, assignTagToChat]
  );

  // Remove tag from conversation
  const removeTag = useCallback(
    async (tagId: string) => {
      const tag = conversationTags.find(t => t.id === tagId);
      if (!tag) return false;

      try {
        if (unassignTagFromChat) {
          unassignTagFromChat(conversationId, tagId);
        }

        // toast({
        //   title: "Tag removed",
        //   description: `Tag "${tag.name}" has been removed from the conversation.`,
        // });

        return true;
      } catch (error) {
        toast({
          title: "Error removing tag",
          description: "Failed to remove tag from conversation.",
          variant: "destructive",
        });
        return false;
      }
    },
    [conversationTags, conversationId, toast, unassignTagFromChat]
  );

  // Create new tag
  const createTag = useCallback(
    async (name: string, color: string, categoryId?: string) => {
      try {
        if (assignTagToChat) {
          // Create a temporary tag ID and assign it immediately
          const tempTagId = `temp-${Date.now()}`;
          assignTagToChat(conversationId, tempTagId);
        }

        toast({
          title: "Tag created and added",
          description: `New tag "${name}" has been created and added to the conversation.`,
        });

        return { id: `temp-${Date.now()}`, name, color, categoryId };
      } catch (error) {
        toast({
          title: "Error creating tag",
          description: "Failed to create new tag.",
          variant: "destructive",
        });
        return null;
      }
    },
    [toast, assignTagToChat, conversationId]
  );

  return {
    conversationTags,
    availableTags,
    unassignedTags,
    tagCategories,
    addTag,
    removeTag,
    createTag,
    searchTags,
    getTagsByCategory,
    getCategoryName,
  };
};
