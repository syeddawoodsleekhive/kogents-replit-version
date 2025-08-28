"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Axios from "@/lib/axios";
import { Permission } from "@/types";
import { useState } from "react";
import { defaultPermissionsByRole } from "./mock-data";

// Permission action constants
const PERMISSION_ACTIONS = ['create', 'update', 'read', 'delete'] as const;
type PermissionAction = typeof PERMISSION_ACTIONS[number];

// Dialog state management utilities
const createDialogUtils = () => {
  const useDialogState = () => {
    const [open, setOpen] = useState(false);

    const resetDialog = () => {
      setOpen(false);
    };

    return {
      open,
      setOpen,
      resetDialog,
    };
  };

  return { useDialogState };
};

// Form state management utilities
const createFormUtils = () => {
  const useFormState = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

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
      cat => 
        cat.toLowerCase().includes(category.toLowerCase()) && 
        cat.toLowerCase() !== category.toLowerCase()
    );
  };

  return { filterCategories };
};

// API utilities
const createApiUtils = () => {
  const createPermission = async (name: string, description: string, category: string) => {
    const payload = {
      name: category ? `${category}:${name}` : name,
      description: description,
      category: category,
    };
    
    const res = await Axios.post("/permissions", payload);
    return res.data;
  };

  return { createPermission };
};

// Permission action radio group component
const PermissionActionGroup: React.FC<{
  selectedAction: string;
  onActionChange: (action: string) => void;
}> = ({ selectedAction, onActionChange }) => (
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
}> = ({ 
  category, 
  onCategoryChange, 
  showSuggestions, 
  onShowSuggestionsChange, 
  filteredCategories 
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

interface AddPermissionDialogProps {
  children: React.ReactNode;
  categories: string[];
  setPermissions: (permissions: Permission[]) => void;
  permissions: Permission[];
}

export function AddPermissionDialog({
  children,
  categories,
  setPermissions,
  permissions,
}: AddPermissionDialogProps) {
  // Initialize utilities
  const dialogUtils = createDialogUtils();
  const formUtils = createFormUtils();
  const categoryUtils = createCategoryUtils();
  const apiUtils = createApiUtils();

  const { open, setOpen, resetDialog } = dialogUtils.useDialogState();
  const { 
    name, 
    setName, 
    description, 
    setDescription, 
    category, 
    setCategory,
    showSuggestions,
    setShowSuggestions,
    resetForm 
  } = formUtils.useFormState();

  const filteredCategories = categoryUtils.filterCategories(categories, category);

  const handleCreatePermission = async () => {
    try {
      const newPermission = await apiUtils.createPermission(name, description, category);
      setPermissions([...permissions, newPermission]);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetDialog();
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Permission</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <PermissionActionGroup
            selectedAction={name}
            onActionChange={setName}
          />
          
          <Input
            placeholder="Permission description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          
          <CategoryCombobox
            category={category}
            onCategoryChange={setCategory}
            showSuggestions={showSuggestions}
            onShowSuggestionsChange={setShowSuggestions}
            filteredCategories={filteredCategories}
          />
          
          <Button
            onClick={handleCreatePermission}
            className="w-full"
            disabled={!name.trim()}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
