/**
 * Modern Format Support Utilities
 * Handles HEIC/HEIF/TIFF detection, browser compatibility, and conversion suggestions
 */

export interface ModernFormatInfo {
  format: "heic" | "heif" | "tiff" | "avif" | "jxl" | "unknown"
  isModernFormat: boolean
  browserSupported: boolean
  canPreview: boolean
  needsConversion: boolean
  fileSize: number
  suggestedFormat?: "jpeg" | "png" | "webp"
  compatibilityMessage: string
  conversionMessage?: string
}

export interface FormatCompatibilityResult {
  isSupported: boolean
  formatInfo: ModernFormatInfo
  userMessage: string
  actionRequired: boolean
  suggestedActions: string[]
  warningLevel: "info" | "warning" | "error"
}

/**
 * Detect modern image formats from file signature
 */
export async function detectModernFormat(file: File): Promise<FormatCompatibilityResult> {
  // Quick check for known MIME types
  if (isKnownModernFormat(file.type)) {
    return await analyzeKnownModernFormat(file)
  }

  // Check file signature for formats with incorrect MIME types
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      if (!arrayBuffer) {
        resolve(createUnknownFormatResult(file))
        return
      }

      const uint8Array = new Uint8Array(arrayBuffer)
      const formatInfo = detectFormatFromSignature(uint8Array, file)
      resolve(createCompatibilityResult(formatInfo, file))
    }

    reader.onerror = () => resolve(createUnknownFormatResult(file))
    reader.readAsArrayBuffer(file.slice(0, 32)) // Read first 32 bytes for signature detection
  })
}

/**
 * Check if file type is a known modern format
 */
function isKnownModernFormat(mimeType: string): boolean {
  const modernFormats = ["image/heic", "image/heif", "image/tiff", "image/tiff-fx", "image/avif", "image/jxl"]
  return modernFormats.includes(mimeType.toLowerCase())
}

/**
 * Analyze known modern format files
 */
async function analyzeKnownModernFormat(file: File): Promise<FormatCompatibilityResult> {
  const mimeType = file.type.toLowerCase()
  let format: ModernFormatInfo["format"] = "unknown"

  if (mimeType.includes("heic")) format = "heic"
  else if (mimeType.includes("heif")) format = "heif"
  else if (mimeType.includes("tiff")) format = "tiff"
  else if (mimeType.includes("avif")) format = "avif"
  else if (mimeType.includes("jxl")) format = "jxl"

  const browserSupported = await checkBrowserFormatSupport(format)
  const formatInfo: ModernFormatInfo = {
    format,
    isModernFormat: true,
    browserSupported,
    canPreview: browserSupported,
    needsConversion: !browserSupported,
    fileSize: file.size,
    suggestedFormat: getSuggestedConversionFormat(format, file.size),
    compatibilityMessage: getCompatibilityMessage(format, browserSupported),
    conversionMessage: getConversionMessage(format, browserSupported),
  }

  return createCompatibilityResult(formatInfo, file)
}

/**
 * Detect format from file signature (magic numbers)
 */
