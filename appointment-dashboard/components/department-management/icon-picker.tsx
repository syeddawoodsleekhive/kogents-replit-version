"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as LucideIcons from "lucide-react"

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
}

// Common icons that might be useful for departments
const commonIcons = [
  "folder",
  "briefcase",
  "users",
  "code",
  "server",
  "database",
  "settings",
  "layout",
  "pen-tool",
  "megaphone",
  "trending-up",
  "bar-chart",
  "headphones",
  "mail",
  "shield",
  "building",
  "globe",
  "book",
  "file-text",
  "heart",
  "zap",
  "dollar-sign",
  "shopping-cart",
  "truck",
]

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Get all available icons from Lucide
  const allIcons = Object.keys(LucideIcons)
    .filter((key) => key !== "default" && typeof LucideIcons[key as keyof typeof LucideIcons] === "function")
    .map((key) => key.toLowerCase())

  // Filter icons based on search query
  const filteredIcons = searchQuery ? allIcons.filter((icon) => icon.includes(searchQuery.toLowerCase())) : commonIcons

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName)
    setIsOpen(false)
  }

  // Get the icon component
  const IconComponent = value
    ? (LucideIcons[(value.charAt(0).toUpperCase() + value.slice(1)) as keyof typeof LucideIcons] as React.FC<{
        className?: string
      }>)
    : LucideIcons.Folder

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between" aria-label="Select an icon">
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent className="h-4 w-4" />}
            <span className="capitalize">{value}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="mb-3">
          <Input
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <ScrollArea className="h-60">
          <div className="grid grid-cols-4 gap-2">
            {filteredIcons.map((iconName) => {
              const Icon = LucideIcons[
                (iconName.charAt(0).toUpperCase() + iconName.slice(1)) as keyof typeof LucideIcons
              ] as React.FC<{ className?: string }>
              return Icon ? (
                <Button
                  key={iconName}
                  variant="outline"
                  size="sm"
                  className={cn("h-10 w-10 p-0", value === iconName && "border-primary bg-primary/10")}
                  onClick={() => handleSelectIcon(iconName)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{iconName}</span>
                </Button>
              ) : null
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
