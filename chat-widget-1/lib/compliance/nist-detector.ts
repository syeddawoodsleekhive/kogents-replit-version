// NIST Framework compliance detection module

import type { ComplianceResult, ComplianceViolation } from "./types"
import { COMPLIANCE_PATTERNS } from "./pattern-library"

export class NISTDetector {
  private readonly CYBERSECURITY_KEYWORDS = [
    "vulnerability",
    "threat",
    "risk assessment",
    "incident response",
    "security control",
    "access management",
    "data protection",
    "network security",
    "endpoint security",
    "malware",
    "phishing",
    "ransomware",
    "breach",
    "compromise",
    "forensics",
    "monitoring",
    "detection",
    "prevention",
  ]

  private readonly NIST_FUNCTIONS = ["identify", "protect", "detect", "respond", "recover"]

  async analyze(
    content: string,
    filename?: string,
  ): Promise<Omit<ComplianceResult, "framework" | "processingRecommendation">> {
    const violations: ComplianceViolation[] = []
    let riskScore = 0

    // Check for security classifications
    const classifiedMatches = content.match(COMPLIANCE_PATTERNS.CLASSIFIED.pattern)
    if (classifiedMatches) {
      for (const match of classifiedMatches) {
        violations.push({
          type: "SECURITY_CLASSIFICATION",
          severity: "high",
          description: `NIST security classification detected: ${match}`,
          pattern: match,
          suggestedAction: "redact",
        })
        riskScore += 30
      }
    }

    // Check for cybersecurity keywords
    const lowerContent = content.toLowerCase()
    let cyberKeywordCount = 0

    for (const keyword of this.CYBERSECURITY_KEYWORDS) {
      if (lowerContent.includes(keyword)) {
        cyberKeywordCount++
      }
    }

    if (cyberKeywordCount >= 3) {
      violations.push({
        type: "SECURITY_CLASSIFICATION",
        severity: "medium",
        description: `Cybersecurity content detected (${cyberKeywordCount} keywords found)`,
        pattern: "cybersecurity terminology",
        suggestedAction: "flag",
      })
      riskScore += cyberKeywordCount * 3
    }

    // Check for NIST framework references
    let nistFunctionCount = 0
    for (const func of this.NIST_FUNCTIONS) {
      const pattern = new RegExp(`\\b${func}\\b`, "gi")
      if (pattern.test(content)) {
        nistFunctionCount++
      }
    }

    if (nistFunctionCount >= 2) {
      violations.push({
        type: "SECURITY_CLASSIFICATION",
        severity: "low",
        description: "NIST Cybersecurity Framework references detected",
        pattern: "NIST framework terminology",
        suggestedAction: "log",
      })
      riskScore += 5
    }

    // Check for technical security information
    const technicalPatterns = [
      /\b(?:cve|CVE)-\d{4}-\d{4,7}\b/g, // CVE identifiers
      /\b(?:sha256|md5|hash)[\s:]+([a-f0-9]{32,64})/gi, // Hash values
      /\b(?:certificate|cert)[\s:]+([a-f0-9:]{32,})/gi, // Certificate fingerprints
    ]

    for (const pattern of technicalPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        violations.push({
          type: "SECURITY_CLASSIFICATION",
          severity: "medium",
          description: "Technical security information detected",
          pattern: `${matches.length} technical references`,
          suggestedAction: "flag",
        })
        riskScore += 10
      }
    }

    // Check filename for NIST/security indicators
    if (filename) {
      const nistFilenamePatterns = [
        /nist/i,
        /cybersecurity/i,
        /framework/i,
        /security.?assessment/i,
        /risk.?management/i,
        /incident.?response/i,
      ]

      for (const pattern of nistFilenamePatterns) {
        if (pattern.test(filename)) {
          violations.push({
            type: "SECURITY_CLASSIFICATION",
            severity: "low",
            description: "Filename suggests NIST/security content",
            pattern: filename,
            suggestedAction: "log",
          })
          riskScore += 5
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
