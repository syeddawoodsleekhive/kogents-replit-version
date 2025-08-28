"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

export const DEFAULT_BOTTOM_THRESHOLD = 112;
export const MIN_BOTTOM_THRESHOLD = 64;
export const MAX_BOTTOM_THRESHOLD = 128;

type UseAutoScrollOptions = {
  /**
   * A ref to the scrollable container (e.g., the message list div with overflow-y-auto)
   */
  containerRef: React.RefObject<HTMLElement | null>;
  /**
   * Number of pixels from the bottom within which we consider "at bottom"
   * Default: DEFAULT_BOTTOM_THRESHOLD (112). Clamped to 64–128px.
   */
  bottomThreshold?: number;
  /**
   * If true, disables auto-scroll behavior (e.g., when searching)
   * Default: false
   */
  disableAutoScroll?: boolean;
  /**
   * Current number of items in the list (used to detect new messages)
   */
  itemsLength: number;
  /**
   * Whether the last message was sent by the user
   * If true, we force scroll to bottom to reflect user's action
   */
  lastMessageFromUser?: boolean;
};

/**
 * Smart auto-scroll hook inspired by production chat widgets:
 * - Detects user intent: stops auto-scroll when user scrolls up
 * - Threshold-based bottom detection
 * - Batches new messages when user is not at bottom (exposes newItems count)
 * - rAF-based scrolling for smoothness
 * - Debounced onScroll for performance
 * - Handles dynamic content height changes with ResizeObserver
 */
export function useAutoScroll({
  containerRef,
  bottomThreshold = DEFAULT_BOTTOM_THRESHOLD,
  disableAutoScroll = false,
  itemsLength,
  lastMessageFromUser,
}: UseAutoScrollOptions) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newItems, setNewItems] = useState(0);

  const prevLengthRef = useRef(itemsLength);
  const rafIdRef = useRef<number | null>(null);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mountedRef = useRef(false);

  const computeIsAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const threshold = Math.min(
      MAX_BOTTOM_THRESHOLD,
      Math.max(
        MIN_BOTTOM_THRESHOLD,
        bottomThreshold ?? DEFAULT_BOTTOM_THRESHOLD
      )
    );
    return distanceFromBottom <= threshold;
  }, [bottomThreshold, containerRef]);

  const cancelRaf = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      const container = containerRef.current;
      if (!container) return;

      cancelRaf();
      rafIdRef.current = requestAnimationFrame(() => {
        try {
          if ("scrollTo" in container) {
            // Some elements support scrollTo; fallback to scrollTop otherwise
            container.scrollTo({
              top: container.scrollHeight,
              behavior: smooth ? "smooth" : "auto",
            });
          } else {
            // @ts-expect-error - scrollTo exists on HTMLElement in modern browsers
            container.scrollTop = container.scrollHeight;
          }
        } catch {
          // Fallback on any error
          container.scrollTop = container.scrollHeight;
        } finally {
          rafIdRef.current = null;
        }
      });
    },
    [cancelRaf, containerRef]
  );

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(() => {
      const atBottomNow = computeIsAtBottom();
      setIsAtBottom(atBottomNow);
    }, 100);
  }, [computeIsAtBottom, containerRef]);

  // Track new items and auto-scroll decision
  useEffect(() => {
    if (!mountedRef.current) return;

    const prevLength = prevLengthRef.current;
    const hasNew = itemsLength > prevLength;

    if (!hasNew) return;

    prevLengthRef.current = itemsLength;

    if (disableAutoScroll) {
      if (!isAtBottom) setNewItems((c) => c + (itemsLength - prevLength));
      return;
    }

    // Always scroll for user's own messages (including file attachments)
    if (lastMessageFromUser) {
      // Add a longer delay for file attachments to ensure they're fully rendered
      // This helps with images, videos, and other files that need time to load
      setTimeout(() => {
        scrollToBottom(true);
        setNewItems(0);
        setIsAtBottom(true);
      }, 300);
      return;
    }

    if (isAtBottom) {
      scrollToBottom(true);
      setNewItems(0);
    } else {
      setNewItems((c) => c + (itemsLength - prevLength));
    }
  }, [
    itemsLength,
    isAtBottom,
    disableAutoScroll,
    lastMessageFromUser,
    scrollToBottom,
  ]);

  // Initialize state and observers
  useEffect(() => {
    mountedRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    // Initial bottom sync
    setIsAtBottom(computeIsAtBottom());

    // Listen to scroll
    container.addEventListener("scroll", handleScroll, { passive: true });

    // Observe size changes to maintain bottom pin (e.g., images loading)
    if ("ResizeObserver" in window) {
      resizeObserverRef.current = new ResizeObserver(() => {
        // Only auto-scroll on resize changes if we are already at bottom
        if (!disableAutoScroll && computeIsAtBottom()) {
          scrollToBottom(false);
          setIsAtBottom(true);
          setNewItems(0);
        }
      });
      // Observe the scroll container; alternatively, observe its first child if you have one dedicated wrapper
      resizeObserverRef.current.observe(container);
    }

    return () => {
      mountedRef.current = false;

      container.removeEventListener("scroll", handleScroll);

      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch {}
        resizeObserverRef.current = null;
      }

      cancelRaf();

      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
        scrollDebounceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    containerRef,
    handleScroll,
    computeIsAtBottom,
    scrollToBottom,
    disableAutoScroll,
  ]);

  const resetNewItems = useCallback(() => setNewItems(0), []);

  return useMemo(
    () => ({
      isAtBottom,
      newItems,
      onScroll: handleScroll,
      scrollToBottom,
      resetNewItems,
    }),
    [handleScroll, isAtBottom, newItems, resetNewItems, scrollToBottom]
  );
}
