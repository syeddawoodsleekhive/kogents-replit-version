"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ResponsesListSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            {/* Title skeleton */}
            <Skeleton className="h-6 w-1/3 rounded" />
            {/* Shortcut & category badges skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {/* Usage & created info skeleton */}
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            {/* Content skeleton */}
            <Skeleton className="h-14 w-full rounded" />
            {/* Tags skeleton */}
            <div className="flex gap-2">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-6 w-10 rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
