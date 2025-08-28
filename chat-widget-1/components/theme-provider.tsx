'use client';

import * as React from 'react';
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  /** 
   * Guard: Prevent theme changes from affecting widget scripts.
   * If needed, uncomment the `preventThemeConflict` call. 
   */
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).KogentsChatWidget) {
      // Commented out: Prevent theme provider from modifying widget script styles
      // (window as any).KogentsChatWidget.preventThemeConflict?.();
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;

  /**
   * Developer Note:
   * ThemeProvider is isolated from widget scripts.
   * If you experience conflicts, ensure widget script styles
   * are not overridden by theme changes.
   */
}
