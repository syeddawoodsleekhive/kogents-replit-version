"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Settings, Upload, Download } from "lucide-react";

interface ResponsesHeaderProps {
  onAddResponse: () => void;
  onAddCategory: () => void;
  onImport: () => void;
  onExportAll: () => void;
}

export const ResponsesHeader = ({
  onAddResponse,
  onAddCategory,
  onImport,
  onExportAll,
}: ResponsesHeaderProps) => {
  const onClickHandler = (func: any) => {
    setTimeout(func, 10);
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Canned Responses</h1>
        <p className="text-gray-600">Manage your quick response templates</p>
      </div>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onClickHandler(onAddCategory)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onClickHandler(onImport)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Responses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClickHandler(onExportAll)}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={onAddResponse}>
          <Plus className="h-4 w-4 mr-2" />
          Add Response
        </Button>
      </div>
    </div>
  );
};
