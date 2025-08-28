import type { TranslationKeys, SupportedLanguage } from "./types"

// Translation cache with size limit to prevent memory bloat
const MAX_CACHE_SIZE = 10
const translationCache = new Map<SupportedLanguage, TranslationKeys>()
const cacheAccessOrder: SupportedLanguage[] = []

/**
 * Manages translation cache with LRU eviction
 */
function manageCacheSize() {
  if (translationCache.size > MAX_CACHE_SIZE) {
    // Remove least recently used translation
    const oldestLanguage = cacheAccessOrder.shift()
    if (oldestLanguage) {
      translationCache.delete(oldestLanguage)
    }
  }
}

/**
 * Updates cache access order for LRU management
 */
function updateCacheAccess(language: SupportedLanguage) {
  const existingIndex = cacheAccessOrder.indexOf(language)
  if (existingIndex > -1) {
    cacheAccessOrder.splice(existingIndex, 1)
  }
  cacheAccessOrder.push(language)
}

/**
 * Lazy loads translation files with optimized caching
 */
export async function loadTranslation(language: SupportedLanguage): Promise<TranslationKeys> {
  // Check cache first
  if (translationCache.has(language)) {
    updateCacheAccess(language)
    return translationCache.get(language)!
  }

  try {
    const translationModule = await import(
      /* webpackChunkName: "locale-[request]" */
      /* webpackPreload: true */
      `./locales/${language}.json`
    )

    const translations = translationModule.default as TranslationKeys

    // Cache with size management
    manageCacheSize()
    translationCache.set(language, translations)
    updateCacheAccess(language)

    return translations
  } catch (error) {
    console.warn(`[i18n] Failed to load ${language}, falling back to English`)

    // Fallback to English with caching
    if (language !== "en") {
      return loadTranslation("en")
    }

    throw new Error(`Critical: Could not load translations for ${language}`)
  }
}

/**
 * Preloads translations for better UX
 */
export function preloadTranslations(languages: SupportedLanguage[]): void {
  // Only preload if not already cached and limit concurrent loads
  const toPreload = languages.filter((lang) => !translationCache.has(lang)).slice(0, 3)

  toPreload.forEach((language) => {
    loadTranslation(language).catch((error) => {
      console.warn(`[i18n] Preload failed for ${language}:`, error)
    })
  })
}

/**
 * Gets cache statistics for debugging
 */
export function getCacheStats() {
  return {
    size: translationCache.size,
    maxSize: MAX_CACHE_SIZE,
    languages: Array.from(translationCache.keys()),
    accessOrder: [...cacheAccessOrder],
  }
}
