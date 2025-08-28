"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    responses: Omit<
      CannedResponse,
      "id" | "createdAt" | "updatedAt" | "usageCount" | "createdBy"
    >[]
  ) => Promise<void>;
}

export const ImportDialog = ({
  open,
  onOpenChange,
  onImport,
}: ImportDialogProps) => {
  const [jsonData, setJsonData] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonData(content);
        setError("");
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      setError("Please provide JSON data to import");
      return;
    }

    try {
      setIsImporting(true);
      const parsedData = JSON.parse(jsonData);

      // Validate the data structure
      if (!Array.isArray(parsedData)) {
        throw new Error("Data must be an array of responses");
      }

      const responses = parsedData.map((item: any) => ({
        title: item.title || "",
        content: item.content || "",
        shortcut: item.shortcut || undefined,
        category: item.category || "general",
        tags: Array.isArray(item.tags) ? item.tags : [],
      }));

      await onImport(responses as any);
      setJsonData("");
      setError("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON format");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Responses</DialogTitle>
          <DialogDescription>
            Import canned responses from a JSON file or paste JSON data
            directly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">Upload JSON File</Label>
            <input
              id="file"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="json">Or Paste JSON Data</Label>
            <Textarea
              id="json"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Paste your JSON data here..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Import Responses"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
