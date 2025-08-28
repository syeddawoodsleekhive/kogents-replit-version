// GDPR/CCPA compliance detection module

import type { ComplianceResult, ComplianceViolation, ViolationType } from "./types"
import { COMPLIANCE_PATTERNS, validateCreditCard, validateSSN } from "./pattern-library"

export class GDPRDetector {
  private readonly HIGH_RISK_PATTERNS = [
    COMPLIANCE_PATTERNS.SSN,
    COMPLIANCE_PATTERNS.CREDIT_CARD,
    COMPLIANCE_PATTERNS.PASSPORT,
    COMPLIANCE_PATTERNS.DRIVERS_LICENSE,
    COMPLIANCE_PATTERNS.BIOMETRIC,
  ]

  private readonly MEDIUM_RISK_PATTERNS = [
    COMPLIANCE_PATTERNS.EMAIL,
    COMPLIANCE_PATTERNS.PHONE,
    COMPLIANCE_PATTERNS.GPS_COORDINATES,
  ]

  async analyze(
    content: string,
    filename?: string,
  ): Promise<Omit<ComplianceResult, "framework" | "processingRecommendation">> {
    const violations: ComplianceViolation[] = []
    let riskScore = 0

    // Check high-risk patterns
    for (const pattern of this.HIGH_RISK_PATTERNS) {
      const matches = content.match(pattern.pattern)
      if (matches) {
        for (const match of matches) {
          const isValid = this.validatePattern(pattern, match)
          if (isValid) {
            violations.push({
              type: this.getViolationType(pattern.description),
              severity: "high",
              description: `GDPR sensitive data detected: ${pattern.description}`,
              pattern: match,
              suggestedAction: "redact",
            })
            riskScore += 25
          }
        }
      }
    }

    // Check medium-risk patterns
    for (const pattern of this.MEDIUM_RISK_PATTERNS) {
      const matches = content.match(pattern.pattern)
      if (matches) {
        for (const match of matches) {
          violations.push({
            type: this.getViolationType(pattern.description),
            severity: "medium",
            description: `GDPR personal data detected: ${pattern.description}`,
            pattern: match,
            suggestedAction: "flag",
          })
          riskScore += 10
        }
      }
    }

    // Check filename for sensitive indicators
    if (filename) {
      const sensitiveFilenamePatterns = [
        /personal/i,
        /private/i,
        /confidential/i,
        /gdpr/i,
        /data.?subject/i,
        /customer.?data/i,
      ]

      for (const pattern of sensitiveFilenamePatterns) {
        if (pattern.test(filename)) {
          violations.push({
            type: "PII_DETECTED",
            severity: "medium",
            description: "Filename suggests personal data content",
            pattern: filename,
            suggestedAction: "flag",
          })
          riskScore += 15
        }
      }
    }

    // Check for data subject rights keywords
    const rightsKeywords = [
      /right.{0,10}erasure/gi,
      /right.{0,10}forgotten/gi,
      /data.{0,10}portability/gi,
      /consent.{0,10}withdraw/gi,
      /data.{0,10}protection.{0,10}officer/gi,
    ]

    for (const pattern of rightsKeywords) {
      if (pattern.test(content)) {
        violations.push({
          type: "PII_DETECTED",
          severity: "low",
          description: "Content references GDPR data subject rights",
          pattern: pattern.source,
          suggestedAction: "log",
        })
        riskScore += 5
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      riskScore: Math.min(100, riskScore),
    }
  }

  private validatePattern(pattern: any, match: string): boolean {
    switch (pattern.description) {
      case "Credit Card Number":
        return validateCreditCard(match)
      case "Social Security Number":
        return validateSSN(match)
      default:
        return true // Assume valid for other patterns
    }
  }

  private getViolationType(description: string): ViolationType {
    const typeMap: Record<string, ViolationType> = {
      "Social Security Number": "GOVERNMENT_ID",
      "Credit Card Number": "FINANCIAL_DATA",
      "Email Address": "PII_DETECTED",
      "Phone Number": "PII_DETECTED",
      "Passport Number": "GOVERNMENT_ID",
      "Driver License Number": "GOVERNMENT_ID",
      "Biometric Information": "BIOMETRIC_DATA",
      "GPS Coordinates": "LOCATION_DATA",
    }

    return typeMap[description] || "PII_DETECTED"
  }
}
