"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTags } from "@/hooks/useTags";
import { TagDialog } from "@/components/tags/TagDialog";
import { TagsCategoriesSkeleton } from "@/components/skeleton/tags-skeleton-management";

const PREDEFINED_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#d946ef",
  "#f43f5e",
];

export default function TagsManagementPage() {
  const { toast } = useToast();
  const {
    tags,
    tagCategories,
    tagsLoading,
    tagsError,
    tagsStats,
    getTags,
    getTagCategories,
    addTag,
    updateTagById,
    deleteTagById,
    addCategory,
    updateCategoryById,
    deleteCategoryById,
  } = useTags();

  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isEditTagCategoryOpen, setIsEditTagCategoryOpen] = useState(false);
  const [editingTagCategory, setEditingTagCategory] =
    useState<TagCategory | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: PREDEFINED_COLORS[0],
    description: "",
    sortOrder: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{
    action: string | null;
    actionId: string | null;
  }>({
    action: null,
    actionId: null,
  });

  const filteredTags = useMemo(() => {
    if (tags.length > 0) {
      return tags.filter((tag) => {
        const matchesSearch =
          tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tag.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" || tag.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    }
    return [];
  }, [tags, searchTerm, selectedCategory]);

  const handleTagSubmit = async (data: Partial<Tag>) => {
    try {
      if (editingTag) {
        await updateTagById(editingTag.id, data);
        toast({ title: "Success", description: "Tag updated successfully" });
      } else {
        await addTag(data);
        toast({ title: "Success", description: "Tag created successfully" });
      }

      getTags();
      setIsTagDialogOpen(false);
      setEditingTag(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save tag",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = async ({
    action = null,
    actionId = null,
  }: {
    action: string | null;
    actionId: string | null;
  }) => {
    if (!action || !actionId) return;

    try {
      switch (action) {
        case "tag-delete":
          await deleteTagById(actionId);
          getTags();
          toast({
            title: "Success",
            description: "Tag deleted successfully",
          });
          break;

        case "tag-category-delete":
          await deleteCategoryById(actionId);
          getTags();
          getTagCategories();
          toast({
            title: "Success",
            description: "Tag category deleted successfully",
          });
          break;

        default:
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          action === "tag-delete"
            ? "Failed to delete tag"
            : "Failed to delete tag category",
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    if (
      tagCategories.some(
        (cat) => cat.name.toLowerCase() === newCategory.name.toLowerCase()
      )
    ) {
      toast({
        title: "Error",
        description: "A category with this name already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      await addCategory(newCategory);

      getTagCategories();
      setNewCategory({
        name: "",
        color: PREDEFINED_COLORS[0],
        description: "",
        sortOrder: 0,
      });
      setIsCreateCategoryOpen(false);

      toast({
        title: "Success",
        description: "Category created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const handleEditTagCategory = async () => {
    if (!editingTagCategory || !editingTagCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    const existingCategory = tagCategories.find(
      (cat) =>
        cat.name.toLowerCase() === editingTagCategory.name.toLowerCase() &&
        cat.id !== editingTagCategory.id
    );

    if (existingCategory) {
      toast({
        title: "Error",
        description: "A category with this name already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateCategoryById(editingTagCategory.id, {
        name: editingTagCategory.name,
        color: editingTagCategory.color,
        description: editingTagCategory.description,
        sortOrder: editingTagCategory.sortOrder,
      });

      getTagCategories();

      setEditingTagCategory(null);
      setIsEditTagCategoryOpen(false);

      toast({
        title: "Success",
        description: "Tag category updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tag category",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (tag: Tag) => {
    setTimeout(() => {
      setEditingTag(tag);
      setIsTagDialogOpen(true);
    }, 100);
  };

  const openTagCategoryEditDialog = (category: TagCategory) => {
    setTimeout(() => {
      setEditingTagCategory(category);
      setIsEditTagCategoryOpen(true);
    }, 100);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags Management</h1>
          <p className="text-muted-foreground">
            Organize and manage conversation tags
          </p>
        </div>
        <div className="ml-auto w-fit">
          <Button
            onClick={() => {
              setEditingTag(null);
              setIsTagDialogOpen(true);
            }}
          >
            Create Tag
          </Button>
        </div>
      </div>

      {/* Tabs for Tags and Categories */}
      {tagsLoading ? (
        <TagsCategoriesSkeleton />
      ) : (
        <Tabs defaultValue="tags" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {tagCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTags.map((tag) => {
                    const category = tagCategories.find(
                      (cat) => cat.id === tag.categoryId
                    );
                    return (
                      <TableRow key={tag.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="font-medium">{tag.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {category?.name || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {tag.description}
                        </TableCell>
                        <TableCell>
                          {new Date(tag.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(tag)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeleteDialogOpen({
                                    action: "tag-delete",
                                    actionId: tag.id,
                                  })
                                }
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-end">
              <Dialog
                open={isCreateCategoryOpen}
                onOpenChange={setIsCreateCategoryOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                    <DialogDescription>
                      Add a new category to organize tags
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Name</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) =>
                          setNewCategory((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter category name"
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex gap-2 mt-2">
                        {PREDEFINED_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border-2 ${
                              newCategory.color === color
                                ? "border-gray-800"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() =>
                              setNewCategory((prev) => ({ ...prev, color }))
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category-description">Description</Label>
                      <Textarea
                        id="category-description"
                        value={newCategory.description}
                        onChange={(e) =>
                          setNewCategory((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Enter category description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateCategoryOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCategory}
                      disabled={tagsLoading}
                    >
                      {" "}
                      {/* Changed from loading */}
                      {tagsLoading ? "Creating..." : "Create Category"}{" "}
                      {/* Changed from loading */}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tagCategories.map((category) => {
                const categoryTags = tags.filter(
                  (tag) => tag.categoryId === category.id
                );

                return (
                  <Card key={category.id}>
                    <CardHeader className="relative">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <CardTitle className="text-lg">
                          {category.name}
                        </CardTitle>
                      </div>
                      <CardDescription>{category.description}</CardDescription>
                      <div className="absolute right-2 top-2 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                openTagCategoryEditDialog(category)
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteDialogOpen({
                                  action: "tag-category-delete",
                                  actionId: category.id,
                                })
                              }
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Tags:</span>
                          <span className="font-medium">
                            {categoryTags.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDialogOpen.action}
        onOpenChange={() =>
          setDeleteDialogOpen({ action: null, actionId: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="capitalize">
              {deleteDialogOpen.action?.replaceAll("-", " ")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this{" "}
              {deleteDialogOpen.action?.replaceAll("-", " ")}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteTag(deleteDialogOpen)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Tag Category Dialog */}
      <Dialog
        open={isEditTagCategoryOpen}
        onOpenChange={setIsEditTagCategoryOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag Category</DialogTitle>
            <DialogDescription>
              Update tag category information
            </DialogDescription>
          </DialogHeader>
          {editingTagCategory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={editingTagCategory.name}
                  onChange={(e) =>
                    setEditingTagCategory((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {PREDEFINED_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border-2 ${
                        editingTagCategory.color === color
                          ? "border-gray-800"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setEditingTagCategory((prev) =>
                          prev ? { ...prev, color } : prev
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  value={editingTagCategory.description}
                  onChange={(e) =>
                    setEditingTagCategory((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  placeholder="Enter category description"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditTagCategoryOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditTagCategory} disabled={tagsLoading}>
              {" "}
              {/* Changed from loading */}
              {tagsLoading ? "Updating..." : "Update Tag Category"}{" "}
              {/* Changed from loading */}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TagDialog
        open={isTagDialogOpen}
        onOpenChange={(open) => {
          setIsTagDialogOpen(open);
          if (!open) setEditingTag(null);
        }}
        mode={editingTag ? "edit" : "create"}
        initialData={editingTag}
        categories={tagCategories}
        isLoading={tagsLoading}
        onSubmit={handleTagSubmit}
      />
    </div>
  );
}
