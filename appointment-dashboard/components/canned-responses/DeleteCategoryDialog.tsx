"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Category } from "@/types/canned-responses"

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  responseCount: number
  onDelete: (id: string) => Promise<void>
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  responseCount,
  onDelete,
}: DeleteCategoryDialogProps) {
  if (!category) return null

  const handleDelete = async () => {
    await onDelete(category.id)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="text-sm text-muted-foreground">
          <p>Are you sure you want to delete the category "{category.name}"?</p>
          {responseCount > 0 && (
            <div className="mt-2">
              <p className="text-amber-600">
                This category contains {responseCount} response{responseCount !== 1 ? "s" : ""}.
              </p>
              <p className="text-amber-600">These responses will be moved to "Uncategorized".</p>
            </div>
          )}
          <p className="mt-2 text-red-600">This action cannot be undone.</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            Delete Category
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
