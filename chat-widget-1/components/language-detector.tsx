"use client"

import { useEffect } from "react"
import { useLanguage } from "@/context/language-context"

/**
 * Component that handles automatic language detection and updates
 * Should be mounted early in the app lifecycle
 */
export function LanguageDetector() {
  const { setLanguage, currentLanguage } = useLanguage()

  useEffect(() => {
    // Listen for browser language changes
    const handleLanguageChange = () => {
      // Only auto-update if user hasn't manually set a preference
      if (!localStorage.getItem("chat-widget-language")) {
        const browserLang = navigator.language.split("-")[0] as any
        if (browserLang !== currentLanguage) {
          console.log("[LanguageDetector] Browser language changed to:", browserLang)
          // Note: Only update if it's a supported language
          // This would need validation against SUPPORTED_LANGUAGES
        }
      }
    }

    // Listen for storage changes (language preference from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "chat-widget-language" && e.newValue) {
        const newLanguage = e.newValue as any
        if (newLanguage !== currentLanguage) {
          console.log("[LanguageDetector] Language preference changed in another tab:", newLanguage)
          setLanguage(newLanguage)
        }
      }
    }

    window.addEventListener("languagechange", handleLanguageChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("languagechange", handleLanguageChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [currentLanguage, setLanguage])

  // This component doesn't render anything
  return null
}
