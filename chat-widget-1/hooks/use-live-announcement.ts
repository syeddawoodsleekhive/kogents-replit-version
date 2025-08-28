import { useEffect, useRef, useState } from "react";

/**
 * Manages ARIA live region updates for accessibility.
 * Provides:
 * - liveRegionRef: ref to attach to the live region element
 * - announce: function to update the live message
 * - announcement: current announcement text
 */
export function useLiveAnnouncement(clearAfter: number = 1200) {
  const [announcement, setAnnouncement] = useState<string>("");
  const liveRegionRef = useRef<HTMLDivElement>(null);

  /** Announce a new message */
  const announce = (message: string) => {
    setAnnouncement(message);
    if (liveRegionRef.current) liveRegionRef.current.textContent = message;
  };

  /** Auto-clear announcement after given delay */
  useEffect(() => {
    if (!announcement) return;
    const timer = setTimeout(() => setAnnouncement(""), clearAfter);
    return () => clearTimeout(timer);
  }, [announcement, clearAfter]);

  return { liveRegionRef, announce, announcement };
}
