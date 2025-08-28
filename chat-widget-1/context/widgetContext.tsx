// NOTE: All state in this context is encapsulated in React context and hooks. 
// No global state is created or mutated. WidgetContext is strictly scoped.

"use client";

import { getWidgetSettings } from "@/app/api/widget";
import { WidgetAppearanceModel } from "@/types/appearance";
import { useSearchParams } from "next/navigation";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  Suspense,
  useRef,
  useCallback,
} from "react";
import { WidgetApp } from "./data";

interface WidgetContextType {
  widgetSettings: WidgetAppearanceModel | null;
  isTransitioning: boolean;
}

// Context: Namespaced to avoid conflicts
const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

/** 
 * Utility: Dispatch namespaced custom events to avoid event conflicts and allow cross-frame messaging
 */
function dispatchWidgetEvent(eventName: string, detail?: any) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent(`widget-${eventName}`, { detail });
    window.dispatchEvent(event);

    // PostMessage to parent frame if embedded in an iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: `widget:${eventName}`, detail }, "*");
    }
  }
}

/** 
 * Third-party service integration readiness check
 * Placeholder: Replace with actual logic if needed 
 */
function thirdPartyServiceReady() {
  // Example: Replace with checks for required third-party SDKs
  return true;
}

/** 
 * Simple in-memory rate-limiting (per instance, non-global)
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max requests per window

function getRateLimitKey(apiToken: string) {
  return `widget-rate-limit-${apiToken}`;
}

function isRateLimited(apiToken: string, store: Record<string, { count: number; windowStart: number }>): boolean {
  const key = getRateLimitKey(apiToken);
  const now = Date.now();
  let rate = store[key];

  if (!rate || now - rate.windowStart > RATE_LIMIT_WINDOW_MS) {
    store[key] = { count: 1, windowStart: now };
    return false;
  }

  rate.count++;
  if (rate.count > RATE_LIMIT_MAX_REQUESTS) return true;

  store[key] = rate;
  return false;
}

/**
 * Inner provider component with actual logic
 */
const WidgetProviderInner = ({ children }: { children: ReactNode }) => {
  const params = useSearchParams();
  const apiToken = params.get("apiToken");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [widgetSettings, setWidgetSettings] =
    useState<WidgetAppearanceModel | null>(WidgetApp);

  // Local instance store for rate limiting
  const rateLimitStore = useRef<Record<string, { count: number; windowStart: number }>>({}).current;

  // Handle widget transition state (animation timing)
  const startTransition = useCallback(() => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setIsTransitioning(true);
    transitionTimerRef.current = setTimeout(() => setIsTransitioning(false), 300); // 300ms
  }, []);

  // Fetch widget settings on apiToken change
  useEffect(() => {
    if (!apiToken || !thirdPartyServiceReady()) return;

    if (isRateLimited(apiToken, rateLimitStore)) {
      dispatchWidgetEvent("rate-limit-exceeded", { apiToken });
      return;
    }

    // getWidgetSettings(apiToken)
    //   .then((data) => {
    //     startTransition();
    //     setWidgetSettings(data);
    //     dispatchWidgetEvent("settings-loaded", data);
    //   })
    //   .catch(() => {
    //     dispatchWidgetEvent("settings-load-failed", { apiToken });
    //   });
  }, [apiToken, startTransition, rateLimitStore]);

  // Cleanup transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  return (
    <WidgetContext.Provider value={{ widgetSettings, isTransitioning }}>
      {apiToken ? children : null}
    </WidgetContext.Provider>
  );
};

/**
 * Provider with suspense (for async navigation)
 */
export const WidgetProvider = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={null}>
    <WidgetProviderInner>{children}</WidgetProviderInner>
  </Suspense>
);

/**
 * Hook to access WidgetContext
 */
export const useWidgetContext = () => {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error("useWidgetContext must be used within a WidgetProvider");
  }
  return context;
};
