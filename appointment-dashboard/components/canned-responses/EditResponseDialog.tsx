"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { FormDialog } from "./shared/FormDialog";
import { ResponseFormFields } from "./shared/ResponseFormFields";
import { validateResponse } from "@/utils/validation";

interface EditResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: CannedResponse | null;
  categories: CannedResponseCategory[];
  onEdit: (id: string, updates: Partial<CannedResponse>) => Promise<void>;
  isLoading?: boolean;
}

export const EditResponseDialog = ({
  open,
  onOpenChange,
  response,
  categories,
  onEdit,
  isLoading = false,
}: EditResponseDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    shortcut: "",
    category: "",
    tags: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (response) {
      console.log(response);
      setFormData({
        title: response.title,
        content: response.content,
        shortcut: response.shortcut || "",
        category: response.categoryId || "",
        tags: response.tags,
      });
      setErrors({});
    }
  }, [response]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!response) return;

    const validation = validateResponse(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      const tempData: Partial<CannedResponse> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        shortcut: formData.shortcut.trim() || undefined,
        tags: formData.tags,
        categoryId: formData.category,
      };
      await onEdit(response.id, tempData);

      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update response:", error);
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

  if (!response) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Response"
      description="Update the response details."
      onSubmit={handleSubmit}
      submitLabel="Update Response"
      isSubmitting={isLoading}
    >
      <ResponseFormFields
        formData={formData}
        errors={errors}
        categories={categories}
        onChange={handleFormChange}
        tags={[]}
      />
    </FormDialog>
  );
};
