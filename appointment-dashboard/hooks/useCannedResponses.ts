"use client";

import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchCategories,
  fetchResponses,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
  createResponse,
  updateResponseById,
  deleteResponseById,
  exportResponses,
  importResponses,
} from "@/api/v2/canned-responses";

export const useCannedResponses = () => {
  const dispatch: AppReducerDispatch = useDispatch();
  const workspace = useSelector(
    (state: RootReducerState) => state.user.workspace
  );
  const { categories, responses, loading, error, stats } = useSelector(
    (state: RootReducerState) => state.cannedResponses
  );
  const workspaceId = workspace?.id;

  // Fetch data on mount
  useEffect(() => {
    if (workspaceId && loading) {
      dispatch(fetchCategories(workspaceId));
      dispatch(fetchResponses(workspaceId));
    }
  }, [workspaceId, dispatch]);

  // Memoized functions
  const addCategory = useCallback(
    async (categoryData: {
      name: string;
      color: string;
      description: string;
      sortOrder: number;
    }) => {
      return await dispatch(createCategory(categoryData));
    },
    [workspaceId, dispatch]
  );

  const updateCategory = useCallback(
    async (
      id: string,
      updates: Partial<{
        name: string;
        color: string;
        description: string;
        sortOrder: number;
      }>
    ) => {
      return await dispatch(updateCategoryById(id, updates));
    },
    [dispatch]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      return await dispatch(deleteCategoryById(id));
    },
    [dispatch]
  );

  const addResponse = useCallback(
    async (responseData: CreateCannedResponse) => {
      return await dispatch(createResponse(responseData));
    },
    [workspaceId, dispatch]
  );

  const updateResponse = useCallback(
    async (
      id: string,
      updates: Partial<{
        title: string;
        content: string;
        shortcut: string;
        categoryId: string;
        tags: string[];
        isActive: boolean;
        cannedResponseFolderId?: string;
      }>
    ) => {
      return await dispatch(updateResponseById(id, updates));
    },
    [dispatch]
  );

  const deleteResponse = useCallback(
    async (id: string) => {
      return await dispatch(deleteResponseById(id));
    },
    [dispatch]
  );

  const searchResponses = useCallback(
    (query: string) => {
      if (!query.trim()) return responses;

      const lowerQuery = query.toLowerCase();

      // Filter responses based on query
      return responses.filter((response) => {
        // Check title
        if (response.title.toLowerCase().includes(lowerQuery)) return true;

        // Check content
        if (response.content.toLowerCase().includes(lowerQuery)) return true;

        // Check shortcut (exact match for shortcuts)
        if (
          response.shortcut &&
          response.shortcut.toLowerCase().includes(lowerQuery)
        )
          return true;

        // Check tags
        if (
          response.tags &&
          response.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        )
          return true;

        // Check category name if available
        if (
          response.category &&
          response.category.name.toLowerCase().includes(lowerQuery)
        )
          return true;

        return false;
      });
    },
    [responses]
  );

  const exportResponsesData = useCallback(async () => {
    return await exportResponses(workspaceId!);
  }, [workspaceId]);

  const importResponsesData = useCallback(
    async (
      responses: Array<{
        title: string;
        content: string;
        shortcut: string;
        categoryId: string;
        tags: string[];
        isActive: boolean;
        cannedResponseFolderId?: string;
      }>
    ) => {
      return await importResponses(responses);
    },
    [workspaceId]
  );

  return {
    workspaceId,
    categories,
    responses,
    loading,
    error,
    stats,
    searchResponses,
    addCategory,
    updateCategory,
    deleteCategory,
    addResponse,
    updateResponse,
    deleteResponse,
    exportResponses: exportResponsesData,
    importResponses: importResponsesData,
  };
};
