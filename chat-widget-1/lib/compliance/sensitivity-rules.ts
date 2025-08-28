import type { ComplianceFramework, RiskLevel } from "./types"

export interface SensitivityRule {
  id: string
  name: string
  description: string
  patterns: SensitivityPattern[]
  framework: ComplianceFramework
  riskLevel: RiskLevel
  processingMethod: "client" | "server" | "auto"
  enabled: boolean
}

export interface SensitivityPattern {
  type: "regex" | "keyword" | "context"
  value: string
  weight: number
  confidence: number
}

export interface DocumentClassification {
  sensitivity: "public" | "internal" | "confidential" | "restricted"
  frameworks: ComplianceFramework[]
  processingMethod: "client" | "server"
  riskScore: number
  detectedPatterns: Array<{
    rule: string
    pattern: string
    matches: number
    confidence: number
  }>
}

export class SensitivityRules {
  private static readonly BUILT_IN_RULES: SensitivityRule[] = [
    // GDPR Rules
    {
      id: "gdpr_personal_data",
      name: "GDPR Personal Data",
      description: "Detects personal data under GDPR regulations",
      patterns: [
        {
          type: "regex",
          value: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
          weight: 0.8,
          confidence: 0.9,
        },
        { type: "regex", value: "\\b\\d{3}-?\\d{2}-?\\d{4}\\b", weight: 0.9, confidence: 0.95 },
        { type: "keyword", value: "personal data", weight: 0.6, confidence: 0.7 },
        { type: "context", value: "data subject", weight: 0.7, confidence: 0.8 },
      ],
      framework: "gdpr",
      riskLevel: "high",
      processingMethod: "client",
      enabled: true,
    },

    // HIPAA Rules
    {
      id: "hipaa_phi",
      name: "HIPAA Protected Health Information",
      description: "Detects PHI under HIPAA regulations",
      patterns: [
        { type: "keyword", value: "patient", weight: 0.7, confidence: 0.8 },
        { type: "keyword", value: "medical record", weight: 0.9, confidence: 0.9 },
        { type: "keyword", value: "diagnosis", weight: 0.8, confidence: 0.85 },
        { type: "regex", value: "\\b(?:mrn|medical record number)\\s*:?\\s*\\w+", weight: 0.95, confidence: 0.95 },
        { type: "context", value: "health information", weight: 0.8, confidence: 0.8 },
      ],
      framework: "hipaa",
      riskLevel: "critical",
      processingMethod: "client",
      enabled: true,
    },

    // PCI DSS Rules
    {
      id: "pci_payment_data",
      name: "PCI DSS Payment Data",
      description: "Detects payment card data under PCI DSS",
      patterns: [
        { type: "regex", value: "\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b", weight: 0.95, confidence: 0.9 },
        { type: "regex", value: "\\b\\d{3,4}\\b", weight: 0.6, confidence: 0.7 }, // CVV
        { type: "keyword", value: "credit card", weight: 0.8, confidence: 0.8 },
        { type: "keyword", value: "payment", weight: 0.6, confidence: 0.7 },
      ],
      framework: "pci_dss",
      riskLevel: "critical",
      processingMethod: "client",
      enabled: true,
    },

    // Financial Data Rules
    {
      id: "financial_sensitive",
      name: "Financial Sensitive Data",
      description: "Detects sensitive financial information",
      patterns: [
        { type: "regex", value: "\\b(?:account|routing)\\s+(?:number|#)\\s*:?\\s*\\w+", weight: 0.9, confidence: 0.9 },
        { type: "regex", value: "\\b(?:iban|swift)\\s*:?\\s*\\w+", weight: 0.9, confidence: 0.9 },
        { type: "keyword", value: "bank account", weight: 0.8, confidence: 0.8 },
        { type: "keyword", value: "financial statement", weight: 0.7, confidence: 0.8 },
      ],
      framework: "soc2",
      riskLevel: "high",
      processingMethod: "client",
      enabled: true,
    },

    // Government/Legal Rules
    {
      id: "legal_privileged",
      name: "Legal Privileged Information",
      description: "Detects attorney-client privileged information",
      patterns: [
        { type: "keyword", value: "attorney-client privilege", weight: 0.95, confidence: 0.95 },
        { type: "keyword", value: "confidential", weight: 0.6, confidence: 0.7 },
        { type: "regex", value: "\\b(?:case|docket)\\s+(?:number|#)\\s*:?\\s*\\w+", weight: 0.8, confidence: 0.85 },
        { type: "context", value: "legal counsel", weight: 0.8, confidence: 0.8 },
      ],
      framework: "nist",
      riskLevel: "high",
      processingMethod: "client",
      enabled: true,
    },
  ]

  private static customRules: SensitivityRule[] = []

