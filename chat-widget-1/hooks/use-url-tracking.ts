"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ReferrerData,
  TrafficSource,
  CampaignData,
  ReferrerContext,
  DeviceFingerprint,
} from "@/types/chat";

import { generateDeviceFingerprint } from "@/utils/device-fingerprinting";

interface URLTrackingState {
  currentUrl: string;
  previousUrl: string;
  isTracking: boolean;
  navigationHistory: Array<{
    url: string;
    timestamp: Date;
    timeSpent?: number;
    changeType: URLChangeEvent["changeType"];
  }>;
  referrerData?: ReferrerData | null;
  trafficSource?: TrafficSource | null;
  campaignData?: CampaignData | null;
  fingerprint: DeviceFingerprint | null;
  fingerprintGenerated: boolean;
}

interface PageMetadata {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  loadTime?: number;
}

interface URLChangeEvent {
  currentUrl: string;
  previousUrl: string;
  changeType:
    | "popstate"
    | "pushstate"
    | "replacestate"
    | "hashchange"
    | "manual";
  timestamp: Date;
  timeSpentOnPreviousPage?: number;
  metadata?: PageMetadata;
  referrerContext?: ReferrerContext;
}

interface UseURLTrackingOptions {
  onURLChange?: (event: URLChangeEvent) => void;
  debounceMs?: number;
  trackParentWindow?: boolean;
  maxUrlLength?: number;
  allowedDomains?: string[];
  maxChangesPerMinute?: number;
  enableLazyLoading?: boolean;
  dataRetentionDays?: number;
}

const SENSITIVE_PARAMS = [
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "key",
  "password",
  "pwd",
  "pass",
  "secret",
  "auth",
  "authorization",
  "session",
  "sessionid",
  "session_id",
  "sid",
  "ssid",
  "email",
  "user_id",
  "userid",
  "uid",
  "id",
  "credit_card",
  "cc",
  "cvv",
  "ssn",
  "social_security",
  "phone",
  "mobile",
  "tel",
  "telephone",
  "signature",
  "hash",
  "nonce",
  "state",
];

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card format
  /\b\d{10,15}\b/, // Phone numbers
];

