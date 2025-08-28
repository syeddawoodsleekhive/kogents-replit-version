import type { LanguageConfig, SupportedLanguage } from "./types"

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  // Tier 1 - Major Languages (existing)
  en: { code: "en", name: "English", nativeName: "English" },
  es: { code: "es", name: "Spanish", nativeName: "Español" },
  fr: { code: "fr", name: "French", nativeName: "Français" },
  de: { code: "de", name: "German", nativeName: "Deutsch" },
  it: { code: "it", name: "Italian", nativeName: "Italiano" },
  pt: { code: "pt", name: "Portuguese", nativeName: "Português" },
  nl: { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  pl: { code: "pl", name: "Polish", nativeName: "Polski" },
  ru: { code: "ru", name: "Russian", nativeName: "Русский" },
  ja: { code: "ja", name: "Japanese", nativeName: "日本語" },
  ko: { code: "ko", name: "Korean", nativeName: "한국어" },
  zh: { code: "zh", name: "Chinese", nativeName: "中文" },
  
  // RTL Languages
  ar: { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true },
  he: { code: "he", name: "Hebrew", nativeName: "עברית", rtl: true },

  // Tier 2 - Popular Regional Languages
  hi: { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  bn: { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  ur: { code: "ur", name: "Urdu", nativeName: "اردو", rtl: true },
  fa: { code: "fa", name: "Persian", nativeName: "فارسی", rtl: true },
  tr: { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  sv: { code: "sv", name: "Swedish", nativeName: "Svenska" },
  da: { code: "da", name: "Danish", nativeName: "Dansk" },
  no: { code: "no", name: "Norwegian", nativeName: "Norsk" },
  fi: { code: "fi", name: "Finnish", nativeName: "Suomi" },
  cs: { code: "cs", name: "Czech", nativeName: "Čeština" },
  sk: { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
  hu: { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  ro: { code: "ro", name: "Romanian", nativeName: "Română" },
  bg: { code: "bg", name: "Bulgarian", nativeName: "Български" },
  hr: { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
  sr: { code: "sr", name: "Serbian", nativeName: "Српски" },
  sl: { code: "sl", name: "Slovenian", nativeName: "Slovenščina" },
  et: { code: "et", name: "Estonian", nativeName: "Eesti" },
  lv: { code: "lv", name: "Latvian", nativeName: "Latviešu" },
  lt: { code: "lt", name: "Lithuanian", nativeName: "Lietuvių" },
  uk: { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  be: { code: "be", name: "Belarusian", nativeName: "Беларуская" },
  mk: { code: "mk", name: "Macedonian", nativeName: "Македонски" },
  sq: { code: "sq", name: "Albanian", nativeName: "Shqip" },
  mt: { code: "mt", name: "Maltese", nativeName: "Malti" },
  is: { code: "is", name: "Icelandic", nativeName: "Íslenska" },
  ga: { code: "ga", name: "Irish", nativeName: "Gaeilge" },
  cy: { code: "cy", name: "Welsh", nativeName: "Cymraeg" },

  // Tier 3 - Regional/Minority Languages
  eu: { code: "eu", name: "Basque", nativeName: "Euskera" },
  ca: { code: "ca", name: "Catalan", nativeName: "Català" },
  gl: { code: "gl", name: "Galician", nativeName: "Galego" },
  ast: { code: "ast", name: "Asturian", nativeName: "Asturianu" },
  oc: { code: "oc", name: "Occitan", nativeName: "Occitan" },
  co: { code: "co", name: "Corsican", nativeName: "Corsu" },
  sc: { code: "sc", name: "Sardinian", nativeName: "Sardu" },
  rm: { code: "rm", name: "Romansh", nativeName: "Rumantsch" },
  fur: { code: "fur", name: "Friulian", nativeName: "Furlan" },
  lld: { code: "lld", name: "Ladin", nativeName: "Ladin" },
  vec: { code: "vec", name: "Venetian", nativeName: "Vèneto" },
  lmo: { code: "lmo", name: "Lombard", nativeName: "Lombard" },
  pms: { code: "pms", name: "Piedmontese", nativeName: "Piemontèis" },

  // Asian Languages
  th: { code: "th", name: "Thai", nativeName: "ไทย" },
  vi: { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  id: { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  ms: { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  tl: { code: "tl", name: "Filipino", nativeName: "Filipino" },

  // African Languages
  sw: { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  am: { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  ti: { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ" },
  om: { code: "om", name: "Oromo", nativeName: "Afaan Oromoo" },
  so: { code: "so", name: "Somali", nativeName: "Soomaali" },
  mg: { code: "mg", name: "Malagasy", nativeName: "Malagasy" },
  ny: { code: "ny", name: "Chichewa", nativeName: "Chichewa" },
  sn: { code: "sn", name: "Shona", nativeName: "ChiShona" },
  zu: { code: "zu", name: "Zulu", nativeName: "isiZulu" },
}

export const DEFAULT_LANGUAGE: SupportedLanguage = "en"

export const RTL_LANGUAGES: SupportedLanguage[] = ["ar", "he", "ur", "fa"]
