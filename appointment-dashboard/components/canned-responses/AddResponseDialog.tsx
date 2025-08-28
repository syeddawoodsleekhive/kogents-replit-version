"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { FormDialog } from "./shared/FormDialog";
import { ResponseFormFields } from "./shared/ResponseFormFields";
import { validateResponse } from "@/utils/validation";
import { useUser } from "@/context/UserContext";

interface AddResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CannedResponseCategory[];
  onAdd: (responseData: CreateCannedResponse) => Promise<void>;
  isLoading?: boolean;
}

export const AddResponseDialog = ({
  open,
  onOpenChange,
  categories,
  onAdd,
  isLoading = false,
}: AddResponseDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    shortcut: "",
    category: "",
    tags: [] as string[],
  });

  const { tags, getTags } = useUser();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateResponse(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      const data = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        shortcut: formData.shortcut.trim() || undefined,
        categoryId: formData.category,
        tags: formData.tags,
      };

      await onAdd(data);

      setFormData({
        title: "",
        content: "",
        shortcut: "",
        category: "",
        tags: [],
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add response:", error);
    }
  };

  useEffect(() => {
    getTags();
  }, [open]);

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
      title="Add Response"
      description="Create a new canned response template."
      onSubmit={handleSubmit}
      submitLabel="Add Response"
      isSubmitting={isLoading}
    >
      <ResponseFormFields
        formData={formData}
        errors={errors}
        categories={categories}
        tags={[]}
        onChange={handleFormChange}
      />
    </FormDialog>
  );
};