export function useURLTracking({
  onURLChange,
  debounceMs = 500,
  trackParentWindow = true,
  maxUrlLength = 250,
  allowedDomains = [],
  maxChangesPerMinute = 30,
  enableLazyLoading = false,
  dataRetentionDays = 7,
}: UseURLTrackingOptions = {}) {
  const [urlState, setUrlState] = useState<URLTrackingState>({
    currentUrl: "",
    previousUrl: "",
    isTracking: false,
    navigationHistory: [],
    // referrerData: null,
    // trafficSource: null,
    // campaignData: null,
    fingerprint: null,
    fingerprintGenerated: false,
  });

  const mountedRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUrlRef = useRef<string>("");
  const originalPushStateRef = useRef<typeof history.pushState | null>(null);
  const originalReplaceStateRef = useRef<typeof history.replaceState | null>(
    null
  );
  const changeCountRef = useRef<{ count: number; resetTime: number }>({
    count: 0,
    resetTime: Date.now(),
  });
  const errorCountRef = useRef<number>(0);
  const pageVisitTimeRef = useRef<{ startTime: number; url: string } | null>(
    null
  );
  const fingerprintGeneratedRef = useRef<boolean>(false);
  const fingerprintDataRef = useRef<DeviceFingerprint | null>(null);
  // const parentUrlListenerRef = useRef<((event: MessageEvent) => void) | null>(null)

  const optionsRef = useRef({
    onURLChange,
    debounceMs,
    trackParentWindow,
    maxUrlLength,
    allowedDomains,
    maxChangesPerMinute,
    enableLazyLoading,
    dataRetentionDays,
  });

  useEffect(() => {
    optionsRef.current = {
      onURLChange,
      debounceMs,
      trackParentWindow,
      maxUrlLength,
      allowedDomains,
      maxChangesPerMinute,
      enableLazyLoading,
      dataRetentionDays,
    };
  }, [
    onURLChange,
    debounceMs,
    trackParentWindow,
    maxUrlLength,
    allowedDomains,
    maxChangesPerMinute,
    enableLazyLoading,
    dataRetentionDays,
  ]);

  const maxErrorsBeforeDisable = 10;
  const HISTORY_STORAGE_KEY = "url_tracking_history";
  const MAX_HISTORY_ENTRIES = 50;

  const getTargetWindow = () => {
    if (optionsRef.current.trackParentWindow && typeof window !== "undefined") {
      try {
        if (window.parent && window.parent !== window) {
          const testAccess = window.parent.location.href;
          return window.parent;
        }
      } catch (error) {
        console.warn(
          "Cross-origin parent detected, using postMessage for URL tracking"
        );
        errorCountRef.current++;
        return null;
      }
    }
    return window;
  };

  // const setupCrossFrameTracking = () => {
  //   if (parentUrlListenerRef.current) {
  //     window.removeEventListener("message", parentUrlListenerRef.current)
  //   }
  //
  //   const handleParentMessage = (event: MessageEvent) => {
  //     if (!mountedRef.current) return
  //     try {
  //       const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data
  //       if (data?.type === "widget:url-update" && data?.source === "parent-site") {
  //         const newUrl = data.url
  //         if (newUrl && newUrl !== crossFrameUrlRef.current) {
  //           crossFrameUrlRef.current = newUrl
  //           if (data.referrerContext) {
  //             setUrlState((prev) => ({
  //               ...prev,
  //               referrerData: prev.referrerData ? { ...prev.referrerData, ...data.referrerContext } : null,
  //             }))
  //           }
  //           processURLChange("manual")
  //         }
  //       }
  //       if (data?.type === "widget:referrer-update" && data?.source === "parent-site") {
  //         setUrlState((prev) => ({
  //           ...prev,
  //           referrerData: data.referrer,
  //           trafficSource: data.trafficSource,
  //           campaignData: data.campaignData,
  //         }))
  //         console.log("Referrer data received:", {
  //           referrer: data.referrer?.referrer,
  //           trafficSource: data.trafficSource,
  //           campaignData: data.campaignData,
  //         })
  //       }
  //     } catch (error) {
  //       console.warn("Error handling parent URL message:", error)
  //     }
  //   }
  //
  //   parentUrlListenerRef.current = handleParentMessage
  //   window.addEventListener("message", handleParentMessage)
  //
  //   if (window.parent && window.parent !== window) {
  //     window.parent.postMessage(
  //       { type: "widget:request-url", source: "kogents-widget" },
  //       "*",
  //     )
  //     window.parent.postMessage(
  //       { type: "widget:request-referrer", source: "kogents-widget" },
  //       "*",
  //     )
  //   }
  // }

  // const crossFrameUrlRef = useRef<string>("")

  const shouldRetainData = (timestamp: Date): boolean => {
    const now = new Date();
    const ageInDays =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays <= optionsRef.current.dataRetentionDays;
  };

  const cleanupExpiredData = () => {
    if (!mountedRef.current) return;
    try {
      setUrlState((prev) => ({
        ...prev,
        navigationHistory: prev.navigationHistory.filter((entry) =>
          shouldRetainData(entry.timestamp)
        ),
      }));

      const historyData = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (historyData) {
        try {
          const parsed = JSON.parse(historyData);
          const filtered = parsed.filter((entry: any) =>
            shouldRetainData(new Date(entry.timestamp))
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
          }
        } catch {}
      }
    } catch (error) {
      console.warn("Failed to cleanup expired URL data:", error);
    }
  };

  const urlProcessingUtils = {
    sanitizeURL: (url: string): string => {
      try {
        if (!url || typeof url !== "string") return "";
        const urlObj = new URL(url);
        SENSITIVE_PARAMS.forEach((param) => {
          if (urlObj.searchParams.has(param)) {
            urlObj.searchParams.delete(param);
          }
        });
        let sanitizedUrl = urlObj.toString();
        PII_PATTERNS.forEach((pattern) => {
          sanitizedUrl = sanitizedUrl.replace(pattern, "[REDACTED]");
        });
        return sanitizedUrl;
      } catch (error) {
        console.warn("URL sanitization failed:", error);
        return "[INVALID_URL]";
      }
    },

    truncateURL: (url: string, maxLength: number): string => {
      if (!url || url.length <= maxLength) return url;
      try {
        const urlObj = new URL(url);
        const domain = urlObj.origin;
        const path = urlObj.pathname;
        const search = urlObj.search;
        if (domain.length >= maxLength - 3) {
          return domain.substring(0, maxLength - 3) + "...";
        }
        const domainAndPath = domain + path;
        if (domainAndPath.length <= maxLength - 3) {
          const remainingLength = maxLength - domainAndPath.length - 3;
          if (search.length > remainingLength) {
            return domainAndPath + search.substring(0, remainingLength) + "...";
          }
          return domainAndPath + search;
        }
        const availablePathLength = maxLength - domain.length - 3;
        if (availablePathLength > 0) {
          return domain + path.substring(0, availablePathLength) + "...";
        }
        return domain + "...";
      } catch (error) {
        return url.substring(0, maxLength - 3) + "...";
      }
    },

    isValidURL: (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    isDomainAllowed: (url: string): boolean => {
      if (optionsRef.current.allowedDomains.length === 0) return true;
      try {
        const urlObj = new URL(url);
        return optionsRef.current.allowedDomains.some(
          (domain) =>
            urlObj.hostname === domain || urlObj.hostname.endsWith("." + domain)
        );
      } catch {
        return false;
      }
    },
  };

  const extractPageMetadata = (): PageMetadata => {
    try {
      const targetWindow = getTargetWindow();
      if (!targetWindow?.document) return {};
      const doc = targetWindow.document;
      const metadata: PageMetadata = {};
      metadata.title = doc.title || undefined;
      const descriptionMeta = doc.querySelector('meta[name="description"]');
      metadata.description =
        descriptionMeta?.getAttribute("content") || undefined;
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      metadata.ogTitle = ogTitle?.getAttribute("content") || undefined;
      const ogDescription = doc.querySelector(
        'meta[property="og:description"]'
      );
      metadata.ogDescription =
        ogDescription?.getAttribute("content") || undefined;
      const ogImage = doc.querySelector('meta[property="og:image"]');
      metadata.ogImage = ogImage?.getAttribute("content") || undefined;
      const canonical = doc.querySelector('link[rel="canonical"]');
      metadata.canonical = canonical?.getAttribute("href") || undefined;
      if (targetWindow.performance?.timing) {
        const timing = targetWindow.performance.timing;
        if (timing.loadEventEnd && timing.navigationStart) {
          metadata.loadTime = timing.loadEventEnd - timing.navigationStart;
        }
      }
      return metadata;
    } catch (error) {
      console.warn("URL tracking error:", {
        // message: error?.message || "Unknown error",
        context: "metadata_extraction",
        errorCount: errorCountRef.current,
        timestamp: new Date().toISOString(),
      });
      errorCountRef.current++;
      return {};
    }
  };

  const handleError = (error: any, context: string) => {
    errorCountRef.current++;
    const safeError = {
      message: error?.message || "Unknown error",
      context,
      errorCount: errorCountRef.current,
      timestamp: new Date().toISOString(),
    };
    console.warn("URL tracking error:", safeError);
    if (errorCountRef.current >= maxErrorsBeforeDisable) {
      console.error("URL tracking disabled due to excessive errors");
      setUrlState((prev) => ({ ...prev, isTracking: false }));
    }
  };

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    if (now - changeCountRef.current.resetTime > oneMinute) {
      changeCountRef.current = { count: 0, resetTime: now };
    }
    if (
      changeCountRef.current.count >= optionsRef.current.maxChangesPerMinute
    ) {
      console.warn("URL tracking rate limit exceeded");
      return true;
    }
    changeCountRef.current.count++;
    return false;
  };

  const historyUtils = {
    persist: (history: URLTrackingState["navigationHistory"]) => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const trimmedHistory = history.slice(-MAX_HISTORY_ENTRIES);
          const validHistory = trimmedHistory.filter((entry) =>
            shouldRetainData(entry.timestamp)
          );
          localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify(validHistory)
          );
        }
      } catch (error) {
        handleError(error, "history_persistence");
      }
    },

    restore: (): URLTrackingState["navigationHistory"] => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            const validEntries = parsed.filter((entry: any) =>
              shouldRetainData(new Date(entry.timestamp))
            );
            return validEntries.map((entry: any) => ({
              ...entry,
              timestamp: new Date(entry.timestamp),
            }));
          }
        }
      } catch (error) {
        handleError(error, "history_restoration");
      }
      return [];
    },
  };

  const getCurrentURL = () => {
    try {
      const targetWindow = getTargetWindow();
      // if (!targetWindow && crossFrameUrlRef.current) {
      //   const rawUrl = crossFrameUrlRef.current
      //   if (!urlProcessingUtils.isValidURL(rawUrl)) {
      //     handleError(new Error("Invalid cross-frame URL format"), "url_validation")
      //     return ""
      //   }
      //   if (!urlProcessingUtils.isDomainAllowed(rawUrl)) {
      //     return ""
      //   }
      //   const sanitizedUrl = urlProcessingUtils.sanitizeURL(rawUrl)
      //   const truncatedUrl = urlProcessingUtils.truncateURL(sanitizedUrl, optionsRef.current.maxUrlLength)
      //   return truncatedUrl
      // }
      if (!targetWindow?.location?.href) return "";
      const rawUrl = targetWindow.location.href;
      if (!urlProcessingUtils.isValidURL(rawUrl)) {
        handleError(new Error("Invalid URL format"), "url_validation");
        return "";
      }
      if (!urlProcessingUtils.isDomainAllowed(rawUrl)) {
        return "";
      }
      const sanitizedUrl = urlProcessingUtils.sanitizeURL(rawUrl);
      const truncatedUrl = urlProcessingUtils.truncateURL(
        sanitizedUrl,
        optionsRef.current.maxUrlLength
      );
      return truncatedUrl;
    } catch (error) {
      handleError(error, "get_current_url");
      return "";
    }
  };

  // const generateFingerprint = async () => {
  //   try {
  //     // TODO: Replace with actual tracking permission check
  //     const isTrackingAllowed = (type: string) => true;

  //     if (fingerprintGeneratedRef.current || !isTrackingAllowed("functional")) {
  //       return fingerprintDataRef.current;
  //     }

  //     const fingerprint = await generateDeviceFingerprint(
  //       isTrackingAllowed("functional"),
  //       {
  //         enableCanvas: true,
  //         enableWebGL: true,
  //         enableAudio: true,
  //         enableFonts: true,
  //         enableBattery: true,
  //         enableWebRTC: true,
  //         enablePlugins: true,
  //         enableMediaDevices: true,
  //         timeout: 5000,
  //         respectPrivacy: true,
  //       }
  //     );

  //     if (fingerprint) {
  //       fingerprintDataRef.current = fingerprint;
  //       fingerprintGeneratedRef.current = true;

  //       setUrlState((prev) => ({
  //         ...prev,
  //         fingerprint,
  //         fingerprintGenerated: true,
  //       }));

  //       console.log("fingerprint", fingerprint);
  //       console.log("Device fingerprint generated:", {
  //         signature: fingerprint.metadata.signature,
  //         confidence: fingerprint.metadata.confidence,
  //         features: Object.keys(fingerprint).filter((k) => k !== "metadata")
  //           .length,
  //       });
  //     }

  //     return fingerprint;
  //   } catch (error) {
  //     handleError(error, "fingerprint_generation");
  //     return null;
  //   }
  // };

  const generateFingerprint = async () => {
    if (!mountedRef.current) return;
    try {
      const isTrackingAllowed = (type: string) => true;
      if (fingerprintGeneratedRef.current || !isTrackingAllowed("functional")) {
        return fingerprintDataRef.current;
      }
      const fingerprint = await generateDeviceFingerprint(
        isTrackingAllowed("functional"),
        {
          enableCanvas: true,
          enableWebGL: true,
          enableAudio: true,
          enableFonts: true,
          enableBattery: true,
          enableWebRTC: true,
          enablePlugins: true,
          enableMediaDevices: true,
          timeout: 5000,
          respectPrivacy: true,
        }
      );
      if (fingerprint && mountedRef.current) {
        fingerprintDataRef.current = fingerprint;
        fingerprintGeneratedRef.current = true;
        setUrlState((prev) => ({
          ...prev,
          fingerprint,
          fingerprintGenerated: true,
        }));
        // console.log('fingerprint', fingerprint)
        // console.log("Device fingerprint generated:", {
        //   signature: fingerprint.metadata.signature,
        //   confidence: fingerprint.metadata.confidence,
        //   features: Object.keys(fingerprint).filter((k) => k !== "metadata").length,
        // })
      }
      return fingerprint;
    } catch (error) {
      handleError(error, "fingerprint_generation");
      return null;
    }
  };

  const analyticsRequestLocks: { [key: string]: number } = {};
  const MIN_ANALYTICS_INTERVAL = 500;

  const processURLChange = (changeType: URLChangeEvent["changeType"]) => {
    if (!mountedRef.current) return;
    try {
      if (checkRateLimit()) return;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        try {
          const currentUrl = getCurrentURL();
          const lockKey = `analytics_lock_${currentUrl}`;
          const now = Date.now();
          if (
            analyticsRequestLocks[lockKey] &&
            now - analyticsRequestLocks[lockKey] < MIN_ANALYTICS_INTERVAL
          ) {
            return;
          }
          analyticsRequestLocks[lockKey] = now;
          if (
            currentUrl &&
            currentUrl !== lastUrlRef.current &&
            currentUrl !== "[INVALID_URL]"
          ) {
            let timeSpentOnPreviousPage: number | undefined;
            if (
              pageVisitTimeRef.current &&
              pageVisitTimeRef.current.url === lastUrlRef.current
            ) {
              timeSpentOnPreviousPage =
                Date.now() - pageVisitTimeRef.current.startTime;
            }
            const previousUrl = lastUrlRef.current;
            const metadata = extractPageMetadata();
            // const referrerContext: ReferrerContext | undefined = urlState.trafficSource
            //   ? {
            //       trafficSource: urlState.trafficSource.type,
            //       category: urlState.trafficSource.category,
            //       source: urlState.trafficSource.source,
            //       isFirstVisit: urlState.referrerData?.isFirstVisit,
            //       sessionReferrer: urlState.referrerData?.sessionReferrer,
            //       referrerPolicy: urlState.referrerData?.referrerPolicy,
            //       protocolDowngrade: urlState.referrerData?.protocolDowngrade,
            //       affiliate: urlState.trafficSource.affiliate,
            //     }
            //   : undefined
            const urlChangeEvent: URLChangeEvent = {
              currentUrl,
              previousUrl,
              changeType,
              timestamp: new Date(),
              timeSpentOnPreviousPage,
              metadata,
              // referrerContext,
            };
            setUrlState((prev) => {
              const newHistoryEntry = {
                url: previousUrl,
                timestamp: new Date(),
                timeSpent: timeSpentOnPreviousPage,
                changeType,
              };
              const updatedHistory = previousUrl
                ? [...prev.navigationHistory, newHistoryEntry].slice(
                    -MAX_HISTORY_ENTRIES
                  )
                : prev.navigationHistory;
              const newState = {
                ...prev,
                currentUrl,
                previousUrl,
                isTracking: true,
                navigationHistory: updatedHistory,
              };
              historyUtils.persist(updatedHistory);
              return newState;
            });
            lastUrlRef.current = currentUrl;
            pageVisitTimeRef.current = {
              startTime: Date.now(),
              url: currentUrl,
            };
            optionsRef.current.onURLChange?.(urlChangeEvent);
            errorCountRef.current = Math.max(0, errorCountRef.current - 1);
          }
        } catch (error) {
          handleError(error, "url_change_processing");
        }
      }, optionsRef.current.debounceMs);
    } catch (error) {
      handleError(error, "url_change_handler");
    }
  };

  const eventHandlers = {
    popstate: () => {
      if (mountedRef.current) processURLChange("popstate");
    },
    hashchange: () => {
      if (mountedRef.current) processURLChange("hashchange");
    },
    visibilitychange: () => {
      if (!document.hidden && mountedRef.current) {
        processURLChange("manual");
      }
    },
    focus: () => {
      if (mountedRef.current) processURLChange("manual");
    },
    // blur: () => {},
  };

  useEffect(() => {
    mountedRef.current = true;
    try {
      const targetWindow = getTargetWindow();
      // if (!targetWindow) {
      //   setupCrossFrameTracking()
      // }
      // if (!targetWindow && !crossFrameUrlRef.current) {
      //   console.warn("No URL tracking method available")
      //   return
      // }
      const initialUrl = getCurrentURL();
      if (initialUrl && initialUrl !== "[INVALID_URL]") {
        const restoredHistory = historyUtils.restore();
        lastUrlRef.current = initialUrl;
        setUrlState((prev) => ({
          ...prev,
          currentUrl: initialUrl,
          previousUrl: "",
          isTracking: true,
          navigationHistory: restoredHistory,
        }));
        pageVisitTimeRef.current = {
          startTime: Date.now(),
          url: initialUrl,
        };
      }
      if (targetWindow) {
        try {
          originalPushStateRef.current = targetWindow.history.pushState;
          originalReplaceStateRef.current = targetWindow.history.replaceState;
          targetWindow.history.pushState = function (
            state: any,
            title: string,
            url?: string | URL | null
          ) {
            try {
              const result = originalPushStateRef.current?.call(
                this,
                state,
                title,
                url
              );
              if (mountedRef.current) processURLChange("pushstate");
              return result;
            } catch (error) {
              handleError(error, "pushstate_override");
              return originalPushStateRef.current?.call(
                this,
                state,
                title,
                url
              );
            }
          };
          targetWindow.history.replaceState = function (
            state: any,
            title: string,
            url?: string | URL | null
          ) {
            try {
              const result = originalReplaceStateRef.current?.call(
                this,
                state,
                title,
                url
              );
              if (mountedRef.current) processURLChange("replacestate");
              return result;
            } catch (error) {
              handleError(error, "replacestate_override");
              return originalReplaceStateRef.current?.call(
                this,
                state,
                title,
                url
              );
            }
          };
          targetWindow.addEventListener("popstate", eventHandlers.popstate);
          targetWindow.addEventListener("hashchange", eventHandlers.hashchange);
          targetWindow.addEventListener("focus", eventHandlers.focus);
          // targetWindow.addEventListener("blur", eventHandlers.blur)
        } catch (error) {
          handleError(error, "event_handler_setup");
        }
      }
      const config = {
        enableVisitorTracking: true,
      };
      const isTrackingAllowed = (type: string) => true;
      if (config.enableVisitorTracking && isTrackingAllowed("functional")) {
        setTimeout(() => {
          if (mountedRef.current) generateFingerprint();
        }, 2000);
      }
      const pollInterval = setInterval(() => {
        try {
          if (!mountedRef.current) return;
          const currentUrl = getCurrentURL();
          if (
            currentUrl &&
            currentUrl !== lastUrlRef.current &&
            currentUrl !== "[INVALID_URL]"
          ) {
            processURLChange("manual");
          }
        } catch (error) {
          handleError(error, "polling");
        }
      }, 2000);
      const cleanupInterval = setInterval(() => {
        if (mountedRef.current) cleanupExpiredData();
      }, 60 * 60 * 1000);
      document.addEventListener(
        "visibilitychange",
        eventHandlers.visibilitychange
      );

      return () => {
        mountedRef.current = false;
        try {
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          clearInterval(pollInterval);
          clearInterval(cleanupInterval);
          // if (parentUrlListenerRef.current) {
          //   window.removeEventListener("message", parentUrlListenerRef.current)
          //   parentUrlListenerRef.current = null
          // }
          if (targetWindow) {
            if (originalPushStateRef.current) {
              targetWindow.history.pushState = originalPushStateRef.current;
            }
            if (originalReplaceStateRef.current) {
              targetWindow.history.replaceState =
                originalReplaceStateRef.current;
            }
            targetWindow.removeEventListener(
              "popstate",
              eventHandlers.popstate
            );
            targetWindow.removeEventListener(
              "hashchange",
              eventHandlers.hashchange
            );
            targetWindow.removeEventListener("focus", eventHandlers.focus);
            // targetWindow.removeEventListener("blur", eventHandlers.blur)
          }
          document.removeEventListener(
            "visibilitychange",
            eventHandlers.visibilitychange
          );
          setUrlState((prev) => ({ ...prev, isTracking: false }));
        } catch (error) {
          console.warn("Cleanup error in URL tracking:", error);
        }
      };
    } catch (error) {
      handleError(error, "effect_initialization");
    }
  }, []);

  const checkForURLChange = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      processURLChange("manual");
    } catch (error) {
      handleError(error, "manual_check");
    }
  }, []);

  const formatDuration = useCallback((milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  return {
    ...urlState,
    checkForURLChange,
    errorCount: errorCountRef.current,
    isRateLimited:
      changeCountRef.current.count >= optionsRef.current.maxChangesPerMinute,
    formatDuration,
    currentPageStartTime: pageVisitTimeRef.current?.startTime,
    clearNavigationHistory: () => {
      if (!mountedRef.current) return;
      setUrlState((prev) => ({ ...prev, navigationHistory: [] }));
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      }
    },
    getPageMetadata: extractPageMetadata,
    cleanupExpiredData,
    shouldRetainData,
    generateFingerprint,
    fingerprintData: fingerprintDataRef.current,
  };
}
