"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRenderPerformance } from "@/hooks/chatbots/use-performance";
import type { Metric } from "@/types/chatbot";

interface MemoizedMetricCardProps {
  metric: Metric;
}

const MemoizedMetricCardComponent = ({ metric }: MemoizedMetricCardProps) => {
  useRenderPerformance("MetricCard");

  const Icon = metric.icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${metric.color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric.value}</div>
        <p className="text-xs text-muted-foreground">
          <span className="text-green-600">{metric.change}</span> from last
          month
        </p>
      </CardContent>
    </Card>
  );
};

export const MemoizedMetricCard = memo(MemoizedMetricCardComponent);
