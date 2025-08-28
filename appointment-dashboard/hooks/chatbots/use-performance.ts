"use client";

import { useEffect, useRef, useCallback } from "react";
import { PerformanceMonitor } from "@/lib/chatbots/performance-utils";
import { shouldShowDebugInfo } from "@/lib/chatbots/env-utils";

export function usePerformanceMonitor() {
  const monitor = useRef<PerformanceMonitor | null>(null);

  useEffect(() => {
    try {
      monitor.current = PerformanceMonitor.getInstance();
      monitor.current.observeLCP();
      monitor.current.observeFID();
    } catch (error) {
      if (shouldShowDebugInfo()) {
        console.warn("Failed to initialize performance monitor:", error);
      }
    }

    return () => {
      if (monitor.current) {
        monitor.current.cleanup();
      }
    };
  }, []);

  const startTiming = useCallback((label: string) => {
    try {
      return monitor.current?.startTiming(label) || (() => {});
    } catch (error) {
      if (shouldShowDebugInfo()) {
        console.warn("Failed to start timing:", error);
      }
      return () => {};
    }
  }, []);

  const recordMetric = useCallback((label: string, value: number) => {
    try {
      monitor.current?.recordMetric(label, value);
    } catch (error) {
      if (shouldShowDebugInfo()) {
        console.warn("Failed to record metric:", error);
      }
    }
  }, []);

  const getMetrics = useCallback(() => {
    try {
      return monitor.current?.getAllMetrics() || {};
    } catch (error) {
      if (shouldShowDebugInfo()) {
        console.warn("Failed to get metrics:", error);
      }
      return {};
    }
  }, []);

  return { startTiming, recordMetric, getMetrics };
}

export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const { recordMetric } = usePerformanceMonitor();

  useEffect(() => {
    renderCount.current += 1;
    recordMetric(`${componentName}_renders`, renderCount.current);
  });

  return renderCount.current;
}
