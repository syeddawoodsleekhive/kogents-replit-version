const PREDEFINED_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#d946ef",
  "#f43f5e",
];

// components/TagDialog.tsx

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tag } from "@/api/tags";

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: Partial<Tag> | null;
  categories: TagCategory[];
  isLoading: boolean;
  onSubmit: (data: Partial<Tag>) => void;
}

export const TagDialog: React.FC<TagDialogProps> = ({
  open,
  onOpenChange,
  mode,
  initialData,
  categories,
  isLoading,
  onSubmit,
}) => {
  const [tagData, setTagData] = useState<Partial<Tag>>({
    name: "",
    categoryId: "",
    color: PREDEFINED_COLORS[0] || "",
    description: "",
  });

  useEffect(() => {
    if (initialData) {
      setTagData({
        name: initialData.name || "",
        color: initialData.color || PREDEFINED_COLORS[0],
        description: initialData.description || "",
        categoryId: initialData.categoryId,
      });
    }

    return () => {
      setTagData({
        name: "",
        categoryId: "",
        color: PREDEFINED_COLORS[0] || "",
        description: "",
      });
    };
  }, [initialData, open]);

  const handleChange = (key: keyof Tag, value: string) => {
    setTagData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Tag" : "Create Tag"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update tag information" : "Enter tag details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              value={tagData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter tag name"
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select
              value={tagData.categoryId}
              onValueChange={(value) => handleChange("categoryId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 ${
                    tagData.color === color
                      ? "border-gray-800"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange("color", color)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tag-description">Description</Label>
            <Textarea
              id="tag-description"
              value={tagData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter tag description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(tagData)} disabled={isLoading}>
            {isLoading
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
              ? "Update"
              : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