function detectFormatFromSignature(data: Uint8Array, file: File): ModernFormatInfo {
  // HEIC/HEIF detection
  if (data.length >= 12) {
    const ftyp = String.fromCharCode(...data.slice(4, 8))
    if (ftyp === "ftyp") {
      const brand = String.fromCharCode(...data.slice(8, 12))
      if (brand === "heic" || brand === "heix" || brand === "heim" || brand === "heis") {
        return createFormatInfo("heic", file)
      }
      if (brand === "heif" || brand === "hevc" || brand === "hevx") {
        return createFormatInfo("heif", file)
      }
    }
  }

  // TIFF detection
  if (data.length >= 4) {
    const tiffLE = data[0] === 0x49 && data[1] === 0x49 && data[2] === 0x2a && data[3] === 0x00
    const tiffBE = data[0] === 0x4d && data[1] === 0x4d && data[2] === 0x00 && data[3] === 0x2a
    if (tiffLE || tiffBE) {
      return createFormatInfo("tiff", file)
    }
  }

  // AVIF detection
  if (data.length >= 12) {
    const ftyp = String.fromCharCode(...data.slice(4, 8))
    if (ftyp === "ftyp") {
      const brand = String.fromCharCode(...data.slice(8, 12))
      if (brand === "avif" || brand === "avis") {
        return createFormatInfo("avif", file)
      }
    }
  }

  // JPEG XL detection
  if (data.length >= 12) {
    // JPEG XL codestream
    if (data[0] === 0xff && data[1] === 0x0a) {
      return createFormatInfo("jxl", file)
    }
    // JPEG XL container
    if (data.slice(0, 4).every((byte, i) => byte === [0x00, 0x00, 0x00, 0x0c][i])) {
      const jxl = String.fromCharCode(...data.slice(4, 8))
      if (jxl === "JXL ") {
        return createFormatInfo("jxl", file)
      }
    }
  }

  return createFormatInfo("unknown", file)
}

/**
 * Create format info object
 */
async function createFormatInfo(format: ModernFormatInfo["format"], file: File): Promise<ModernFormatInfo> {
  const browserSupported = await checkBrowserFormatSupport(format)

  return {
    format,
    isModernFormat: format !== "unknown",
    browserSupported,
    canPreview: browserSupported,
    needsConversion: !browserSupported && format !== "unknown",
    fileSize: file.size,
    suggestedFormat: getSuggestedConversionFormat(format, file.size),
    compatibilityMessage: getCompatibilityMessage(format, browserSupported),
    conversionMessage: getConversionMessage(format, browserSupported),
  }
}

/**
 * Check browser support for modern formats
 */
async function checkBrowserFormatSupport(format: ModernFormatInfo["format"]): Promise<boolean> {
  if (format === "unknown") return true

  // Create a test canvas to check format support
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1

  const testFormats: Record<string, string> = {
    heic: "image/heic",
    heif: "image/heif",
    tiff: "image/tiff",
    avif: "image/avif",
    jxl: "image/jxl",
  }

  const mimeType = testFormats[format]
  if (!mimeType) return false

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob !== null)
      },
      mimeType,
      0.5,
    )

    // Fallback timeout
    setTimeout(() => resolve(false), 100)
  })
}

/**
 * Get compatibility message for format
 */
function getCompatibilityMessage(format: ModernFormatInfo["format"], supported: boolean): string {
  if (format === "unknown") return "Standard image format"

  const formatNames: Record<string, string> = {
    heic: "HEIC",
    heif: "HEIF",
    tiff: "TIFF",
    avif: "AVIF",
    jxl: "JPEG XL",
  }

  const formatName = formatNames[format] || format.toUpperCase()

  if (supported) {
    return `${formatName} format is supported by your browser`
  }

  const supportInfo: Record<string, string> = {
    heic: "HEIC is primarily supported on Apple devices. Most browsers cannot display HEIC images.",
    heif: "HEIF has limited browser support. Most browsers cannot display HEIF images.",
    tiff: "TIFF has limited browser support. Some browsers may not display TIFF images properly.",
    avif: "AVIF is a modern format with growing browser support, but not universally supported yet.",
    jxl: "JPEG XL is a next-generation format with limited browser support currently.",
  }

  return supportInfo[format] || `${formatName} format may not be supported by all browsers`
}

/**
 * Get conversion message for format
 */
function getConversionMessage(format: ModernFormatInfo["format"], supported: boolean): string | undefined {
  if (supported || format === "unknown") return undefined

  const conversionMessages: Record<string, string> = {
    heic: "Consider converting to JPEG for universal compatibility. HEIC files often contain high-quality photos that convert well to JPEG.",
    heif: "Consider converting to JPEG or PNG for better browser support. HEIF files maintain good quality when converted.",
    tiff: "Consider converting to PNG for lossless quality or JPEG for smaller file size. TIFF files are often high-resolution.",
    avif: "Consider converting to WebP or JPEG for broader browser support while maintaining good compression.",
    jxl: "Consider converting to WebP or JPEG for current browser compatibility. JPEG XL offers excellent compression but limited support.",
  }

  return conversionMessages[format]
}

