"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, Download, Trash2 } from "lucide-react"

interface BulkActionBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onExportSelected: () => void
  onDeleteSelected: () => void
}

export const BulkActionBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onExportSelected,
  onDeleteSelected,
}: BulkActionBarProps) => {
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {selectedCount} response{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                <Check className="h-4 w-4 mr-1" />
                Select All ({totalCount})
              </Button>
              <Button variant="outline" size="sm" onClick={onClearSelection}>
                <X className="h-4 w-4 mr-1" />
                Clear Selection
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExportSelected}>
              <Download className="h-4 w-4 mr-1" />
              Export Selected
            </Button>
            <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
