"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tags, X, Check } from "lucide-react"
import { useBulkTagging } from "@/hooks/useBulkTagging"

interface BulkActionBarProps {
  onOpenBulkTagManager: () => void
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ onOpenBulkTagManager }) => {
  const { selectedConversations, clearSelection } = useBulkTagging()

  if (selectedConversations.length === 0) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 shadow-lg border-2 border-primary/20">
      <div className="flex items-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <Badge variant="secondary" className="text-sm">
            {selectedConversations.length} selected
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onOpenBulkTagManager} className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Manage Tags
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            className="flex items-center gap-2 bg-transparent"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default BulkActionBar
