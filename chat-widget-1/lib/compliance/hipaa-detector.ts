// HIPAA compliance detection module

import type { ComplianceResult, ComplianceViolation } from "./types"
import { COMPLIANCE_PATTERNS } from "./pattern-library"

export class HIPAADetector {
  private readonly MEDICAL_KEYWORDS = [
    "patient",
    "diagnosis",
    "treatment",
    "medication",
    "prescription",
    "medical record",
    "health information",
    "phi",
    "protected health information",
    "medical history",
    "symptoms",
    "condition",
    "therapy",
    "hospital",
    "clinic",
    "doctor",
    "physician",
    "nurse",
    "healthcare",
  ]

  private readonly MEDICAL_CODES = [
    /\b[A-Z]\d{2}(\.\d{1,2})?\b/g, // ICD-10 codes
    /\b\d{5}\b/g, // CPT codes
    /\bNDC\s*\d{4,5}-\d{3,4}-\d{1,2}\b/gi, // NDC drug codes
  ]

  async analyze(
    content: string,
    filename?: string,
  ): Promise<Omit<ComplianceResult, "framework" | "processingRecommendation">> {
    const violations: ComplianceViolation[] = []
    let riskScore = 0

    // Check for medical record numbers
    const medicalRecordMatches = content.match(COMPLIANCE_PATTERNS.MEDICAL_RECORD.pattern)
    if (medicalRecordMatches) {
      for (const match of medicalRecordMatches) {
        violations.push({
          type: "MEDICAL_DATA",
          severity: "critical",
          description: "Medical record number detected",
          pattern: match,
          suggestedAction: "block",
        })
        riskScore += 30
      }
    }

    // Check for insurance information
    const insuranceMatches = content.match(COMPLIANCE_PATTERNS.INSURANCE_ID.pattern)
    if (insuranceMatches) {
      for (const match of insuranceMatches) {
        violations.push({
          type: "MEDICAL_DATA",
          severity: "high",
          description: "Insurance policy number detected",
          pattern: match,
          suggestedAction: "redact",
        })
        riskScore += 20
      }
    }

    // Check for medical keywords
    const lowerContent = content.toLowerCase()
    let medicalKeywordCount = 0

    for (const keyword of this.MEDICAL_KEYWORDS) {
      if (lowerContent.includes(keyword)) {
        medicalKeywordCount++
      }
    }

    if (medicalKeywordCount >= 3) {
      violations.push({
        type: "MEDICAL_DATA",
        severity: "high",
        description: `Multiple medical keywords detected (${medicalKeywordCount} found)`,
        pattern: "medical terminology",
        suggestedAction: "redact",
      })
      riskScore += medicalKeywordCount * 5
    }

    // Check for medical codes
    for (const codePattern of this.MEDICAL_CODES) {
      const matches = content.match(codePattern)
      if (matches && matches.length > 2) {
        violations.push({
          type: "MEDICAL_DATA",
          severity: "high",
          description: "Medical codes detected (ICD/CPT/NDC)",
          pattern: `${matches.length} medical codes`,
          suggestedAction: "redact",
        })
        riskScore += 15
      }
    }

    // Check for PHI identifiers (18 HIPAA identifiers)
    const phiPatterns = [
      COMPLIANCE_PATTERNS.SSN,
      COMPLIANCE_PATTERNS.EMAIL,
      COMPLIANCE_PATTERNS.PHONE,
      COMPLIANCE_PATTERNS.GPS_COORDINATES,
    ]

    for (const pattern of phiPatterns) {
      const matches = content.match(pattern.pattern)
      if (matches) {
        violations.push({
          type: "MEDICAL_DATA",
          severity: "high",
          description: `PHI identifier detected: ${pattern.description}`,
          pattern: matches[0],
          suggestedAction: "redact",
        })
        riskScore += 15
      }
    }

    // Check filename for medical indicators
    if (filename) {
      const medicalFilenamePatterns = [/medical/i, /patient/i, /health/i, /phi/i, /hipaa/i, /diagnosis/i, /treatment/i]

      for (const pattern of medicalFilenamePatterns) {
        if (pattern.test(filename)) {
          violations.push({
            type: "MEDICAL_DATA",
            severity: "medium",
            description: "Filename suggests medical content",
            pattern: filename,
            suggestedAction: "flag",
          })
          riskScore += 10
        }
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      riskScore: Math.min(100, riskScore),
    }
  }
}
