// Security utilities for file handling and validation

import type { RiskLevel } from "@/lib/audit/audit-types"
import { ComplianceLogger } from "@/lib/audit/compliance-logger"
import { ComplianceEngine } from "@/lib/compliance/compliance-engine"
import { SensitivityRules } from "@/lib/compliance/sensitivity-rules"
import type { ComplianceFramework } from "@/lib/compliance/types"
import { OCREngine } from "@/lib/ocr/ocr-engine"

export interface FileTypeInfo {
  detectedType: string
  confidence: number
  isSafe: boolean
  warnings: string[]
}

export interface SanitizedFilename {
  original: string
  sanitized: string
  changes: string[]
}

export interface EnhancedFileValidationResult {
  // Original security validation
  typeInfo: FileTypeInfo
  sanitizedFilename: SanitizedFilename
  contentScan: {
    isSafe: boolean
    threats: string[]
    warnings: string[]
  }
  hash: string

  complianceResult?: {
    isCompliant: boolean
    riskLevel: RiskLevel
    detectedPatterns: Array<{
      type: string
      count: number
      confidence: number
      framework: ComplianceFramework
    }>
    violations: Array<{
      framework: ComplianceFramework
      rule: string
      severity: RiskLevel
      description: string
    }>
    frameworks: ComplianceFramework[]
    processingMethod: "client" | "server"
  }

  ocrResult?: {
    extractedText: string
    confidence: number
    processingTime: number
    success: boolean
  }

  classification?: {
    sensitivity: "public" | "internal" | "confidential" | "restricted"
    riskScore: number
  }
}

// File signature database for type detection
const FILE_SIGNATURES: Record<string, { signature: number[]; offset: number; type: string }> = {
  // Images
  jpeg: { signature: [0xff, 0xd8, 0xff], offset: 0, type: "image/jpeg" },
  png: { signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0, type: "image/png" },
  gif87a: { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0, type: "image/gif" },
  gif89a: { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0, type: "image/gif" },
  webp: { signature: [0x52, 0x49, 0x46, 0x46], offset: 0, type: "image/webp" }, // RIFF header
  bmp: { signature: [0x42, 0x4d], offset: 0, type: "image/bmp" },

  // Documents
  pdf: { signature: [0x25, 0x50, 0x44, 0x46], offset: 0, type: "application/pdf" },
  docx: {
    signature: [0x50, 0x4b, 0x03, 0x04],
    offset: 0,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  xlsx: {
    signature: [0x50, 0x4b, 0x03, 0x04],
    offset: 0,
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },

  // Executables (dangerous)
  exe: { signature: [0x4d, 0x5a], offset: 0, type: "application/x-msdownload" },
  elf: { signature: [0x7f, 0x45, 0x4c, 0x46], offset: 0, type: "application/x-executable" },

  // Archives
  zip: { signature: [0x50, 0x4b, 0x03, 0x04], offset: 0, type: "application/zip" },
  rar: { signature: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00], offset: 0, type: "application/x-rar-compressed" },

  // Scripts (potentially dangerous)
  html: { signature: [0x3c, 0x68, 0x74, 0x6d, 0x6c], offset: 0, type: "text/html" },
  xml: { signature: [0x3c, 0x3f, 0x78, 0x6d, 0x6c], offset: 0, type: "text/xml" },
}

// Known dangerous file types
const DANGEROUS_TYPES = [
  "application/x-msdownload",
  "application/x-executable",
  "application/x-dosexec",
  "application/x-msdos-program",
  "application/x-winexe",
  "text/html",
  "text/javascript",
  "application/javascript",
  "application/x-javascript",
  "text/vbscript",
  "application/x-shockwave-flash",
]

// Suspicious filename patterns
const SUSPICIOUS_PATTERNS = [
  /\.exe$/i,
  /\.bat$/i,
  /\.cmd$/i,
  /\.com$/i,
  /\.pif$/i,
  /\.scr$/i,
  /\.vbs$/i,
  /\.js$/i,
  /\.jar$/i,
  /\.app$/i,
  /\.deb$/i,
  /\.dmg$/i,
  /\.iso$/i,
  /\.msi$/i,
  /\.pkg$/i,
  /\.rpm$/i,
  /\.(php|asp|jsp|cgi)$/i,
  /\.htaccess$/i,
  /^\.+/, // Hidden files starting with dots
]

