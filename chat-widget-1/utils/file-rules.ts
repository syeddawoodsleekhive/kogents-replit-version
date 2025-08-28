// Comprehensive file validation rules and restrictions

import { ComplianceConfig } from "@/lib/compliance/compliance-config"
import { SensitivityRules } from "@/lib/compliance/sensitivity-rules"
import { ComplianceFramework } from "@/lib/compliance/types"

// import { ComplianceConfig } from "./lib/compliance/compliance-config"
// import { SensitivityRules } from "./lib/compliance/sensitivity-rules"
// import type { ComplianceFramework } from "./lib/compliance/types"
export interface FileRule {
  name: string
  description: string
  validator: (file: File) => ValidationResult
  severity: "error" | "warning" | "info"
}

export interface ValidationResult {
  isValid: boolean
  message?: string
  code?: string
}

export interface FileRestrictions {
  allowedTypes: string[]
  maxFileSize: number
  maxTotalSize: number
  maxFiles: number
  maxImageResolution: { width: number; height: number }
  allowedExtensions: string[]
  blockedExtensions: string[]
  requireImageDimensions: boolean
  allowAnimated: boolean
}

export interface EnhancedFileRestrictions extends FileRestrictions {
  complianceFrameworks?: ComplianceFramework[]
  enableComplianceValidation?: boolean
  enableOCRValidation?: boolean
  sensitivityLevels?: Array<"public" | "internal" | "confidential" | "restricted">
  autoRedactSensitiveContent?: boolean
  blockHighRiskFiles?: boolean
  requireClientProcessing?: boolean
}

// Default file restrictions
export const DEFAULT_FILE_RESTRICTIONS: FileRestrictions = {
  allowedTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxTotalSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 5,
  maxImageResolution: { width: 4000, height: 4000 },
  allowedExtensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".pdf",
    ".txt",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".csv",
  ],
  blockedExtensions: [".exe", ".bat", ".cmd", ".scr", ".pif", ".com", ".jar", ".zip", ".rar"],
  requireImageDimensions: true,
  allowAnimated: true,
}

// Security-focused restrictions (more restrictive)
export const SECURE_FILE_RESTRICTIONS: FileRestrictions = {
  allowedTypes: ["image/jpeg", "image/png", "application/pdf", "text/plain"],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxTotalSize: 25 * 1024 * 1024, // 25MB
  maxFiles: 3,
  maxImageResolution: { width: 2000, height: 2000 },
  allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf", ".txt"],
  blockedExtensions: [".exe", ".bat", ".cmd", ".scr", ".pif", ".com", ".jar", ".zip", ".rar", ".gif", ".webp"],
  requireImageDimensions: true,
  allowAnimated: false,
}

// Compliance-aware restrictions
export const COMPLIANCE_AWARE_RESTRICTIONS: EnhancedFileRestrictions = {
  ...DEFAULT_FILE_RESTRICTIONS,
  complianceFrameworks: ["GDPR", "CCPA"],
  enableComplianceValidation: true,
  enableOCRValidation: false,
  sensitivityLevels: ["public", "internal"],
  autoRedactSensitiveContent: false,
  blockHighRiskFiles: false,
  requireClientProcessing: false,
}

export const STRICT_COMPLIANCE_RESTRICTIONS: EnhancedFileRestrictions = {
  ...SECURE_FILE_RESTRICTIONS,
  complianceFrameworks: ["GDPR", "HIPAA", "PCI_DSS"],
  enableComplianceValidation: true,
  enableOCRValidation: true,
  sensitivityLevels: ["public"],
  autoRedactSensitiveContent: true,
  blockHighRiskFiles: true,
  requireClientProcessing: true,
}

/**
 * Core validation rules
 */
