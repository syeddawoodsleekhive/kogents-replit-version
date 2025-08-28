"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface TranslationProviderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Wrapper component that handles translation loading states
 * and prevents layout shift during language changes
 */
export function TranslationProvider({ children, fallback }: TranslationProviderProps) {
  const { isLoading, error, currentLanguage } = useTranslation()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show fallback during SSR or while loading
  if (!isClient || isLoading) {
    return (
      <div className="i18n-loading">
        {fallback || (
          <div className="translation-placeholder animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        )}
      </div>
    )
  }

  // Show error state
  if (error) {
    console.error("[TranslationProvider] Translation error:", error)
    return <div className="i18n-loaded">{children}</div>
  }

  // Show translated content
  return (
    <div
      className={cn("i18n-loaded", `lang-${currentLanguage}`)}
      key={currentLanguage} // Force re-render on language change
    >
      {children}
    </div>
  )
}
