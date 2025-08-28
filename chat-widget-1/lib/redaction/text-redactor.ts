export interface TextRedactionRule {
  pattern: RegExp
  type: string
  replacement: string | ((match: string) => string)
  confidence: number
}

export interface TextRedactionContext {
  documentType?: string
  userRole?: string
  complianceLevel?: "basic" | "standard" | "strict"
  preserveReadability?: boolean
}

export class TextRedactor {
  private static readonly REDACTION_RULES: TextRedactionRule[] = [
    // Email addresses
    {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      type: "email",
      replacement: (match) => `${match.substring(0, 2)}***@***.***`,
      confidence: 0.95,
    },

    // Phone numbers (various formats)
    {
      pattern: /(?:\+?1[-.\s]?)?([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      type: "phone",
      replacement: "(***) ***-****",
      confidence: 0.9,
    },

    // Social Security Numbers
    {
      pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      type: "ssn",
      replacement: "***-**-****",
      confidence: 0.95,
    },

    // Credit Card Numbers
    {
      pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      type: "credit_card",
      replacement: "**** **** **** ****",
      confidence: 0.9,
    },

    // IP Addresses
    {
      pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      type: "ip_address",
      replacement: "***.***.***.***",
      confidence: 0.85,
    },

    // URLs with sensitive paths
    {
      pattern: /https?:\/\/[^\s]+/g,
      type: "url",
      replacement: "[URL_REDACTED]",
      confidence: 0.8,
    },
  ]

  static redactText(
    text: string,
    context: TextRedactionContext = {},
  ): { redactedText: string; detections: Array<{ type: string; count: number }> } {
    const { complianceLevel = "standard", preserveReadability = true } = context

    let redactedText = text
    const detections: Record<string, number> = {}

    // Apply redaction rules based on compliance level
    const applicableRules = this.getApplicableRules(complianceLevel)

    for (const rule of applicableRules) {
      const matches = Array.from(text.matchAll(rule.pattern))

      if (matches.length > 0) {
        detections[rule.type] = matches.length

        redactedText = redactedText.replace(rule.pattern, (match) => {
          if (typeof rule.replacement === "function") {
            return rule.replacement(match)
          }
          return rule.replacement
        })
      }
    }

    // Apply contextual redaction
    if (context.documentType) {
      redactedText = this.applyContextualRedaction(redactedText, context)
    }

    return {
      redactedText,
      detections: Object.entries(detections).map(([type, count]) => ({ type, count })),
    }
  }

  private static getApplicableRules(complianceLevel: string): TextRedactionRule[] {
    switch (complianceLevel) {
      case "basic":
        return this.REDACTION_RULES.filter((rule) => ["email", "phone", "ssn"].includes(rule.type))
      case "strict":
        return this.REDACTION_RULES // All rules
      case "standard":
      default:
        return this.REDACTION_RULES.filter((rule) => rule.confidence >= 0.85)
    }
  }

  private static applyContextualRedaction(text: string, context: TextRedactionContext): string {
    let contextualText = text

    // Document type specific redaction
    switch (context.documentType) {
      case "medical":
        contextualText = this.redactMedicalTerms(contextualText)
        break
      case "financial":
        contextualText = this.redactFinancialTerms(contextualText)
        break
      case "legal":
        contextualText = this.redactLegalTerms(contextualText)
        break
    }

    return contextualText
  }

  private static redactMedicalTerms(text: string): string {
    const medicalPatterns = [
      /\b(?:patient|diagnosis|prescription|medication)\s+(?:id|number|#)\s*:?\s*\w+/gi,
      /\b(?:mrn|medical record number)\s*:?\s*\w+/gi,
    ]

    let redacted = text
    for (const pattern of medicalPatterns) {
      redacted = redacted.replace(pattern, "[MEDICAL_INFO_REDACTED]")
    }
    return redacted
  }

  private static redactFinancialTerms(text: string): string {
    const financialPatterns = [/\b(?:account|routing)\s+(?:number|#)\s*:?\s*\w+/gi, /\b(?:iban|swift)\s*:?\s*\w+/gi]

    let redacted = text
    for (const pattern of financialPatterns) {
      redacted = redacted.replace(pattern, "[FINANCIAL_INFO_REDACTED]")
    }
    return redacted
  }

  private static redactLegalTerms(text: string): string {
    const legalPatterns = [/\b(?:case|docket)\s+(?:number|#)\s*:?\s*\w+/gi, /\battorney-client\s+privilege/gi]

    let redacted = text
    for (const pattern of legalPatterns) {
      redacted = redacted.replace(pattern, "[LEGAL_INFO_REDACTED]")
    }
    return redacted
  }

  static validateRedaction(
    originalText: string,
    redactedText: string,
  ): {
    isValid: boolean
    preservedReadability: boolean
    redactionRatio: number
  } {
    const originalLength = originalText.length
    const redactedLength = redactedText.length
    const redactionRatio = 1 - redactedLength / originalLength

    // Check if redaction is reasonable (not over-redacted)
    const isValid = redactionRatio < 0.8 // Less than 80% redacted

    // Check if text is still readable (has some original content)
    const preservedReadability = redactionRatio < 0.5 // More than 50% preserved

    return {
      isValid,
      preservedReadability,
      redactionRatio: Math.round(redactionRatio * 100) / 100,
    }
  }
}
