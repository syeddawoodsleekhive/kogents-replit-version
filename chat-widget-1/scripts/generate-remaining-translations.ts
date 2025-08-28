/**
 * Script to generate remaining translation files using translation services
 * Run with: npm run generate-translations
 */

import fs from "fs"
import path from "path"

// Base English translations to translate from
const baseTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, "../lib/i18n/locales/en.json"), "utf8"))

// Languages that need translation files generated
const missingLanguages = [
  "tr",
  "sv",
  "da",
  "no",
  "fi",
  "cs",
  "sk",
  "hu",
  "ro",
  "bg",
  "hr",
  "sr",
  "sl",
  "et",
  "lv",
  "lt",
  "uk",
  "be",
  "mk",
  "sq",
  "mt",
  "is",
  "ga",
  "cy",
  "eu",
  "ca",
  "gl",
  "ast",
  "oc",
  "co",
  "sc",
  "rm",
  "fur",
  "lld",
  "vec",
  "lmo",
  "pms",
  "th",
  "vi",
  "id",
  "ms",
  "tl",
  "sw",
  "am",
  "ti",
  "om",
  "so",
  "mg",
  "ny",
  "sn",
  "zu",
  "bn",
]

// Language name mappings for translation services
const languageNames: Record<string, string> = {
  tr: "Turkish",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  cs: "Czech",
  sk: "Slovak",
  hu: "Hungarian",
  ro: "Romanian",
  bg: "Bulgarian",
  hr: "Croatian",
  sr: "Serbian",
  sl: "Slovenian",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  uk: "Ukrainian",
  be: "Belarusian",
  mk: "Macedonian",
  sq: "Albanian",
  mt: "Maltese",
  is: "Icelandic",
  ga: "Irish",
  cy: "Welsh",
  eu: "Basque",
  ca: "Catalan",
  gl: "Galician",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  tl: "Filipino",
  sw: "Swahili",
  bn: "Bengali",
}

/**
 * Recursively translate nested objects
 */
function translateObject(obj: any, targetLanguage: string): any {
  if (typeof obj === "string") {
    // In a real implementation, this would call a translation API
    // For now, we'll create placeholder translations
    return `[${targetLanguage.toUpperCase()}] ${obj}`
  }

  if (typeof obj === "object" && obj !== null) {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = translateObject(value, targetLanguage)
    }
    return result
  }

  return obj
}

/**
 * Generate translation file for a language
 */
function generateTranslationFile(languageCode: string) {
  const translated = translateObject(baseTranslations, languageCode)
  const outputPath = path.join(__dirname, `../lib/i18n/locales/${languageCode}.json`)

  fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2), "utf8")
  console.log(`Generated translation file: ${languageCode}.json`)
}

/**
 * Main execution
 */
function main() {
  console.log("Generating missing translation files...")
  console.log(`Languages to generate: ${missingLanguages.length}`)

  missingLanguages.forEach(generateTranslationFile)

  console.log("\n✅ All translation files generated!")
  console.log("\n📝 Note: These are placeholder translations.")
  console.log("   Replace with professional translations for production use.")
  console.log("   Consider using services like Google Translate API, DeepL, or professional translators.")
}

if (require.main === module) {
  main()
}
