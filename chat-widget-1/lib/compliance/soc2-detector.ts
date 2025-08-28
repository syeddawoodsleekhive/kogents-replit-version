// SOC 2 compliance detection module

import type { ComplianceResult, ComplianceViolation } from "./types"
import { COMPLIANCE_PATTERNS } from "./pattern-library"

export class SOC2Detector {
  private readonly SECURITY_KEYWORDS = [
    "password",
    "secret",
    "api key",
    "token",
    "credential",
    "authentication",
    "authorization",
    "access control",
    "encryption key",
    "private key",
    "certificate",
    "security policy",
    "incident response",
    "vulnerability",
    "penetration test",
    "audit log",
  ]

  private readonly CONFIDENTIAL_PATTERNS = [
    /\bpassword[\s:=]+([^\s\n]+)/gi,
    /\bapi[_\s]?key[\s:=]+([^\s\n]+)/gi,
    /\bsecret[\s:=]+([^\s\n]+)/gi,
    /\btoken[\s:=]+([^\s\n]+)/gi,
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
    /-----BEGIN\s+CERTIFICATE-----/gi,
  ]

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
        const severity = this.getClassificationSeverity(match)
        violations.push({
          type: "SECURITY_CLASSIFICATION",
          severity,
          description: `Security classification detected: ${match}`,
          pattern: match,
          suggestedAction: severity === "critical" ? "block" : "redact",
        })
        riskScore += severity === "critical" ? 50 : 30
      }
    }

    // Check for attorney-client privilege
    const privilegeMatches = content.match(COMPLIANCE_PATTERNS.ATTORNEY_CLIENT.pattern)
    if (privilegeMatches) {
      violations.push({
        type: "LEGAL_PRIVILEGE",
        severity: "high",
        description: "Attorney-client privileged information detected",
        pattern: privilegeMatches[0],
        suggestedAction: "redact",
      })
      riskScore += 25
    }

    // Check for confidential patterns (passwords, keys, etc.)
    for (const pattern of this.CONFIDENTIAL_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        for (const match of matches) {
          violations.push({
            type: "SECURITY_CLASSIFICATION",
            severity: "critical",
            description: "Sensitive credential or key detected",
            pattern: this.maskSensitiveData(match),
            suggestedAction: "block",
          })
          riskScore += 40
        }
      }
    }

    // Check for security-related keywords
    const lowerContent = content.toLowerCase()
    let securityKeywordCount = 0

    for (const keyword of this.SECURITY_KEYWORDS) {
      if (lowerContent.includes(keyword)) {
        securityKeywordCount++
      }
    }

    if (securityKeywordCount >= 5) {
      violations.push({
        type: "SECURITY_CLASSIFICATION",
        severity: "medium",
        description: `Multiple security-related terms detected (${securityKeywordCount} found)`,
        pattern: "security terminology",
        suggestedAction: "flag",
      })
      riskScore += securityKeywordCount * 2
    }

    // Check for system information
    const systemPatterns = [
      /\b(?:server|database|system)[\s:]+([^\s\n]+)/gi,
      /\bip[\s:]+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gi,
      /\bport[\s:]+(\d{1,5})/gi,
    ]

    for (const pattern of systemPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 2) {
        violations.push({
          type: "SECURITY_CLASSIFICATION",
          severity: "medium",
          description: "System configuration information detected",
          pattern: `${matches.length} system references`,
          suggestedAction: "flag",
        })
        riskScore += 10
      }
    }

    // Check filename for security indicators
    if (filename) {
      const securityFilenamePatterns = [
        /confidential/i,
        /secret/i,
        /private/i,
        /internal/i,
        /restricted/i,
        /security/i,
        /audit/i,
        /compliance/i,
      ]

      for (const pattern of securityFilenamePatterns) {
        if (pattern.test(filename)) {
          violations.push({
            type: "SECURITY_CLASSIFICATION",
            severity: "medium",
            description: "Filename suggests confidential content",
            pattern: filename,
            suggestedAction: "flag",
          })
          riskScore += 15
        }
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      riskScore: Math.min(100, riskScore),
    }
  }

  private getClassificationSeverity(classification: string): "critical" | "high" | "medium" {
    const level = classification.toLowerCase()
    if (level.includes("top secret")) return "critical"
    if (level.includes("secret")) return "high"
    return "medium"
  }

  private maskSensitiveData(data: string): string {
    // Mask everything after the first few characters
    if (data.length <= 4) return "****"
    return data.slice(0, 4) + "*".repeat(Math.min(8, data.length - 4))
  }
}
