"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { SupportedLanguage } from "@/lib/i18n/types"
import { getCurrentLanguage, storeLanguage, isRTLLanguage, getGeographicLanguage } from "@/lib/i18n/utils"

interface LanguageContextType {
  currentLanguage: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
  isRTL: boolean
  direction: "ltr" | "rtl"
  isDetecting: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>("en")
  const [isDetecting, setIsDetecting] = useState(true)

  // Enhanced language detection on mount with browser language priority
  useEffect(() => {
    async function detectLanguage() {
      try {
        setIsDetecting(true)

        // Priority: browser language > stored preference > geographic detection > default
        let detectedLanguage: SupportedLanguage = "en"
        
        // First, try to detect browser language
        if (typeof window !== "undefined") {
          const browserLang = navigator.language || navigator.languages?.[0]
          console.log(`[LanguageProvider] Browser languages:`, navigator.languages)
          console.log(`[LanguageProvider] Primary browser language:`, browserLang)
          if (browserLang) {
            const primaryLang = browserLang.split("-")[0] as SupportedLanguage
            console.log(`[LanguageProvider] Primary language code:`, primaryLang)
            // Check if the detected language is supported
            if (primaryLang && ["en", "ar", "he", "fa", "ur", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "ja", "ko", "zh", "hi"].includes(primaryLang)) {
              detectedLanguage = primaryLang
              console.log(`[LanguageProvider] Browser language detected: ${browserLang}, using: ${primaryLang}`)
            } else {
              console.log(`[LanguageProvider] Unsupported language: ${primaryLang}, falling back to default`)
            }
          }
        }

        // If no browser language or unsupported, check stored preference
        if (detectedLanguage === "en") {
          const storedLang = getCurrentLanguage()
          if (storedLang !== "en") {
            detectedLanguage = storedLang
            console.log(`[LanguageProvider] Using stored language: ${storedLang}`)
          }
        }

        // If still default, try geographic detection
        if (detectedLanguage === "en") {
          const geoLanguage = await getGeographicLanguage()
          if (geoLanguage) {
            detectedLanguage = geoLanguage
            console.log(`[LanguageProvider] Using geographic language: ${geoLanguage}`)
          }
        }

        setCurrentLanguage(detectedLanguage)

        // Update document attributes for RTL support immediately
        updateDocumentAttributes(detectedLanguage)
      } catch (error) {
        console.warn("[LanguageProvider] Detection failed, using default:", error)
        setCurrentLanguage("en")
      } finally {
        setIsDetecting(false)
      }
    }

    detectLanguage()
  }, [])

  // Enhanced function to update document attributes for RTL text direction only
  const updateDocumentAttributes = useCallback((language: SupportedLanguage) => {
    if (typeof document !== "undefined") {
      const html = document.documentElement
      const body = document.body
      const isRTL = isRTLLanguage(language)
      const direction = isRTL ? "rtl" : "ltr"

      console.log(`[LanguageProvider] Updating document attributes:`, { language, isRTL, direction })

      // Update main document - only direction and language attributes
      html.setAttribute("lang", language)
      html.setAttribute("dir", direction)
      
      if (body) {
        body.setAttribute("dir", direction)
        body.setAttribute("lang", language)
      }

      // Add/remove CSS class for RTL styling - only for text direction
      if (isRTL) {
        html.classList.add("rtl")
        body?.classList.add("rtl")
      } else {
        html.classList.remove("rtl")
        body?.classList.remove("rtl")
      }

      // Find and update widget containers if they exist - only direction attributes
      const widgetSelectors = [
        '[data-widget-container="true"]',
        '.chat-widget-container',
        '#chat-widget',
        '.chat-widget-embedded',
        '.chat-input-container',
        '[class*="widget"]',
        '.chat-widget',
        '[id*="widget"]'
      ]

      let updatedContainers = 0
      widgetSelectors.forEach(selector => {
        const containers = document.querySelectorAll(selector)
        containers.forEach((container) => {
          if (container instanceof HTMLElement) {
            // Only update direction and language attributes, don't change layout
            container.setAttribute("dir", direction)
            container.setAttribute("lang", language)
            
            // Add/remove RTL class for CSS styling
            if (isRTL) {
              container.classList.add("rtl")
            } else {
              container.classList.remove("rtl")
            }
            updatedContainers++
          }
        })
      })

      console.log(`[LanguageProvider] Updated ${updatedContainers} widget containers with RTL direction`)
      
      // Add CSS custom properties for RTL styling
      if (isRTL) {
        document.documentElement.style.setProperty('--widget-direction', direction)
        document.documentElement.style.setProperty('--widget-language', language)
        document.documentElement.style.setProperty('--widget-rtl', 'true')
        document.documentElement.style.setProperty('--widget-update-timestamp', Date.now().toString())
      } else {
        document.documentElement.style.setProperty('--widget-direction', direction)
        document.documentElement.style.setProperty('--widget-language', language)
        document.documentElement.style.setProperty('--widget-rtl', 'false')
        document.documentElement.style.setProperty('--widget-update-timestamp', Date.now().toString())
      }

      // Dispatch custom event for widgets to listen to
      const languageChangeEvent = new CustomEvent('widgetLanguageChange', {
        detail: {
          language,
          isRTL,
          direction
        }
      })
      document.dispatchEvent(languageChangeEvent)
      window.dispatchEvent(languageChangeEvent)

      // Force a reflow to ensure changes are applied
      document.body?.offsetHeight
    }
  }, [])

  const setLanguage = useCallback((language: SupportedLanguage) => {
    console.log(`[LanguageProvider] Language changed to: ${language}`)
    setCurrentLanguage(language)
    storeLanguage(language)
    updateDocumentAttributes(language)
  }, [updateDocumentAttributes])

  // Use useEffect to update DOM attributes when language changes
  useEffect(() => {
    updateDocumentAttributes(currentLanguage)
  }, [currentLanguage, updateDocumentAttributes])

  // Listen for language changes from other sources (like widget)
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      const { language } = event.detail
      if (language && language !== currentLanguage) {
        console.log(`[LanguageProvider] Received language change event: ${language}`)
        setCurrentLanguage(language)
        updateDocumentAttributes(language)
      }
    }

    // Listen for custom events
    document.addEventListener('widgetLanguageChange', handleLanguageChange as EventListener)
    window.addEventListener('widgetLanguageChange', handleLanguageChange as EventListener)

    return () => {
      document.removeEventListener('widgetLanguageChange', handleLanguageChange as EventListener)
      window.removeEventListener('widgetLanguageChange', handleLanguageChange as EventListener)
    }
  }, [currentLanguage, updateDocumentAttributes])

  // Calculate RTL status based on current language
  const isRTL = isRTLLanguage(currentLanguage)
  const direction = isRTL ? "rtl" : "ltr"

  // Debug current language state
  useEffect(() => {
    console.log(`[LanguageProvider] Current language state:`, { currentLanguage, isRTL, direction })
  }, [currentLanguage, isRTL, direction])

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isRTL,
    direction,
    isDetecting,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