/**
 * Get suggested conversion format
 */
function getSuggestedConversionFormat(
  format: ModernFormatInfo["format"],
  fileSize: number,
): "jpeg" | "png" | "webp" | undefined {
  if (format === "unknown") return undefined

  // For large files, prefer JPEG for better compression
  if (fileSize > 5 * 1024 * 1024) {
    return "jpeg"
  }

  // Format-specific suggestions
  const suggestions: Record<string, "jpeg" | "png" | "webp"> = {
    heic: "jpeg", // HEIC is usually photos
    heif: "jpeg", // HEIF is usually photos
    tiff: "png", // TIFF is often high-quality/lossless
    avif: "webp", // AVIF users likely want modern compression
    jxl: "webp", // JPEG XL users likely want modern compression
  }

  return suggestions[format] || "jpeg"
}

/**
 * Create compatibility result
 */
function createCompatibilityResult(formatInfo: ModernFormatInfo, file: File): FormatCompatibilityResult {
  if (!formatInfo.isModernFormat) {
    return {
      isSupported: true,
      formatInfo,
      userMessage: "Standard image format - fully supported",
      actionRequired: false,
      suggestedActions: [],
      warningLevel: "info",
    }
  }

  if (formatInfo.browserSupported) {
    return {
      isSupported: true,
      formatInfo,
      userMessage: `${formatInfo.format.toUpperCase()} format is supported - image will display properly`,
      actionRequired: false,
      suggestedActions: [],
      warningLevel: "info",
    }
  }

  const suggestedActions: string[] = []
  if (formatInfo.conversionMessage) {
    suggestedActions.push(formatInfo.conversionMessage)
  }
  suggestedActions.push("File will be sent as-is - recipients may not be able to view it")
  if (formatInfo.suggestedFormat) {
    suggestedActions.push(
      `Recommended: Convert to ${formatInfo.suggestedFormat.toUpperCase()} for universal compatibility`,
    )
  }

  return {
    isSupported: false,
    formatInfo,
    userMessage: `${formatInfo.format.toUpperCase()} format has limited browser support - image may not display properly`,
    actionRequired: true,
    suggestedActions,
    warningLevel: "warning",
  }
}

/**
 * Create result for unknown formats
 */
function createUnknownFormatResult(file: File): FormatCompatibilityResult {
  const formatInfo: ModernFormatInfo = {
    format: "unknown",
    isModernFormat: false,
    browserSupported: true,
    canPreview: true,
    needsConversion: false,
    fileSize: file.size,
    compatibilityMessage: "Standard image format",
  }

  return {
    isSupported: true,
    formatInfo,
    userMessage: "Standard image format - fully supported",
    actionRequired: false,
    suggestedActions: [],
    warningLevel: "info",
  }
}

/**
 * Get user-friendly format display name
 */
export function getFormatDisplayName(format: ModernFormatInfo["format"]): string {
  const displayNames: Record<string, string> = {
    heic: "HEIC",
    heif: "HEIF",
    tiff: "TIFF",
    avif: "AVIF",
    jxl: "JPEG XL",
    unknown: "Image",
  }

  return displayNames[format] || format.toUpperCase()
}

/**
 * Check if format needs conversion warning
 */
export function needsConversionWarning(formatInfo: ModernFormatInfo): boolean {
  return formatInfo.isModernFormat && !formatInfo.browserSupported
}

/**
 * Get format-specific file icon
 */
export function getFormatIcon(format: ModernFormatInfo["format"]): string {
  const icons: Record<string, string> = {
    heic: "📱", // Mobile/Apple
    heif: "📱", // Mobile/Apple
    tiff: "🖼️", // Professional image
    avif: "🆕", // New format
    jxl: "🆕", // New format
    unknown: "🖼️", // Generic image
  }

  return icons[format] || "🖼️"
}