  static classifyDocument(text: string, fileName?: string): DocumentClassification {
    const detectedPatterns: Array<{
      rule: string
      pattern: string
      matches: number
      confidence: number
    }> = []

    let totalRiskScore = 0
    const frameworksSet = new Set<ComplianceFramework>()
    let highestRiskProcessingMethod: "client" | "server" = "server"

    // Combine built-in and custom rules
    const allRules = [...this.BUILT_IN_RULES, ...this.customRules].filter((rule) => rule.enabled)

    // Analyze text against all rules
    for (const rule of allRules) {
      let ruleMatches = 0
      let ruleConfidence = 0

      for (const pattern of rule.patterns) {
        const matches = this.findPatternMatches(text, pattern)
        if (matches > 0) {
          ruleMatches += matches
          ruleConfidence = Math.max(ruleConfidence, pattern.confidence)

          detectedPatterns.push({
            rule: rule.name,
            pattern: pattern.value,
            matches,
            confidence: pattern.confidence,
          })
        }
      }

      // Calculate rule contribution to risk score
      if (ruleMatches > 0) {
        const riskMultiplier = this.getRiskLevelValue(rule.riskLevel)
        const ruleScore = (ruleMatches * ruleConfidence * riskMultiplier) / 10
        totalRiskScore += ruleScore

        frameworksSet.add(rule.framework)

        // Determine processing method (client-side for sensitive data)
        if (rule.processingMethod === "client" && rule.riskLevel === "critical") {
          highestRiskProcessingMethod = "client"
        }
      }
    }

    // Determine sensitivity level based on risk score
    let sensitivity: DocumentClassification["sensitivity"]
    if (totalRiskScore >= 8) {
      sensitivity = "restricted"
    } else if (totalRiskScore >= 5) {
      sensitivity = "confidential"
    } else if (totalRiskScore >= 2) {
      sensitivity = "internal"
    } else {
      sensitivity = "public"
    }

    // Override processing method for restricted documents
    const processingMethod = sensitivity === "restricted" ? "client" : highestRiskProcessingMethod

    return {
      sensitivity,
      frameworks: Array.from(frameworksSet),
      processingMethod,
      riskScore: Math.round(totalRiskScore * 100) / 100,
      detectedPatterns,
    }
  }

  static addCustomRule(rule: Omit<SensitivityRule, "id">): SensitivityRule {
    const customRule: SensitivityRule = {
      ...rule,
      id: `custom_sensitivity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.customRules.push(customRule)
    this.saveCustomRules()

    return customRule
  }

  static updateCustomRule(ruleId: string, updates: Partial<SensitivityRule>): boolean {
    const ruleIndex = this.customRules.findIndex((rule) => rule.id === ruleId)
    if (ruleIndex !== -1) {
      this.customRules[ruleIndex] = { ...this.customRules[ruleIndex], ...updates }
      this.saveCustomRules()
      return true
    }
    return false
  }

  static deleteCustomRule(ruleId: string): boolean {
    const initialLength = this.customRules.length
    this.customRules = this.customRules.filter((rule) => rule.id !== ruleId)

    if (this.customRules.length !== initialLength) {
      this.saveCustomRules()
      return true
    }
    return false
  }

  static getCustomRules(): SensitivityRule[] {
    return [...this.customRules]
  }

  static getBuiltInRules(): SensitivityRule[] {
    return [...this.BUILT_IN_RULES]
  }

  static getAllRules(): SensitivityRule[] {
    return [...this.BUILT_IN_RULES, ...this.customRules]
  }

  static getRulesByFramework(framework: ComplianceFramework): SensitivityRule[] {
    return this.getAllRules().filter((rule) => rule.framework === framework && rule.enabled)
  }

  static validateRule(rule: Omit<SensitivityRule, "id">): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!rule.name || rule.name.trim().length === 0) {
      errors.push("Rule name is required")
    }

    if (!rule.patterns || rule.patterns.length === 0) {
      errors.push("At least one pattern is required")
    }

    for (const pattern of rule.patterns || []) {
      if (pattern.type === "regex") {
        try {
          new RegExp(pattern.value)
        } catch {
          errors.push(`Invalid regex pattern: ${pattern.value}`)
        }
      }

      if (pattern.weight < 0 || pattern.weight > 1) {
        errors.push("Pattern weight must be between 0 and 1")
      }

      if (pattern.confidence < 0 || pattern.confidence > 1) {
        errors.push("Pattern confidence must be between 0 and 1")
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  private static findPatternMatches(text: string, pattern: SensitivityPattern): number {
    switch (pattern.type) {
      case "regex":
        try {
          const regex = new RegExp(pattern.value, "gi")
          const matches = text.match(regex)
          return matches ? matches.length : 0
        } catch {
          return 0
        }

      case "keyword":
        const keywordRegex = new RegExp(`\\b${pattern.value}\\b`, "gi")
        const keywordMatches = text.match(keywordRegex)
        return keywordMatches ? keywordMatches.length : 0

      case "context":
        // Simple context matching - could be enhanced with NLP
        const contextRegex = new RegExp(pattern.value, "gi")
        const contextMatches = text.match(contextRegex)
        return contextMatches ? contextMatches.length : 0

      default:
        return 0
    }
  }

  private static getRiskLevelValue(level: RiskLevel): number {
    const values: Record<RiskLevel, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    }
    return values[level] || 1
  }

  private static saveCustomRules(): void {
    try {
      localStorage.setItem("custom_sensitivity_rules", JSON.stringify(this.customRules))
    } catch (error) {
      console.error("[v0] Failed to save custom sensitivity rules:", error)
    }
  }

  static loadCustomRules(): void {
    try {
      const stored = localStorage.getItem("custom_sensitivity_rules")
      if (stored) {
        this.customRules = JSON.parse(stored)
      }
    } catch (error) {
      console.error("[v0] Failed to load custom sensitivity rules:", error)
      this.customRules = []
    }
  }
}

// Initialize custom rules on module load
SensitivityRules.loadCustomRules()
