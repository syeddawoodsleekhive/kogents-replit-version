"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { permissionDescriptions, defaultPermissionsByRole } from "./mock-data";

import type { Permission, RoleList, RolePermissionsResponse } from "@/types";
import Axios from "@/lib/axios";
import { Pencil } from "lucide-react";

const allPermissions = Array.from(
  new Set(Object.values(defaultPermissionsByRole).flat())
);

// Permission action constants
const PERMISSION_ACTIONS = ['create', 'update', 'read', 'delete'] as const;
type PermissionAction = typeof PERMISSION_ACTIONS[number];

// Permission name parsing utilities
const createPermissionNameUtils = () => {
  const getActionFromPermissionName = (permissionName: string): string => {
    if (!permissionName) return "";
    const parts = permissionName.split(":");
    return parts[0];
  };

  const getResourceFromPermissionName = (permissionName: string): string => {
    if (!permissionName) return "";
    const parts = permissionName.split(":");
    return parts[1] || "";
  };

  const buildPermissionName = (action: string, resource: string): string => {
    return resource ? `${action}:${resource}` : action;
  };

  return {
    getActionFromPermissionName,
    getResourceFromPermissionName,
    buildPermissionName,
  };
};

// Form state management utilities
const createFormUtils = () => {
  const useFormState = (initialName: string, initialDescription: string, initialCategory: string) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [category, setCategory] = useState(initialCategory);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const resetForm = () => {
      setName("");
      setDescription("");
      setCategory("");
      setShowSuggestions(false);
    };

    return {
      name,
      setName,
      description,
      setDescription,
      category,
      setCategory,
      showSuggestions,
      setShowSuggestions,
      isSaving,
      setIsSaving,
      resetForm,
    };
  };

  return { useFormState };
};

// Category filtering utilities
const createCategoryUtils = () => {
  const filterCategories = (categories: string[], category: string): string[] => {
    if (!category.trim()) {
      return categories;
    }
    
    return categories.filter(
      (cat) =>
        cat.toLowerCase().includes(category.toLowerCase()) &&
        cat.toLowerCase() !== category.toLowerCase()
    );
  };

  return { filterCategories };
};

// API utilities
const createApiUtils = () => {
  const updatePermission = async (permissionId: string, name: string, description: string, category: string) => {
    await Axios.put(`/permissions/${permissionId}`, {
      name,
      description,
      category,
    });
  };

  return { updatePermission };
};

// Permission action radio group component
const PermissionActionGroup: React.FC<{
  selectedAction: string;
  onActionChange: (action: string) => void;
  disabled?: boolean;
}> = ({ selectedAction, onActionChange, disabled = false }) => (
  <div>
    <label className="block mb-1 font-medium">Permission Action</label>
    <div className="flex gap-4">
      {PERMISSION_ACTIONS.map((action) => (
        <label key={action} className="flex items-center gap-1">
          <input
            type="radio"
            name="permission-action"
            value={action}
            checked={selectedAction === action}
            onChange={() => onActionChange(action)}
            disabled={disabled}
          />
          <span className="capitalize">{action}</span>
        </label>
      ))}
    </div>
  </div>
);

// Category combobox component
const CategoryCombobox: React.FC<{
  category: string;
  onCategoryChange: (category: string) => void;
  showSuggestions: boolean;
  onShowSuggestionsChange: (show: boolean) => void;
  filteredCategories: string[];
  disabled?: boolean;
}> = ({ 
  category, 
  onCategoryChange, 
  showSuggestions, 
  onShowSuggestionsChange, 
  filteredCategories,
  disabled = false
}) => (
  <div className="relative">
    <Input
      placeholder="Category"
      value={category}
      onChange={(e) => onCategoryChange(e.target.value)}
      onFocus={() => {
        if (category.trim() === "") onShowSuggestionsChange(true);
      }}
      onBlur={() => setTimeout(() => onShowSuggestionsChange(false), 100)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && filteredCategories[0]) {
          onCategoryChange(filteredCategories[0]);
          onShowSuggestionsChange(false);
        }
      }}
      disabled={disabled}
      autoComplete="off"
    />
    {showSuggestions && filteredCategories.length > 0 && (
      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-40 overflow-y-auto">
        {filteredCategories.map((cat) => (
          <li
            key={cat}
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 text-sm"
            onMouseDown={() => {
              onCategoryChange(cat);
              onShowSuggestionsChange(false);
            }}
          >
            {cat}
          </li>
        ))}
      </ul>
    )}
  </div>
);

interface EditPermissionPopupProps {
  permission: Permission;
  open: boolean;
  setOpen: (open: boolean) => void;
  categories: string[];
}

export function EditPermissionPopup({
  permission,
  open,
  setOpen,
  categories,
}: EditPermissionPopupProps) {
  // Initialize utilities
  const permissionNameUtils = createPermissionNameUtils();
  const formUtils = createFormUtils();
  const categoryUtils = createCategoryUtils();
  const apiUtils = createApiUtils();

  const { 
    name, 
    setName, 
    description, 
    setDescription, 
    category, 
    setCategory,
    showSuggestions,
    setShowSuggestions,
    isSaving,
    setIsSaving,
    resetForm 
  } = formUtils.useFormState(
    permission.name, 
    permission.description || "", 
    permission.category || ""
  );

  const filteredCategories = categoryUtils.filterCategories(categories, category);

  useEffect(() => {
    if (open) {
      setName(permission.name);
      setDescription(permission.description || "");
      setCategory(permission.category || "");
    }
  }, [permission, open, setName, setDescription, setCategory]);

  const handleActionChange = (action: string) => {
    const resource = permissionNameUtils.getResourceFromPermissionName(name);
    const newName = permissionNameUtils.buildPermissionName(action, resource);
    setName(newName);
  };

  const handleUpdatePermission = async () => {
    setIsSaving(true);
    try {
      await apiUtils.updatePermission(permission.id, name, description, category);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating permission details:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentAction = permissionNameUtils.getActionFromPermissionName(name);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Permission</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <PermissionActionGroup
            selectedAction={currentAction}
            onActionChange={handleActionChange}
            disabled={isSaving}
          />
          
          <Input
            placeholder="Permission description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
          
          <CategoryCombobox
            category={category}
            onCategoryChange={setCategory}
            showSuggestions={showSuggestions}
            onShowSuggestionsChange={setShowSuggestions}
            filteredCategories={filteredCategories}
            disabled={isSaving}
          />
          
          <Button
            onClick={handleUpdatePermission}
            className="w-full"
            disabled={!name?.trim() || isSaving}
          >
            {isSaving ? "Saving..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
