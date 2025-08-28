"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, X } from "lucide-react"
import type { ConversationTag } from "@/types/tags"
import { useConversationTags } from "@/hooks/useConversationTags"

interface TagFilterProps {
  selectedTags: string[]
  onTagsChange: (tagIds: string[]) => void
  className?: string
}

const TagFilter: React.FC<TagFilterProps> = ({ selectedTags, onTagsChange, className = "" }) => {
  const { availableTags, tagCategories } = useConversationTags("", [])
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

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
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId]
    onTagsChange(newSelectedTags)
  }

  const clearAllTags = () => {
    onTagsChange([])
  }

  const selectedTagObjects = availableTags.filter((tag) => selectedTags.includes(tag.id))

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Selected Tags Display */}
      {selectedTagObjects.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="text-xs flex items-center gap-1"
          style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}
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

      {/* Filter Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 bg-transparent">
            <Filter className="h-4 w-4 mr-2" />
            Filter by Tags
            {selectedTags.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {selectedTags.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filter by Tags</h4>
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllTags} className="h-6 px-2 text-xs">
                  Clear All
                </Button>
              )}
            </div>

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
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ),
                )}
              </CommandList>
            </Command>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default TagFilter
