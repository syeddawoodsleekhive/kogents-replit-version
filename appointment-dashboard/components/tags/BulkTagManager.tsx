"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Check, ChevronDown, Plus, Minus, RotateCcw, Tags, X } from "lucide-react"
import { useConversationTags } from "@/hooks/useConversationTags"
import { useBulkTagging } from "@/hooks/useBulkTagging"
import type { ConversationTag } from "@/types/tags"

interface BulkTagManagerProps {
  isOpen: boolean
  onClose: () => void
}

const BulkTagManager: React.FC<BulkTagManagerProps> = ({ isOpen, onClose }) => {
  const { availableTags, tagCategories } = useConversationTags("", [])
  const { selectedConversations, isLoading, clearSelection, bulkAddTags, bulkRemoveTags, bulkReplaceTags } =
    useBulkTagging()

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false)

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.category?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const groupedTags = tagCategories.reduce(
    (acc, category) => {
      acc[category.name] = filteredTags.filter((tag) => tag.category?.id === category.id)
      return acc
    },
    {} as Record<string, ConversationTag[]>,
  )

  // Add uncategorized tags
  const uncategorizedTags = filteredTags.filter((tag) => !tag.category)
  if (uncategorizedTags.length > 0) {
    groupedTags["Uncategorized"] = uncategorizedTags
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleBulkAdd = async () => {
    if (selectedTags.length === 0) return
    await bulkAddTags(selectedTags)
    setSelectedTags([])
    onClose()
  }

  const handleBulkRemove = async () => {
    if (selectedTags.length === 0) return
    await bulkRemoveTags(selectedTags)
    setSelectedTags([])
    onClose()
  }

  const handleBulkReplace = async () => {
    if (selectedTags.length === 0) return
    await bulkReplaceTags(selectedTags)
    setSelectedTags([])
    onClose()
  }

  const selectedTagObjects = availableTags.filter((tag) => selectedTags.includes(tag.id))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Bulk Tag Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selection Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Selection Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {selectedConversations.length} conversations selected
                  </Badge>
                  {selectedConversations.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearSelection} className="h-6 px-2 text-xs">
                      Clear Selection
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tag Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Select Tags</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Selected Tags Display */}
              {selectedTagObjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTagObjects.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                    >
                      {tag.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 hover:bg-transparent"
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tag Selector */}
              <Popover open={isTagSelectorOpen} onOpenChange={setIsTagSelectorOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Tags
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <Command>
                    <CommandInput placeholder="Search tags..." value={searchQuery} onValueChange={setSearchQuery} />
                    <CommandList className="max-h-60">
                      <CommandEmpty>No tags found.</CommandEmpty>

                      {Object.entries(groupedTags).map(
                        ([categoryName, tags]) =>
                          tags.length > 0 && (
                            <CommandGroup key={categoryName} heading={categoryName}>
                              {tags.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  className="flex items-center space-x-2 cursor-pointer"
                                  onSelect={() => handleTagToggle(tag.id)}
                                >
                                  <Checkbox
                                    checked={selectedTags.includes(tag.id)}
                                    onChange={() => handleTagToggle(tag.id)}
                                  />
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                  <span className="flex-1">{tag.name}</span>
                                  {selectedTags.includes(tag.id) && <Check className="h-4 w-4 text-primary" />}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ),
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Warning */}
          {selectedConversations.length > 10 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                You are about to modify {selectedConversations.length} conversations. This action cannot be undone.
              </span>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkAdd}
                disabled={selectedTags.length === 0 || selectedConversations.length === 0 || isLoading}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Tags
              </Button>

              <Button
                variant="outline"
                onClick={handleBulkRemove}
                disabled={selectedTags.length === 0 || selectedConversations.length === 0 || isLoading}
                className="flex items-center gap-2 bg-transparent"
              >
                <Minus className="h-4 w-4" />
                Remove Tags
              </Button>

              <Button
                variant="outline"
                onClick={handleBulkReplace}
                disabled={selectedTags.length === 0 || selectedConversations.length === 0 || isLoading}
                className="flex items-center gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                Replace All Tags
              </Button>
            </div>

            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BulkTagManager
