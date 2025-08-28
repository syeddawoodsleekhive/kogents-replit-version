"use client"

import { useEffect } from "react"
import { useLanguage } from "@/context/language-context"

/**
 * Hook that automatically applies RTL text direction to the current component
 * when the language context changes - without affecting layout structure
 */
export function useAutoRTL() {
  const { isRTL, direction, currentLanguage } = useLanguage()

  useEffect(() => {
    if (typeof document !== "undefined") {
      // Find the current component's root element
      const currentElement = document.querySelector('[data-auto-rtl="true"]') || 
                           document.querySelector('main') || 
                           document.body

      if (currentElement instanceof HTMLElement) {
        // Only update direction and language attributes - don't change layout
        currentElement.setAttribute("dir", direction)
        currentElement.setAttribute("lang", currentLanguage)
        
        // Add/remove RTL class for CSS styling only
        if (isRTL) {
          currentElement.classList.add("rtl")
        } else {
          currentElement.classList.remove("rtl")
        }

        console.log(`[useAutoRTL] Updated element with RTL direction:`, {
          element: currentElement.tagName,
          direction,
          language: currentLanguage,
          isRTL,
          note: "Only text direction applied, layout unchanged"
        })
      }
    }
  }, [isRTL, direction, currentLanguage])

  return { isRTL, direction, currentLanguage }
}

/**
 * Hook that only returns the RTL direction
 */
export function useRTLDirection() {
  const { direction } = useLanguage()
  return direction
}

/**
 * Hook that only returns the RTL boolean
 */
export function useRTLBoolean() {
  const { isRTL } = useLanguage()
  return isRTL
} 