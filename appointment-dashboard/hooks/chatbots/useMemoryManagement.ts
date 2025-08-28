"use client"

import { useEffect, useRef, useCallback, useMemo } from "react"

export function useMemoryManagement() {
  const trackedEvents = useRef<Map<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>>(
    new Map(),
  ).current
  const trackedTimeouts = useRef<Set<NodeJS.Timeout>>(new Set()).current

  const addEventListener = useCallback(
    (
      target: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions,
    ) => {
      if (!trackedEvents.has(target)) {
        trackedEvents.set(target, new Map())
      }
      if (!trackedEvents.get(target)!.has(type)) {
        trackedEvents.get(target)!.set(type, new Set())
      }
      trackedEvents.get(target)!.get(type)!.add(listener)
      target.addEventListener(type, listener, options)
    },
    [trackedEvents],
  )

  const removeEventListener = useCallback(
    (target: EventTarget, type: string, listener: EventListenerOrEventListenerObject) => {
      target.removeEventListener(type, listener)
      if (trackedEvents.has(target) && trackedEvents.get(target)!.has(type)) {
        trackedEvents.get(target)!.get(type)!.delete(listener)
      }
    },
    [trackedEvents],
  )

  const customSetTimeout = useCallback(
    (callback: (...args: any[]) => void, ms: number, ...argsToPass: any[]): NodeJS.Timeout => {
      if (typeof callback !== "function") {
        console.error(
          "useMemoryManagement.addTimer (customSetTimeout) was called with a non-function callback.",
          "Received:",
          callback,
          "Type:",
          typeof callback,
          "Arguments to pass:",
          argsToPass,
        )
        // Throw a more specific error immediately to help pinpoint the misuse.
        throw new TypeError(
          `useMemoryManagement.addTimer: callback argument must be a function. Received type: ${typeof callback}`,
        )
      }

      const timeoutId = setTimeout(() => {
        // This callback is from the closure. If it passed the check above, it was a function.
        trackedTimeouts.delete(timeoutId)
        callback(...argsToPass)
      }, ms)
      trackedTimeouts.add(timeoutId)
      return timeoutId
    },
    [trackedTimeouts],
  )

  const customClearTimeout = useCallback(
    (timeoutId: NodeJS.Timeout) => {
      if (timeoutId) {
        // Add a check for null/undefined timeoutId
        clearTimeout(timeoutId)
        trackedTimeouts.delete(timeoutId)
      }
    },
    [trackedTimeouts],
  )

  useEffect(() => {
    return () => {
      // Cleanup all registered event listeners
      trackedEvents.forEach((types, target) => {
        types.forEach((listeners, type) => {
          listeners.forEach((listener) => {
            target.removeEventListener(type, listener)
          })
        })
      })
      trackedEvents.clear()

      // Cleanup all registered timeouts
      trackedTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
      trackedTimeouts.clear()
    }
  }, [trackedEvents, trackedTimeouts])

  return useMemo(
    () => ({
      addEventListener,
      removeEventListener,
      addTimer: customSetTimeout,
      clearTimer: customClearTimeout,
    }),
    [addEventListener, removeEventListener, customSetTimeout, customClearTimeout],
  )
}
