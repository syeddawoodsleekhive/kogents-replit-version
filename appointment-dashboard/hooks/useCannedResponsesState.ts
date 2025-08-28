"use client";

import { useState } from "react";
export const useCannedResponsesState = () => {
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] =
    useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Selected items
  const [selectedResponse, setSelectedResponse] =
    useState<CannedResponse | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CannedResponseCategory | null>(null);
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");

  // Actions
  const openEditDialog = (response: CannedResponse) => {
    setSelectedResponse(response);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (response: CannedResponse) => {
    setSelectedResponse(response);
    setDeleteDialogOpen(true);
  };

  const openEditCategoryDialog = (category: CannedResponseCategory) => {
    setSelectedCategory(category);
    setEditCategoryDialogOpen(true);
  };

  const openDeleteCategoryDialog = (category: CannedResponseCategory) => {
    setSelectedCategory(category);
    setDeleteCategoryDialogOpen(true);
  };

  const toggleResponseSelection = (responseId: string) => {
    setSelectedResponses((prev) =>
      prev.includes(responseId)
        ? prev.filter((id) => id !== responseId)
        : [...prev, responseId]
    );
  };

  const selectAllResponses = (responseIds: string[]) => {
    setSelectedResponses(responseIds);
  };

  const clearSelection = () => {
    setSelectedResponses([]);
  };

  return {
    // Dialog states
    addDialogOpen,
    setAddDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    addCategoryDialogOpen,
    setAddCategoryDialogOpen,
    editCategoryDialogOpen,
    setEditCategoryDialogOpen,
    deleteCategoryDialogOpen,
    setDeleteCategoryDialogOpen,
    importDialogOpen,
    setImportDialogOpen,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,

    // Selected items
    selectedResponse,
    selectedCategory,
    selectedResponses,

    // Filters
    searchQuery,
    setSearchQuery,
    selectedCategoryFilter,
    setSelectedCategoryFilter,

    // Actions
    openEditDialog,
    openDeleteDialog,
    openEditCategoryDialog,
    openDeleteCategoryDialog,
    toggleResponseSelection,
    selectAllResponses,
    clearSelection,
  };
};
