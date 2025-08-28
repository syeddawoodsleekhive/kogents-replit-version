"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "./TagInput";
import type { CannedResponseCategory } from "@/types/canned-responses";
import { useState } from "react"; // Import useState for formData
import { Tag } from "@/api/tags";

interface ResponseFormFieldsProps {
  formData: {
    title: string;
    content: string;
    shortcut: string;
    category: string;
    tags: string[];
  };
  errors: Record<string, string>;
  categories: CannedResponseCategory[];
  tags: Tag[];
  onChange: (updates: Partial<any>) => void;
}

export const ResponseFormFields = ({
  formData,
  errors,
  categories,
  tags,
  onChange,
}: ResponseFormFieldsProps) => {
  const [formState, setFormState] = useState(formData);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    setFormState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
    onChange({ [field]: value });
  };

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formState.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Enter response title"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formState.content}
          onChange={(e) => handleInputChange("content", e.target.value)}
          placeholder="Enter response content"
          rows={4}
          className={errors.content ? "border-red-500" : ""}
        />
        {errors.content && (
          <p className="text-sm text-red-500">{errors.content}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="shortcut">Shortcut *</Label>
          <Input
            id="shortcut"
            value={formState.shortcut}
            onChange={(e) => handleInputChange("shortcut", e.target.value)}
            placeholder="e.g., welcome"
            className={errors.shortcut ? "border-red-500" : ""}
          />
          {errors.shortcut && (
            <p className="text-sm text-red-500">{errors.shortcut}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Category *</Label>
          <Select
            value={formState.category}
            onValueChange={(value) => handleInputChange("category", value)}
          >
            <SelectTrigger className={errors.category ? "border-red-500" : ""}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category}</p>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Tags</Label>
        <TagInput
          suggestions={tags}
          tags={formState.tags}
          onChange={(tags) => handleInputChange("tags", tags)}
          placeholder="Add tags..."
        />
      </div>
    </>
  );
};
