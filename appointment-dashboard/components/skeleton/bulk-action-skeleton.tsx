"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const BulkActionBarSkeleton = () => {
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Selected count text skeleton */}
            <Skeleton className="h-5 w-48 rounded" />
            <div className="flex gap-2">
              {/* Two outline buttons as skeleton */}
              <Skeleton className="h-8 w-32 rounded" />
              <Skeleton className="h-8 w-36 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            {/* Two buttons on right side as skeleton */}
            <Skeleton className="h-8 w-40 rounded" />
            <Skeleton className="h-8 w-36 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
