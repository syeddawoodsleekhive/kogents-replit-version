"use client"

import { detectAnimatedFormatEnhanced, type AnimationDetectionResult } from "./animated-format-utils"
import { detectModernFormat, type FormatCompatibilityResult } from "./modern-format-utils"

// Advanced image compression utilities with animated format detection and validation

// import { detectAnimatedFormatEnhanced, type AnimationDetectionResult } from "./animated-format-utils"
// Added modern format detection import
// import { detectModernFormat, type FormatCompatibilityResult } from "./modern-format-utils"

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number | undefined
  enableProgressiveRendering?: boolean
  chunkSize?: number
  preserveAnimated?: boolean
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: string
  format: string
  isAnimated: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fileInfo: {
    size: number
    type: string
    isAnimated: boolean
    dimensions?: { width: number; height: number }
  }
  animationInfo?: AnimationDetectionResult
  // Added modern format compatibility info
  modernFormatInfo?: FormatCompatibilityResult
}

// File size limits
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB
  RECOMMENDED_SIZE: 5 * 1024 * 1024, // 5MB
} as const

// Supported formats
export const SUPPORTED_FORMATS = {
  IMAGES: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  ANIMATED: ["image/gif", "image/webp"],
  LOSSLESS: ["image/png"],
  LOSSY: ["image/jpeg", "image/jpg", "image/webp"],
  // Added modern formats list
  MODERN: ["image/heic", "image/heif", "image/tiff", "image/avif", "image/jxl"],
} as const

/**
 * Validates a file before compression
 */
export async function validateFile(file: File): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic file validation
  if (!file) {
    errors.push("No file provided")
    return { isValid: false, errors, warnings, fileInfo: { size: 0, type: "", isAnimated: false } }
  }

  // Size validation
  if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
    errors.push(
      `File size (${formatFileSize(file.size)}) exceeds maximum limit (${formatFileSize(FILE_SIZE_LIMITS.MAX_FILE_SIZE)})`,
    )
  } else if (file.size > FILE_SIZE_LIMITS.RECOMMENDED_SIZE) {
    warnings.push(`Large file size (${formatFileSize(file.size)}). Consider compressing before upload.`)
  }

  // Type validation
  if (!SUPPORTED_FORMATS.IMAGES.includes(file.type as any)) {
    errors.push(`Unsupported file type: ${file.type}`)
  }

  // Detect if animated
  const isAnimated = await detectAnimatedFormat(file)

  // Get image dimensions
  let dimensions: { width: number; height: number } | undefined
  try {
    dimensions = await getImageDimensions(file)

    // Dimension warnings
    if (dimensions.width > 4000 || dimensions.height > 4000) {
      warnings.push(
        `Large image dimensions (${dimensions.width}x${dimensions.height}). Will be resized during compression.`,
      )
    }
  } catch (error) {
    warnings.push("Could not determine image dimensions")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      size: file.size,
      type: file.type,
      isAnimated,
      dimensions,
    },
  }
}

/**
 * Enhanced validation with detailed animation analysis and modern format support
 */
export async function validateFileEnhanced(
  file: File,
): Promise<
  ValidationResult & { animationInfo?: AnimationDetectionResult; modernFormatInfo?: FormatCompatibilityResult }
> {
  const basicValidation = await validateFile(file)

  const animationInfo = await detectAnimatedFormatEnhanced(file)
  // Added modern format detection
  const modernFormatInfo = await detectModernFormat(file)

  // Add animation-specific warnings
  if (animationInfo.isAnimated) {
    if (animationInfo.warningLevel === "warning") {
      basicValidation.warnings.push(animationInfo.userMessage)
    }

    if (animationInfo.animationInfo.willLoseAnimation) {
      basicValidation.warnings.push("Animation may be lost during compression. Consider preserving original format.")
    }
  }

  // Add modern format warnings
  if (modernFormatInfo.formatInfo.isModernFormat) {
    if (modernFormatInfo.warningLevel === "warning") {
      basicValidation.warnings.push(modernFormatInfo.userMessage)
    }

    if (modernFormatInfo.actionRequired) {
      basicValidation.warnings.push(...modernFormatInfo.suggestedActions)
    }
  }

  return {
    ...basicValidation,
    animationInfo,
    modernFormatInfo,
  }
}

/**
 * Detects if an image format is animated (backward compatibility)
 */
export async function detectAnimatedFormat(file: File): Promise<boolean> {
  const result = await detectAnimatedFormatEnhanced(file)
  return result.isAnimated
}

/**
 * Gets image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

/**
 * Determines optimal compression settings based on file characteristics
 */
export function getOptimalCompressionSettings(file: File, isAnimated: boolean): CompressionOptions {
  const fileSize = file.size

  // Base settings
  let quality: number | undefined = 0.8
  let maxWidth = 1200
  let maxHeight = 1200

  // Adjust based on file size
  if (fileSize > 10 * 1024 * 1024) {
    // >10MB
    quality = 0.6
    maxWidth = 1000
    maxHeight = 1000
  } else if (fileSize > 5 * 1024 * 1024) {
    // >5MB
    quality = 0.7
  } else if (fileSize < 1024 * 1024) {
    // <1MB
    quality = 0.9
  }

  // Adjust for animated images
  if (isAnimated) {
    // Don't compress animated images as aggressively
    quality = Math.max(quality + 0.1, 0.9)
  }

  // Adjust for PNG (lossless)
  if (file.type === "image/png") {
    quality = undefined // PNG compression doesn't use quality
  }

  return {
    quality,
    maxWidth,
    maxHeight,
    enableProgressiveRendering: fileSize > 2 * 1024 * 1024,
    chunkSize: fileSize > 5 * 1024 * 1024 ? 50 : 100,
    preserveAnimated: isAnimated,
  }
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

/**
 * Calculates compression ratio
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): string {
  if (originalSize === 0) return "0%"
  const ratio = ((originalSize - compressedSize) / originalSize) * 100
  return Math.max(0, ratio).toFixed(1) + "%"
}

/**
 * Converts blob to file with proper metadata
 */
export function blobToFile(blob: Blob, fileName: string, lastModified?: number): File {
  return new File([blob], fileName, {
    type: blob.type,
    lastModified: lastModified || Date.now(),
  })
}

/**
 * Creates a preview URL for a file with automatic cleanup
 */
export function createPreviewUrl(file: File): { url: string; cleanup: () => void } {
  const url = URL.createObjectURL(file)
  const cleanup = () => URL.revokeObjectURL(url)

  // Auto-cleanup after 5 minutes to prevent memory leaks
  setTimeout(cleanup, 5 * 60 * 1000)

  return { url, cleanup }
}

/**
 * Checks if the browser supports the required APIs
 */
export function checkBrowserSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = []

  if (typeof Worker === "undefined") missing.push("Web Workers")
  if (typeof FileReader === "undefined") missing.push("FileReader API")
  if (typeof URL.createObjectURL === "undefined") missing.push("Object URL API")
  if (typeof OffscreenCanvas === "undefined") missing.push("OffscreenCanvas API")

  return {
    supported: missing.length === 0,
    missing,
  }
}
