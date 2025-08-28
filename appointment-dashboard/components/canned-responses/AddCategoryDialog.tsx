"use client";

import type React from "react";
import { useState } from "react";
import { FormDialog } from "./shared/FormDialog";
import { CategoryFormFields } from "./shared/CategoryFormFields";
import { validateCategory } from "@/utils/validation";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (categoryData: CreateCannedResponseCategory) => Promise<void>;
  isLoading?: boolean;
}

export const AddCategoryDialog = ({
  open,
  onOpenChange,
  onAdd,
  isLoading = false,
}: AddCategoryDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateCategory(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onAdd({
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        sortOrder: 0,
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    if (errors) {
      const newErrors = { ...errors };
      Object.keys(updates).forEach((key) => {
        delete newErrors[key];
      });
      setErrors(newErrors);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Category"
      description="Create a new category for organizing responses."
      onSubmit={handleSubmit}
      submitLabel="Add Category"
      isSubmitting={isLoading}
    >
      <CategoryFormFields
        formData={formData}
        errors={errors}
        onChange={handleFormChange}
      />
    </FormDialog>
  );
};