/**
 * Detects the actual file type by examining file content
 */
export async function sniffFileType(file: File): Promise<FileTypeInfo> {
  const warnings: string[] = []
  let detectedType = file.type
  let confidence = 0.5 // Default confidence for MIME type

  try {
    // Read first 512 bytes for signature detection
    const buffer = await readFileBytes(file, 0, 512)
    const bytes = new Uint8Array(buffer)

    // Check against known signatures
    for (const [name, sig] of Object.entries(FILE_SIGNATURES)) {
      if (matchesSignature(bytes, sig.signature, sig.offset)) {
        detectedType = sig.type
        confidence = 0.9
        break
      }
    }

    // Special handling for WebP (needs WEBP signature after RIFF)
    if (detectedType === "image/webp") {
      const webpSignature = [0x57, 0x45, 0x42, 0x50] // "WEBP"
      if (!matchesSignature(bytes, webpSignature, 8)) {
        detectedType = "application/octet-stream"
        confidence = 0.3
        warnings.push("File claims to be WebP but doesn't match WebP signature")
      }
    }

    // Check for type mismatch
    if (file.type && file.type !== detectedType && confidence > 0.8) {
      warnings.push(`File type mismatch: claimed "${file.type}", detected "${detectedType}"`)
    }
  } catch (error) {
    warnings.push("Could not analyze file content for type detection")
    confidence = 0.1
  }

  // Determine if file is safe
  const isSafe =
    !DANGEROUS_TYPES.includes(detectedType) && !SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(file.name))

  if (!isSafe) {
    warnings.push("File type or name pattern indicates potential security risk")
  }

  return {
    detectedType,
    confidence,
    isSafe,
    warnings,
  }
}

/**
 * Sanitizes a filename to make it safe for storage and display
 */
export function sanitizeFilename(filename: string): SanitizedFilename {
  const original = filename
  const changes: string[] = []
  let sanitized = filename

  // Remove null bytes
  if (sanitized.includes("\0")) {
    sanitized = sanitized.replace(/\0/g, "")
    changes.push("Removed null bytes")
  }

  // Remove path traversal sequences
  if (sanitized.includes("../") || sanitized.includes("..\\")) {
    sanitized = sanitized.replace(/\.\.[/\\]/g, "")
    changes.push("Removed path traversal sequences")
  }

  // Replace dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1f]/g
  if (dangerousChars.test(sanitized)) {
    sanitized = sanitized.replace(dangerousChars, "_")
    changes.push("Replaced dangerous characters with underscores")
  }

  // Handle reserved Windows names
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
  if (reservedNames.test(sanitized)) {
    sanitized = "_" + sanitized
    changes.push("Prefixed reserved system name with underscore")
  }

  // Trim whitespace and dots from ends
  const trimmed = sanitized.trim().replace(/^\.+|\.+$/g, "")
  if (trimmed !== sanitized) {
    sanitized = trimmed
    changes.push("Trimmed whitespace and leading/trailing dots")
  }

  // Ensure filename isn't empty
  if (!sanitized) {
    sanitized = "unnamed_file"
    changes.push("Generated name for empty filename")
  }

  // Limit length
  if (sanitized.length > 255) {
    const extension = getFileExtension(sanitized)
    const baseName = sanitized.slice(0, 255 - extension.length)
    sanitized = baseName + extension
    changes.push("Truncated filename to 255 characters")
  }

  return {
    original,
    sanitized,
    changes,
  }
}

/**
 * Validates file content for potential security issues
 */
