"use client";

import { memo } from "react";
import { MemoizedMetricCard } from "@/components/chatbots/ui/memoized-metric-card";
import { METRICS } from "@/lib/constants";
import { useRenderPerformance } from "@/hooks/chatbots/use-performance";

const OptimizedMetricsCardsComponent = () => {
  useRenderPerformance("MetricsCards");

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {METRICS.map((metric) => (
        <MemoizedMetricCard key={metric.title} metric={metric} />
      ))}
    </div>
  );
};

export const OptimizedMetricsCards = memo(OptimizedMetricsCardsComponent);
