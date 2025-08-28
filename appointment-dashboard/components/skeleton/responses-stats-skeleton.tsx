"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ResponsesStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-10 w-16 rounded" />
            <Skeleton className="mt-2 h-4 w-24 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
