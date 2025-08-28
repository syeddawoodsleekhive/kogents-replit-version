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

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responses: CannedResponse[];
  onDelete: (ids: string[]) => Promise<void>;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  responses,
  onDelete,
}: BulkDeleteDialogProps) {
  const handleDelete = async () => {
    const ids = responses.map((r) => r.id);
    await onDelete(ids);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Selected Responses</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="text-sm text-muted-foreground">
          <p>
            Are you sure you want to delete {responses.length} selected
            responses?
          </p>
          <div className="mt-2">
            <ul className="list-disc list-inside">
              {responses.slice(0, 5).map((response) => (
                <li key={response.id} className="truncate">
                  {response.title}
                </li>
              ))}
              {responses.length > 5 && (
                <li>...and {responses.length - 5} more</li>
              )}
            </ul>
          </div>
          <p className="mt-2 text-red-600">This action cannot be undone.</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
