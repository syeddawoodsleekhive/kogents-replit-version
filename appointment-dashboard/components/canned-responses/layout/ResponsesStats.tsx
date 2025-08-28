"use client";

import { ResponsesStatsSkeleton } from "@/components/skeleton/responses-stats-skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface ResponsesStatsProps {
  totalResponses: number;
  totalCategories: number;
  totalUsage: number;
  withShortcuts: number;
  loading: boolean;
}

export const ResponsesStats = ({
  totalResponses = 0,
  totalCategories = 0,
  totalUsage = 0,
  withShortcuts = 0,
  loading,
}: ResponsesStatsProps) => {
  if (loading) {
    return <ResponsesStatsSkeleton />;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {totalResponses}
          </div>
          <div className="text-sm text-gray-600">Total Responses</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {totalCategories}
          </div>
          <div className="text-sm text-gray-600">Categories</div>
        </CardContent>
      </Card>
      {/* <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-purple-600">{totalUsage}</div>
          <div className="text-sm text-gray-600">Total Usage</div>
        </CardContent>
      </Card> */}
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {withShortcuts}
          </div>
          <div className="text-sm text-gray-600">With Shortcuts</div>
        </CardContent>
      </Card>
    </div>
  );
};
