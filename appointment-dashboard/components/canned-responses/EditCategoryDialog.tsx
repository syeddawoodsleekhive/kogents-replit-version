"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { FormDialog } from "./shared/FormDialog"
import { CategoryFormFields } from "./shared/CategoryFormFields"
import { validateCategory } from "@/utils/validation"
import type { CannedResponseCategory } from "@/types/canned-responses"

interface EditCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CannedResponseCategory | null
  onEdit: (id: string, updates: Partial<CannedResponseCategory>) => Promise<void>
  isLoading?: boolean
}

export const EditCategoryDialog = ({
  open,
  onOpenChange,
  category,
  onEdit,
  isLoading = false,
}: EditCategoryDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        color: category.color,
      })
      setErrors({})
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!category) return

    const validation = validateCategory(formData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    try {
      await onEdit(category.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
      })

      setErrors({})
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update category:", error)
    }
  }

  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
    // Clear errors for updated fields
    if (errors) {
      const newErrors = { ...errors }
      Object.keys(updates).forEach((key) => {
        delete newErrors[key]
      })
      setErrors(newErrors)
    }
  }

  if (!category) return null

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Category"
      description="Update the category details."
      onSubmit={handleSubmit}
      submitLabel="Update Category"
      isSubmitting={isLoading}
    >
      <CategoryFormFields formData={formData} errors={errors} onChange={handleFormChange} />
    </FormDialog>
  )
}
