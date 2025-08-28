"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Edit, Trash2 } from "lucide-react";

interface CategoryManagementProps {
  categories: CannedResponseCategory[];
  responses: CannedResponse[];
  onEditCategory: (category: CannedResponseCategory) => void;
  onDeleteCategory: (category: CannedResponseCategory) => void;
  onCategoryChange: (category: string) => void;
}

export const CategoryManagement = ({
  categories,
  responses,
  onEditCategory,
  onDeleteCategory,
  onCategoryChange,
}: CategoryManagementProps) => {
  if (categories.length === 0) {
    return null;
  }

  const getResponseCount = (categoryName: string) => {
    return responses.filter((r) => r.categoryId === categoryName.toLowerCase())
      .length;
  };

  const onClickHandler = (func: any, cat: any) => {
    setTimeout(() => func(cat), 10);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div key={category.id} className="group relative">
              <Badge
                variant="secondary"
                className="pr-6 cursor-pointer"
                style={{
                  backgroundColor: category.color + "20",
                  color: category.color,
                }}
                onClick={() =>
                  onCategoryChange(category.name.toLocaleLowerCase())
                }
              >
                {category.name}
                <span className="ml-1 text-xs">
                  ({getResponseCount(category.name)})
                </span>
              </Badge>
              <div className="absolute pt-[0.125rem] right-1.5 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-3.5 w-3.5 p-0">
                      <Settings className="max-h-3.5 max-w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => onClickHandler(onEditCategory, category)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onClickHandler(onDeleteCategory, category)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
