"use client";

import { useMemo } from "react";
import { useCannedResponses } from "@/hooks/useCannedResponses";
import { useCannedResponsesState } from "@/hooks/useCannedResponsesState";
import { useToast } from "@/hooks/use-toast";

// Layout components
import { ResponsesHeader } from "@/components/canned-responses/layout/ResponsesHeader";
import { ResponsesFilters } from "@/components/canned-responses/layout/ResponsesFilters";
import { ResponsesStats } from "@/components/canned-responses/layout/ResponsesStats";

// Feature components
import { CategoryManagement } from "@/components/canned-responses/CategoryManagement";
import { BulkActionBar } from "@/components/canned-responses/BulkActionBar";
import { ResponsesList } from "@/components/canned-responses/ResponsesList";

// Dialog components
import { AddResponseDialog } from "@/components/canned-responses/AddResponseDialog";
import { EditResponseDialog } from "@/components/canned-responses/EditResponseDialog";
import { DeleteResponseDialog } from "@/components/canned-responses/DeleteResponseDialog";
import { AddCategoryDialog } from "@/components/canned-responses/AddCategoryDialog";
import { EditCategoryDialog } from "@/components/canned-responses/EditCategoryDialog";
import { DeleteCategoryDialog } from "@/components/canned-responses/DeleteCategoryDialog";
import { ImportDialog } from "@/components/canned-responses/ImportDialog";
import { BulkDeleteDialog } from "@/components/canned-responses/BulkDeleteDialog";
import { CategoryManagementSkeleton } from "@/components/skeleton/category-management-skeleton";

const CannedResponsesPage = () => {
  const {
    categories,
    responses,
    loading,
    error,
    stats,
    searchResponses,
    addResponse,
    updateResponse,
    deleteResponse,
    addCategory,
    updateCategory,
    deleteCategory,
    exportResponses,
    importResponses,
  } = useCannedResponses();

  const {
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
  } = useCannedResponsesState();

  const { toast } = useToast();

  const filteredResponses = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResponses(searchQuery);
    }
    return responses.filter(
      (response) =>
        !selectedCategoryFilter ||
        response.categoryId === selectedCategoryFilter
    );
  }, [responses, searchQuery, selectedCategoryFilter, searchResponses]);

  const selectedResponseObjects = useMemo(() => {
    return responses.filter((r) => selectedResponses.includes(r.id));
  }, [responses, selectedResponses]);

  // Export functions
  const handleExportResponses = async (responsesToExport: typeof responses) => {
    try {
      const response = await exportResponses();
      const rawData = response.map((item: any) => ({
        title: item.title,
        content: item.content,
        shortcut: item.shortcut,
        categoryId: item.categoryId,
        tags: item.tags,
        isActive: item.isActive,
      }));

      // Serialize the object to JSON
      const json = JSON.stringify(rawData, null, 2);

      // Create a Blob with the JSON string
      const url = URL.createObjectURL(
        new Blob([json], { type: "application/json" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `canned-responses-${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Canned responses have been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the responses.",
        variant: "destructive",
      });

      console.error("Export failed:", error);
    }
  };

  // Event handlers
  const handleAddResponse = async (
    responseData: Parameters<typeof addResponse>[0]
  ) => {
    try {
      await addResponse(responseData);
      toast({
        title: "Success!",
        description: "Response added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add response",
        variant: "destructive",
      });
    }
  };

  const handleEditResponse = async (
    id: string,
    updates: Parameters<typeof updateResponse>[1]
  ) => {
    try {
      await updateResponse(id, updates);
      toast({
        title: "Success!",
        description: "Response updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update response",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResponse = async (id: string) => {
    try {
      await deleteResponse(id);
      clearSelection();
      toast({
        title: "Success!",
        description: "Response deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete response",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => deleteResponse(id)));
      clearSelection();
      toast({
        title: "Success!",
        description: `${ids.length} responses deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete responses",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async (
    categoryData: Parameters<typeof addCategory>[0]
  ) => {
    try {
      await addCategory(categoryData);
      toast({
        title: "Success!",
        description: "Category added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async (
    id: string,
    updates: Parameters<typeof updateCategory>[1]
  ) => {
    try {
      await updateCategory(id, updates);
      toast({
        title: "Success!",
        description: "Category updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast({
        title: "Success!",
        description: "Category deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleImportResponses = async (
    importedResponses: Parameters<typeof addResponse>[0][]
  ) => {
    try {
      await importResponses([]);
      toast({
        title: "Success!",
        description: `${importedResponses.length} responses imported successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import responses",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">
            Error loading canned responses
          </div>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ResponsesHeader
        onAddResponse={() => setAddDialogOpen(true)}
        onAddCategory={() => setAddCategoryDialogOpen(true)}
        onImport={() => setImportDialogOpen(true)}
        onExportAll={() => handleExportResponses(responses)}
      />

      <ResponsesFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategoryFilter}
        onCategoryChange={setSelectedCategoryFilter}
        categories={categories}
      />

      {!loading ? (
        <CategoryManagement
          categories={categories}
          responses={responses}
          onCategoryChange={setSelectedCategoryFilter}
          onEditCategory={openEditCategoryDialog}
          onDeleteCategory={openDeleteCategoryDialog}
        />
      ) : (
        <CategoryManagementSkeleton />
      )}

      {selectedResponses.length > 0 && (
        <BulkActionBar
          selectedCount={selectedResponses.length}
          totalCount={filteredResponses.length}
          onSelectAll={() =>
            selectAllResponses(filteredResponses.map((r) => r.id))
          }
          onClearSelection={clearSelection}
          onExportSelected={() =>
            handleExportResponses(selectedResponseObjects)
          }
          onDeleteSelected={() => setBulkDeleteDialogOpen(true)}
        />
      )}

      <ResponsesStats
        totalCategories={categories.length}
        totalResponses={responses.length}
        totalUsage={0}
        withShortcuts={0}
        loading={loading}
      />

      <ResponsesList
        responses={filteredResponses}
        categories={categories}
        selectedResponses={selectedResponses}
        onToggleSelection={toggleResponseSelection}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        loading={loading}
      />

      {/* Dialogs */}
      <AddResponseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categories={categories}
        onAdd={handleAddResponse}
        isLoading={loading}
      />

      <EditResponseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        response={selectedResponse}
        categories={categories}
        onEdit={handleEditResponse}
        isLoading={loading}
      />

      <DeleteResponseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        response={selectedResponse}
        onDelete={handleDeleteResponse}
      />

      <AddCategoryDialog
        open={addCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        onAdd={handleAddCategory}
        isLoading={loading}
      />

      <EditCategoryDialog
        open={editCategoryDialogOpen}
        onOpenChange={setEditCategoryDialogOpen}
        category={selectedCategory}
        onEdit={handleEditCategory}
        isLoading={loading}
      />

      <DeleteCategoryDialog
        open={deleteCategoryDialogOpen}
        onOpenChange={setDeleteCategoryDialogOpen}
        category={selectedCategory}
        responseCount={
          selectedCategory
            ? responses.filter((r) => r.categoryId === selectedCategory.id)
                .length
            : 0
        }
        onDelete={handleDeleteCategory}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportResponses}
      />

      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        responses={selectedResponseObjects}
        onDelete={handleBulkDelete}
      />
    </div>
  );
};

export default CannedResponsesPage;
