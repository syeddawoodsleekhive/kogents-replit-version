"use client";

import { useState, useEffect, useCallback } from "react";

export function useWindowFocus() {
  const [isFocused, setIsFocused] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Trigger a short "transitioning" state for smooth UI updates
  const triggerTransition = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 200); // 200ms for smoother UI
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      setIsFocused(true);
      triggerTransition();
    };

    const handleBlur = () => {
      setIsFocused(false);
      triggerTransition();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [triggerTransition]);

  return { 
    isFocused, 
    isTransitioning, 
    // Expose trigger if we want to control transitions manually
    // triggerTransition 
  };
}
