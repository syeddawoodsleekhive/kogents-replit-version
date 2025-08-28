"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import type { Trigger } from "@/types/triggers";

interface DeleteTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: Trigger | null;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteTriggerDialog({
  open,
  onOpenChange,
  trigger,
  onConfirm,
}: DeleteTriggerDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!trigger) return;

    setLoading(true);
    try {
      await onConfirm(trigger.id);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setLoading(false);
    }
  };

  if (!trigger) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Trigger
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the trigger "{trigger.name}"? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">This will permanently delete:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• The trigger configuration</li>
              <li>• All associated conditions and actions</li>
              <li>• Execution history and statistics</li>
            </ul>
          </div>

          {trigger.enabled && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This trigger is currently active and
                may be processing conversations.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Trigger"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
