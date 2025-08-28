"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { TranslationKeys, SupportedLanguage } from "@/lib/i18n/types"
import { getCurrentLanguage, storeLanguage, isRTLLanguage, getGeographicLanguage } from "@/lib/i18n/utils"
import { loadTranslation, preloadTranslations } from "@/lib/i18n/lazy-loader"
import { useLanguage } from "@/context/language-context"

/**
 * Custom hook for internationalization with optimized loading
 */
export function useTranslation() {
  const { currentLanguage, setLanguage } = useLanguage()
  const [translations, setTranslations] = useState<TranslationKeys | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTranslations = useCallback(async (language: SupportedLanguage) => {
    try {
      setIsLoading(true)
      setError(null)

      // console.log(`[useTranslation] Loading translations for language: ${language}`)

      // Load current language
      const loadedTranslations = await loadTranslation(language)
      // console.log(`[useTranslation] Loaded translations:`, loadedTranslations ? 'success' : 'failed')
      setTranslations(loadedTranslations)

      const browserLanguages = navigator.languages || [navigator.language]
      const likelyLanguages = browserLanguages
        .map((lang) => lang.split("-")[0] as SupportedLanguage)
        .filter((lang) => lang !== language)
        .slice(0, 2)

      if (likelyLanguages.length > 0) {
        // Preload in background without blocking UI
        setTimeout(() => preloadTranslations(likelyLanguages), 100)
      }
    } catch (err) {
      setError("Failed to load translations")
      console.error("[i18n] Translation loading failed:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load translations when language changes
  useEffect(() => {
    loadTranslations(currentLanguage)
  }, [currentLanguage, loadTranslations])

  const t = useCallback(
    (key: string, fallback?: string): string => {
      if (!translations) {
        // console.log(`[useTranslation] No translations loaded for key: ${key}`)
        return fallback || key
      }

      try {
        // Navigate nested object using dot notation (e.g., 'chat.input.placeholder')
        const keys = key.split(".")
        let value: any = translations

        for (const k of keys) {
          value = value?.[k]
          if (value === undefined) break
        }

        if (typeof value === "string") {
          return value
        } else {
          // console.log(`[useTranslation] Translation key not found: ${key}, value:`, value)
        }
      } catch (err) {
        // Only log in development to reduce production noise
        if (process.env.NODE_ENV === "development") {
          console.warn(`[i18n] Translation key not found: ${key}`)
        }
      }

      return fallback || key
    },
    [translations],
  )

  const changeLanguage = useCallback(
    async (language: SupportedLanguage) => {
      // Update UI immediately for better UX
      setLanguage(language)
      storeLanguage(language)

      // Load translations in background
      loadTranslations(language)
    },
    [loadTranslations, setLanguage],
  )

  // RTL detection
  const isRTL = useMemo(() => isRTLLanguage(currentLanguage), [currentLanguage])

  // Direction for CSS
  const direction = isRTL ? "rtl" : "ltr"

  return {
    t,
    currentLanguage,
    changeLanguage,
    isRTL,
    direction,
    isLoading,
    error,
    translations,
  }
}

/**
 * Hook for components that only need the translation function
 */
export function useT() {
  const { t } = useTranslation()
  return t
}
