import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === "undefined") return; // Prevent errors during SSR

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Update state when the media query changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Attach listener for screen resize
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup to prevent memory leaks
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []); // Runs once on mount

  return !!isMobile; // Always return boolean
}