export async function scanFileContent(file: File): Promise<{
  isSafe: boolean
  threats: string[]
  warnings: string[]
}> {
  const threats: string[] = []
  const warnings: string[] = []

  try {
    // Read file content for analysis
    const content = await readFileAsText(file)

    // Check for script injection patterns
    const scriptPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /eval\s*\(/i,
      /document\.write/i,
      /innerHTML/i,
      /\.exe\b/i,
      /cmd\.exe/i,
      /powershell/i,
    ]

    for (const pattern of scriptPatterns) {
      if (pattern.test(content)) {
        threats.push(`Potentially malicious content detected: ${pattern.source}`)
      }
    }

    // Check for suspicious URLs
    const urlPattern = /https?:\/\/[^\s<>"']+/gi
    const urls = content.match(urlPattern) || []

    if (urls.length > 10) {
      warnings.push("File contains many URLs, review for potential spam or phishing")
    }

    // Check for base64 encoded content (could hide malicious payloads)
    const base64Pattern = /data:[^;]+;base64,[A-Za-z0-9+/=]+/g
    const base64Matches = content.match(base64Pattern) || []

    if (base64Matches.length > 0) {
      warnings.push("File contains base64 encoded data, review for hidden content")
    }
  } catch (error) {
    // If we can't read as text, it's likely binary - less risk of script injection
    warnings.push("Could not scan file content (likely binary file)")
  }

  return {
    isSafe: threats.length === 0,
    threats,
    warnings,
  }
}

/**
 * Generates a secure hash of file content for deduplication
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Rate limiting for file uploads
 */
class UploadRateLimiter {
  private attempts: Map<string, number[]> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts = 10, windowMs = 60000) {
    // 10 attempts per minute
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(identifier) || []

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs)

    if (recentAttempts.length >= this.maxAttempts) {
      return false
    }

    // Record this attempt
    recentAttempts.push(now)
    this.attempts.set(identifier, recentAttempts)

    return true
  }

  getRemainingAttempts(identifier: string): number {
    const now = Date.now()
    const attempts = this.attempts.get(identifier) || []
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs)
    return Math.max(0, this.maxAttempts - recentAttempts.length)
  }
}

export const uploadRateLimiter = new UploadRateLimiter()

/**
 * Enhanced comprehensive file validation with compliance and OCR integration
 */
