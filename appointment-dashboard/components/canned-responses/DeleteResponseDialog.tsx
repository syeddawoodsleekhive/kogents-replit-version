"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: CannedResponse | null;
  onDelete: (id: string) => Promise<void>;
}

export function DeleteResponseDialog({
  open,
  onOpenChange,
  response,
  onDelete,
}: DeleteResponseDialogProps) {
  if (!response) return null;

  const handleDelete = async () => {
    await onDelete(response.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Response</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="text-sm text-muted-foreground">
          <p>
            Are you sure you want to delete the response "{response.title}"?
          </p>
          <p className="mt-2 text-red-600">This action cannot be undone.</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
