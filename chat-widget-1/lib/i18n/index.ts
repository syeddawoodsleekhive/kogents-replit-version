// Re-export everything for easy imports
export * from "./types"
export * from "./languages"
export * from "./utils"
export * from "./lazy-loader"
export { useTranslation, useT } from "@/hooks/use-translation"

export { LanguageProvider, useLanguage } from "@/context/language-context"

// Default export for convenience
export { useTranslation as default } from "@/hooks/use-translation"