export const FILE_VALIDATION_RULES: FileRule[] = [
  {
    name: "file-exists",
    description: "File must exist and be valid",
    severity: "error",
    validator: (file: File): ValidationResult => {
      if (!file) {
        return { isValid: false, message: "No file provided", code: "FILE_MISSING" }
      }
      if (file.size === 0) {
        return { isValid: false, message: "File is empty", code: "FILE_EMPTY" }
      }
      return { isValid: true }
    },
  },

  {
    name: "file-size",
    description: "File size must be within limits",
    severity: "error",
    validator: (file: File): ValidationResult => {
      const maxSize = DEFAULT_FILE_RESTRICTIONS.maxFileSize
      if (file.size > maxSize) {
        return {
          isValid: false,
          message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`,
          code: "FILE_TOO_LARGE",
        }
      }
      return { isValid: true }
    },
  },

  {
    name: "file-type",
    description: "File type must be allowed",
    severity: "error",
    validator: (file: File): ValidationResult => {
      const allowedTypes = DEFAULT_FILE_RESTRICTIONS.allowedTypes
      if (!allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          message: `File type "${file.type}" is not allowed`,
          code: "FILE_TYPE_NOT_ALLOWED",
        }
      }
      return { isValid: true }
    },
  },

  {
    name: "file-extension",
    description: "File extension must be safe",
    severity: "error",
    validator: (file: File): ValidationResult => {
      const extension = getFileExtension(file.name).toLowerCase()
      const blockedExtensions = DEFAULT_FILE_RESTRICTIONS.blockedExtensions

      if (blockedExtensions.includes(extension)) {
        return {
          isValid: false,
          message: `File extension "${extension}" is not allowed for security reasons`,
          code: "FILE_EXTENSION_BLOCKED",
        }
      }

      const allowedExtensions = DEFAULT_FILE_RESTRICTIONS.allowedExtensions
      if (!allowedExtensions.includes(extension)) {
        return {
          isValid: false,
          message: `File extension "${extension}" is not in the allowed list`,
          code: "FILE_EXTENSION_NOT_ALLOWED",
        }
      }

      return { isValid: true }
    },
  },

  {
    name: "filename-safety",
    description: "Filename must be safe and not contain malicious patterns",
    severity: "error",
    validator: (file: File): ValidationResult => {
      const filename = file.name

      // Check for null bytes
      if (filename.includes("\0")) {
        return {
          isValid: false,
          message: "Filename contains null bytes",
          code: "FILENAME_NULL_BYTES",
        }
      }

      // Check for path traversal
      if (filename.includes("../") || filename.includes("..\\")) {
        return {
          isValid: false,
          message: "Filename contains path traversal sequences",
          code: "FILENAME_PATH_TRAVERSAL",
        }
      }

      // Check for reserved names (Windows)
      const reservedNames = [
        "CON",
        "PRN",
        "AUX",
        "NUL",
        "COM1",
        "COM2",
        "COM3",
        "COM4",
        "COM5",
        "COM6",
        "COM7",
        "COM8",
        "COM9",
        "LPT1",
        "LPT2",
        "LPT3",
        "LPT4",
        "LPT5",
        "LPT6",
        "LPT7",
        "LPT8",
        "LPT9",
      ]
      const baseName = filename.split(".")[0].toUpperCase()
      if (reservedNames.includes(baseName)) {
        return {
          isValid: false,
          message: `Filename "${filename}" uses a reserved system name`,
          code: "FILENAME_RESERVED",
        }
      }

      // Check filename length
      if (filename.length > 255) {
        return {
          isValid: false,
          message: "Filename is too long (maximum 255 characters)",
          code: "FILENAME_TOO_LONG",
        }
      }

      return { isValid: true }
    },
  },

  {
    name: "image-dimensions",
    description: "Image dimensions must be within limits",
    severity: "warning",
    validator: (file: File): ValidationResult => {
      // This rule requires async validation - will be handled separately
      return { isValid: true }
    },
  },
]

/**
 * Compliance validation rules
 */
export const COMPLIANCE_VALIDATION_RULES: FileRule[] = [
  {
    name: "compliance-framework-check",
    description: "File must comply with enabled compliance frameworks",
    severity: "error",
    validator: (file: File): ValidationResult => {
      const enabledFrameworks = ComplianceConfig.getEnabledFrameworks()
      if (enabledFrameworks.length === 0) {
        return { isValid: true } // No frameworks enabled, skip validation
      }

      // This is a placeholder - actual validation happens in comprehensive validation
      return { isValid: true }
    },
  },

  {
    name: "sensitivity-level-check",
    description: "File sensitivity level must be within allowed levels",
    severity: "error",
    validator: (file: File): ValidationResult => {
      // This would be enhanced with actual sensitivity detection
      // For now, assume public files are allowed
      return { isValid: true }
    },
  },

  {
    name: "high-risk-content-block",
    description: "Block files with high-risk content patterns",
    severity: "error",
    validator: (file: File): ValidationResult => {
      // This would integrate with content scanning
      // Placeholder implementation
      return { isValid: true }
    },
  },
]

/**
 * Validates a single file against all rules
 */
export async function validateFile(
  file: File,
  restrictions: FileRestrictions = DEFAULT_FILE_RESTRICTIONS,
): Promise<{
  isValid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []
  const info: string[] = []

  // Run synchronous validations
  for (const rule of FILE_VALIDATION_RULES) {
    if (rule.name === "image-dimensions") continue // Handle separately

    const result = rule.validator(file)
    if (!result.isValid && result.message) {
      if (rule.severity === "error") {
        errors.push(result.message)
      } else if (rule.severity === "warning") {
        warnings.push(result.message)
      } else {
        info.push(result.message)
      }
    }
  }

  // Validate image dimensions if it's an image
  if (file.type.startsWith("image/") && restrictions.requireImageDimensions) {
    try {
      const dimensions = await getImageDimensions(file)
      const maxRes = restrictions.maxImageResolution

      if (dimensions.width > maxRes.width || dimensions.height > maxRes.height) {
        warnings.push(
          `Image dimensions (${dimensions.width}x${dimensions.height}) exceed recommended maximum (${maxRes.width}x${maxRes.height}). Image will be resized.`,
        )
      }
    } catch (error) {
      warnings.push("Could not validate image dimensions")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
  }
}

/**
 * Validates multiple files as a batch
 */
export async function validateFiles(
  files: File[],
  restrictions: FileRestrictions = DEFAULT_FILE_RESTRICTIONS,
): Promise<{
  isValid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
  fileResults: Array<{ file: File; isValid: boolean; errors: string[]; warnings: string[] }>
}> {
  const batchErrors: string[] = []
  const batchWarnings: string[] = []
  const batchInfo: string[] = []
  const fileResults: Array<{ file: File; isValid: boolean; errors: string[]; warnings: string[] }> = []

  // Check batch-level restrictions
  if (files.length > restrictions.maxFiles) {
    batchErrors.push(`Too many files (${files.length}). Maximum allowed: ${restrictions.maxFiles}`)
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > restrictions.maxTotalSize) {
    batchErrors.push(
      `Total file size (${formatFileSize(totalSize)}) exceeds maximum allowed (${formatFileSize(restrictions.maxTotalSize)})`,
    )
  }

  // Validate each file individually
  for (const file of files) {
    const result = await validateFile(file, restrictions)
    fileResults.push({
      file,
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
    })

    // Collect individual file issues
    batchErrors.push(...result.errors)
    batchWarnings.push(...result.warnings)
    batchInfo.push(...result.info)
  }

  return {
    isValid: batchErrors.length === 0,
    errors: batchErrors,
    warnings: batchWarnings,
    info: batchInfo,
    fileResults,
  }
}

/**
 * Enhanced file validation with compliance integration
 */
export async function validateFileEnhanced(
  file: File,
  restrictions: EnhancedFileRestrictions = COMPLIANCE_AWARE_RESTRICTIONS,
): Promise<{
  isValid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
  complianceIssues?: string[]
  sensitivityLevel?: string
  requiresClientProcessing?: boolean
}> {
  // Run original validation
  const originalResult = await validateFile(file, restrictions)

  const complianceIssues: string[] = []
  let sensitivityLevel: string | undefined
  let requiresClientProcessing = false

  if (restrictions.enableComplianceValidation) {
    try {
      // Quick sensitivity classification
      const textContent = await readFileAsText(file).catch(() => file.name)
      const classification = SensitivityRules.classifyDocument(textContent, file.name)

      sensitivityLevel = classification.sensitivity

      // Check if sensitivity level is allowed
      if (restrictions.sensitivityLevels && !restrictions.sensitivityLevels.includes(classification.sensitivity)) {
        complianceIssues.push(`File sensitivity level "${classification.sensitivity}" is not allowed`)
      }

      // Check if high-risk files should be blocked
      if (restrictions.blockHighRiskFiles && classification.riskScore >= 5) {
        complianceIssues.push(`File blocked due to high risk score (${classification.riskScore})`)
      }

      // Determine if client processing is required
      if (restrictions.requireClientProcessing || classification.sensitivity === "restricted") {
        requiresClientProcessing = true
      }

      // Check framework-specific restrictions
      if (restrictions.complianceFrameworks) {
        const hasRestrictedFramework = classification.frameworks.some((framework) =>
          restrictions.complianceFrameworks!.includes(framework),
        )

        if (hasRestrictedFramework && classification.sensitivity !== "public") {
          complianceIssues.push("File contains content subject to compliance restrictions")
        }
      }
    } catch (error) {
      console.error("[v0] Compliance validation failed:", error)
      complianceIssues.push("Could not perform compliance validation")
    }
  }

  return {
    ...originalResult,
    isValid: originalResult.isValid && complianceIssues.length === 0,
    complianceIssues,
    sensitivityLevel,
    requiresClientProcessing,
  }
}

/**
 * Helper functions
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  return lastDot === -1 ? "" : filename.slice(lastDot)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
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

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/**
 * Create custom restrictions for specific use cases
 */
export function createCustomRestrictions(overrides: Partial<FileRestrictions>): FileRestrictions {
  return { ...DEFAULT_FILE_RESTRICTIONS, ...overrides }
}
