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
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const CategoryManagementSkeleton = () => {
  // Number of placeholder badges to show
  const placeholderCount = 5;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          <Skeleton className="h-6 w-40 rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: placeholderCount }).map((_, idx) => (
            <div key={idx} className="relative group">
              <Badge
                variant="secondary"
                className="pr-6 cursor-default"
                style={{
                  backgroundColor: "#e0e0e020",
                  color: "#a0a0a0",
                }}
              >
                <Skeleton className="h-5 w-24 rounded" />
              </Badge>

              <div className="absolute pt-[0.125rem] right-1.5 top-1/2 transform -translate-y-1/2 opacity-100 flex items-center justify-center pointer-events-none">
                <Button variant="ghost" className="h-3.5 w-3.5 p-0 cursor-default">
                  <Settings className="max-h-3.5 max-w-3.5 text-gray-300" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
