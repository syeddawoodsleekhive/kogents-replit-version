"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "../ColorPicker";

interface CategoryFormFieldsProps {
  formData: {
    name: string;
    description: string;
    color: string;
  };
  errors: Record<string, string>;
  onChange: (updates: Partial<any>) => void;
}

export const CategoryFormFields = ({
  formData,
  errors,
  onChange,
}: CategoryFormFieldsProps) => {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Enter category name"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Enter category description (optional)"
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label>Color *</Label>
        <ColorPicker
          value={formData.color}
          onChange={(color) => onChange({ color })}
        />
        {errors.color && <p className="text-sm text-red-500">{errors.color}</p>}
      </div>
    </>
  );
};
