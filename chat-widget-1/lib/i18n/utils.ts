import { type SupportedLanguage, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, RTL_LANGUAGES } from "./languages"

/**
 * Detects the user's preferred language from browser settings
 */
export function detectUserLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE

  // Get browser languages in order of preference
  const browserLanguages = navigator.languages || [navigator.language]

  for (const lang of browserLanguages) {
    // Extract language code (e.g., 'en-US' -> 'en')
    const langCode = lang.split("-")[0].toLowerCase() as SupportedLanguage

    // Check if we support this language
    if (SUPPORTED_LANGUAGES[langCode]) {
      return langCode
    }
  }

  return DEFAULT_LANGUAGE
}

/**
 * Gets the stored language preference from localStorage
 */
export function getStoredLanguage(): SupportedLanguage | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem("chat-widget-language")
    if (stored && SUPPORTED_LANGUAGES[stored as SupportedLanguage]) {
      return stored as SupportedLanguage
    }
  } catch (error) {
    console.warn("[i18n] Failed to read stored language:", error)
  }

  return null
}

/**
 * Stores the language preference in localStorage
 */
export function storeLanguage(language: SupportedLanguage): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("chat-widget-language", language)
  } catch (error) {
    console.warn("[i18n] Failed to store language:", error)
  }
}

/**
 * Determines the current language to use
 */
export function getCurrentLanguage(): SupportedLanguage {
  // Priority: stored preference > browser detection > default
  return getStoredLanguage() || detectUserLanguage()
}

/**
 * Checks if a language uses right-to-left text direction
 */
export function isRTLLanguage(language: SupportedLanguage): boolean {
  return RTL_LANGUAGES.includes(language)
}

/**
 * Gets geographic location for enhanced language detection
 */
export async function getGeographicLanguage(): Promise<SupportedLanguage | null> {
  try {
    // Use a simple IP geolocation service
    const response = await fetch("https://ipapi.co/json/")
    const data = await response.json()

    // Map country codes to languages
    const countryLanguageMap: Record<string, SupportedLanguage> = {
      ES: "es",
      MX: "es",
      AR: "es",
      CO: "es",
      PE: "es",
      FR: "fr",
      CA: "fr",
      BE: "fr",
      CH: "fr",
      DE: "de",
      AT: "de",
      IT: "it",
      PT: "pt",
      BR: "pt",
      NL: "nl",
      PL: "pl",
      RU: "ru",
      JP: "ja",
      KR: "ko",
      CN: "zh",
      TW: "zh",
      HK: "zh",
      SA: "ar",
      AE: "ar",
      EG: "ar",
      JO: "ar",
      IL: "he",
    }

    return countryLanguageMap[data.country_code] || null
  } catch (error) {
    console.warn("[i18n] Geographic detection failed:", error)
    return null
  }
}
