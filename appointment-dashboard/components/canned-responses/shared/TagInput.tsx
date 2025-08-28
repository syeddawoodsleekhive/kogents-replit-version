"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { Tag } from "@/api/tags";

interface TagInputProps {
  tags: string[];
  suggestions: Tag[]; // Assuming Tag has a `name` or similar property
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput = ({
  tags,
  suggestions,
  onChange,
  placeholder = "Add a tag",
}: TagInputProps) => {
  const [newTag, setNewTag] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Function to handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setNewTag(input);

    // Filter the suggestions based on the input value
    if (input.trim()) {
      setFilteredSuggestions(
        suggestions
          .map((tag) => tag.name) // Assuming Tag has a `name` property for the tag text
          .filter((tag) => tag.toLowerCase().includes(input.toLowerCase()))
      );
    } else {
      setFilteredSuggestions([]);
    }
  };

  // Add a tag to the list
  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
      setNewTag(''); // Clear the input field after adding the tag
      setFilteredSuggestions([]); // Clear suggestions after adding a tag
    }
  };

  // Remove a specific tag
  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle keypress to add tag on "Enter"
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    if (!tags.includes(suggestion)) {
      onChange([...tags, suggestion]);
    }
    setNewTag(""); // Clear the input after selecting a suggestion
    setFilteredSuggestions([]); // Clear the suggestions list
  };

  return (
    <div className="space-y-2">
      <div className="relative flex gap-2">
        <Input
          value={newTag}
          onChange={handleInputChange}
          placeholder={placeholder}
          onKeyPress={handleKeyPress}
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          <Plus className="h-4 w-4" />
        </Button>

        {/* Show suggestion list if there are filtered suggestions */}
        {filteredSuggestions.length > 0 && (
          <ul className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-10 space-y-2 p-2">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                className="cursor-pointer hover:bg-gray-100 p-1 text-xs"
                onClick={() => handleSuggestionSelect(suggestion)} // Handle suggestion click
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Display the selected tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
