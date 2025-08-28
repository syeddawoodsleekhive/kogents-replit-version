import { useCallback } from "react";

/**
 * useActionLogger - React hook for tracking actions in the console.
 * @returns {function} logAction(action: string, data?: any): void
 */
export function useActionLogger() {
  return useCallback((action: string, data?: any) => {
    console.log(`[TRACK] ${action}`, data ?? "");
  }, []);
}