export async function validateFileComprehensive(
  file: File,
  options: {
    enableCompliance?: boolean
    enableOCR?: boolean
    frameworks?: ComplianceFramework[]
    strictMode?: boolean
  } = {},
): Promise<EnhancedFileValidationResult> {
  const { enableCompliance = true, enableOCR = false, frameworks = [], strictMode = false } = options

  await ComplianceLogger.logFileUpload(file.name, file.size, file.type, [], "client")

  // Perform original security validation
  const [typeInfo, sanitizedFilename, contentScan, hash] = await Promise.all([
    sniffFileType(file),
    Promise.resolve(sanitizeFilename(file.name)),
    scanFileContent(file),
    generateFileHash(file),
  ])

  const result: EnhancedFileValidationResult = {
    typeInfo,
    sanitizedFilename,
    contentScan,
    hash,
  }

  if (enableCompliance) {
    try {
      // Classify document sensitivity
      const textContent = await readFileAsText(file).catch(() => file.name)
      const classification = SensitivityRules.classifyDocument(textContent, file.name)

      result.classification = {
        sensitivity: classification.sensitivity,
        riskScore: classification.riskScore,
      }

      // Perform compliance scan if text content available
      if (textContent && textContent !== file.name) {
        const activeFrameworks = frameworks.length > 0 ? frameworks : classification.frameworks

        if (activeFrameworks.length > 0) {
          const complianceResult = await ComplianceEngine.scanContent(textContent, activeFrameworks, {
            strictMode,
            includeContext: true,
          })

          result.complianceResult = {
            isCompliant: complianceResult.isCompliant,
            riskLevel: complianceResult.riskLevel,
            detectedPatterns: complianceResult.detectedPatterns,
            violations: complianceResult.violations,
            frameworks: complianceResult.frameworks,
            processingMethod: classification.processingMethod,
          }

          await ComplianceLogger.logComplianceScan(file.name, complianceResult.violations)

          // Log sensitive data detection if patterns found
          if (complianceResult.detectedPatterns.length > 0) {
            await ComplianceLogger.logSensitiveDataDetection(file.name, complianceResult.detectedPatterns)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Compliance validation failed:", error)
    }
  }

  if (enableOCR && isOCRSupported(file.type)) {
    try {
      const ocrResult = await OCREngine.processFile(file, {
        method: result.classification?.sensitivity === "restricted" ? "client" : "auto",
        enableCompliance: enableCompliance,
      })

      result.ocrResult = {
        extractedText: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime,
        success: ocrResult.success,
      }

      // If OCR succeeded and compliance is enabled, scan extracted text
      if (ocrResult.success && enableCompliance && ocrResult.extractedText) {
        const activeFrameworks =
          frameworks.length > 0
            ? frameworks
            : result.classification?.sensitivity === "restricted"
              ? (["GDPR", "HIPAA"] as ComplianceFramework[])
              : (["GDPR"] as ComplianceFramework[])

        const textComplianceResult = await ComplianceEngine.scanContent(ocrResult.extractedText, activeFrameworks, {
          strictMode,
          includeContext: true,
        })

        // Merge OCR compliance results with existing results
        if (result.complianceResult) {
          result.complianceResult.detectedPatterns.push(...textComplianceResult.detectedPatterns)
          result.complianceResult.violations.push(...textComplianceResult.violations)
          result.complianceResult.frameworks = [
            ...new Set([...result.complianceResult.frameworks, ...textComplianceResult.frameworks]),
          ]

          // Update compliance status (false if any scan failed)
          result.complianceResult.isCompliant = result.complianceResult.isCompliant && textComplianceResult.isCompliant

          // Update risk level (take highest)
          if (
            getRiskLevelValue(textComplianceResult.riskLevel) > getRiskLevelValue(result.complianceResult.riskLevel)
          ) {
            result.complianceResult.riskLevel = textComplianceResult.riskLevel
          }
        } else {
          result.complianceResult = {
            isCompliant: textComplianceResult.isCompliant,
            riskLevel: textComplianceResult.riskLevel,
            detectedPatterns: textComplianceResult.detectedPatterns,
            violations: textComplianceResult.violations,
            frameworks: textComplianceResult.frameworks,
            processingMethod: result.classification?.sensitivity === "restricted" ? "client" : "server",
          }
        }

        // Log OCR compliance results
        if (textComplianceResult.detectedPatterns.length > 0) {
          await ComplianceLogger.logSensitiveDataDetection(file.name, textComplianceResult.detectedPatterns)
        }
      }
    } catch (error) {
      console.error("[v0] OCR processing failed:", error)
    }
  }

  return result
}

/**
 * Enhanced batch file validation with compliance integration
 */
export async function validateFilesComprehensive(
  files: File[],
  options: {
    enableCompliance?: boolean
    enableOCR?: boolean
    frameworks?: ComplianceFramework[]
    strictMode?: boolean
    maxConcurrent?: number
  } = {},
): Promise<{
  isValid: boolean
  results: EnhancedFileValidationResult[]
  summary: {
    totalFiles: number
    safeFiles: number
    complianceViolations: number
    highRiskFiles: number
    ocrProcessed: number
  }
}> {
  const { maxConcurrent = 3 } = options
  const results: EnhancedFileValidationResult[] = []

  // Process files in batches to avoid overwhelming the system
  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent)
    const batchResults = await Promise.all(batch.map((file) => validateFileComprehensive(file, options)))
    results.push(...batchResults)
  }

  // Generate summary
  const summary = {
    totalFiles: files.length,
    safeFiles: results.filter((r) => r.contentScan.isSafe && r.complianceResult?.isCompliant !== false).length,
    complianceViolations: results.filter((r) => r.complianceResult && !r.complianceResult.isCompliant).length,
    highRiskFiles: results.filter(
      (r) =>
        r.complianceResult?.riskLevel === "high" ||
        r.complianceResult?.riskLevel === "critical" ||
        r.classification?.sensitivity === "restricted",
    ).length,
    ocrProcessed: results.filter((r) => r.ocrResult?.success).length,
  }

  const isValid = summary.safeFiles === summary.totalFiles && summary.complianceViolations === 0

  return {
    isValid,
    results,
    summary,
  }
}

function isOCRSupported(mimeType: string): boolean {
  const supportedTypes = ["image/jpeg", "image/png", "image/tiff", "image/bmp", "application/pdf"]
  return supportedTypes.includes(mimeType)
}

function getRiskLevelValue(level: RiskLevel): number {
  const values: Record<RiskLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  }
  return values[level] || 1
}


/**
 * Helper functions
 */
async function readFileBytes(file: File, start: number, length: number): Promise<ArrayBuffer> {
  const slice = file.slice(start, start + length)
  return slice.arrayBuffer()
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function matchesSignature(bytes: Uint8Array, signature: number[], offset: number): boolean {
  if (bytes.length < offset + signature.length) return false

  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false
  }

  return true
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  return lastDot === -1 ? "" : filename.slice(lastDot)
}
