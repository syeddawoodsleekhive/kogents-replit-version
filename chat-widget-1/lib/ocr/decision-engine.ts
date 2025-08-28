// Determines whether to process OCR client-side or server-side

import type { ProcessingDecision } from "./types"
import type { ComplianceResult } from "../compliance/types"

export class OCRDecisionEngine {
  private readonly SENSITIVE_KEYWORDS = [
    "medical",
    "patient",
    "diagnosis",
    "prescription",
    "ssn",
    "social security",
    "credit card",
    "bank account",
    "passport",
    "driver license",
    "confidential",
    "classified",
    "attorney",
    "legal",
    "privileged",
  ]

  private readonly CLIENT_SIDE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"]

  determineProcessingLocation(file: File, preliminaryCompliance?: ComplianceResult[]): ProcessingDecision {
    let sensitivityLevel = 0
    const reasons: string[] = []

    // Check file characteristics
    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      return {
        location: "server",
        reason: "File too large for client-side processing",
        sensitivityLevel: 0,
        estimatedProcessingTime: this.estimateServerProcessingTime(file.size),
      }
    }

    // Check filename for sensitive indicators
    const filename = file.name.toLowerCase()
    for (const keyword of this.SENSITIVE_KEYWORDS) {
      if (filename.includes(keyword)) {
        sensitivityLevel += 20
        reasons.push(`Sensitive keyword in filename: ${keyword}`)
      }
    }

    // Check preliminary compliance results
    if (preliminaryCompliance) {
      const highRiskResults = preliminaryCompliance.filter((r) => r.riskScore > 70)
      if (highRiskResults.length > 0) {
        sensitivityLevel += 30
        reasons.push("High compliance risk detected in preliminary scan")
      }
    }

    // Check file type support
    const extension = this.getFileExtension(filename)
    if (!this.CLIENT_SIDE_EXTENSIONS.includes(extension)) {
      return {
        location: "server",
        reason: "File type requires server-side processing",
        sensitivityLevel,
        estimatedProcessingTime: this.estimateServerProcessingTime(file.size),
      }
    }

    // Decision logic
    if (sensitivityLevel >= 40) {
      return {
        location: "client",
        reason: "High sensitivity requires client-side processing for privacy",
        sensitivityLevel,
        estimatedProcessingTime: this.estimateClientProcessingTime(file.size),
      }
    }

    if (sensitivityLevel >= 70) {
      return {
        location: "blocked",
        reason: "Content too sensitive for processing",
        sensitivityLevel,
        estimatedProcessingTime: 0,
      }
    }

    return {
      location: "server",
      reason: "Standard processing - no sensitivity concerns",
      sensitivityLevel,
      estimatedProcessingTime: this.estimateServerProcessingTime(file.size),
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".")
    return lastDot === -1 ? "" : filename.slice(lastDot).toLowerCase()
  }

  private estimateClientProcessingTime(fileSize: number): number {
    // Rough estimate: 1MB takes ~2 seconds on average device
    return Math.max(1000, (fileSize / (1024 * 1024)) * 2000)
  }

  private estimateServerProcessingTime(fileSize: number): number {
    // Server processing is typically faster but includes network time
    return Math.max(500, (fileSize / (1024 * 1024)) * 800 + 1000)
  }
}
