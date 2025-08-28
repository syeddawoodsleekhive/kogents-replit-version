"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/context/language-context"
import { loadTranslation } from "@/lib/i18n/lazy-loader"
import type { TranslationKeys } from "@/lib/i18n/types"

/**
 * Hook that automatically translates content based on the current language
 * and provides a translation function for easy use
 */
export function useAutoTranslate() {
  const { currentLanguage } = useLanguage()
  const [translations, setTranslations] = useState<TranslationKeys | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load translations when language changes
  useEffect(() => {
    async function loadTranslations() {
      try {
        setIsLoading(true)
        const loadedTranslations = await loadTranslation(currentLanguage)
        setTranslations(loadedTranslations)
      } catch (error) {
        console.error(`[useAutoTranslate] Failed to load translations for ${currentLanguage}:`, error)
        // Fallback to English if translation fails
        try {
          const englishTranslations = await loadTranslation("en")
          setTranslations(englishTranslations)
        } catch (fallbackError) {
          console.error("[useAutoTranslate] Fallback to English also failed:", fallbackError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadTranslations()
  }, [currentLanguage])

  // Translation function
  const t = (key: string, fallback?: string): string => {
    if (!translations) {
      return fallback || key
    }

    try {
      // Navigate nested object using dot notation (e.g., 'mainPage.title')
      const keys = key.split(".")
      let value: any = translations

      for (const k of keys) {
        value = value?.[k]
        if (value === undefined) break
      }

      if (typeof value === "string") {
        return value
      }
    } catch (err) {
      console.warn(`[useAutoTranslate] Translation key not found: ${key}`)
    }

    return fallback || key
  }

  return {
    t,
    currentLanguage,
    isLoading,
    translations
  }
}

/**
 * Hook that only provides the translation function
 */
export function useTranslate() {
  const { t } = useAutoTranslate()
  return t
}

/**
 * Hook that provides translation with loading state
 */
export function useTranslateWithLoading() {
  const { t, isLoading } = useAutoTranslate()
  return { t, isLoading }
} 