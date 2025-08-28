// PCI DSS compliance detection module

import type { ComplianceResult, ComplianceViolation } from "./types"
import { COMPLIANCE_PATTERNS, validateCreditCard } from "./pattern-library"

export class PCIDetector {
  private readonly CARD_BRANDS = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    diners: /^3[0-9]{13}$/,
    jcb: /^(?:2131|1800|35\d{3})\d{11}$/,
  }

  async analyze(
    content: string,
    filename?: string,
  ): Promise<Omit<ComplianceResult, "framework" | "processingRecommendation">> {
    const violations: ComplianceViolation[] = []
    let riskScore = 0

    // Check for credit card numbers
    const cardMatches = content.match(COMPLIANCE_PATTERNS.CREDIT_CARD.pattern)
    if (cardMatches) {
      for (const match of cardMatches) {
        const cleanCard = match.replace(/\D/g, "")
        if (validateCreditCard(cleanCard)) {
          const brand = this.detectCardBrand(cleanCard)
          violations.push({
            type: "FINANCIAL_DATA",
            severity: "critical",
            description: `Valid ${brand} credit card number detected`,
            pattern: this.maskCardNumber(cleanCard),
            suggestedAction: "block",
          })
          riskScore += 40
        }
      }
    }

    // Check for bank account numbers
    const bankMatches = content.match(COMPLIANCE_PATTERNS.BANK_ACCOUNT.pattern)
    if (bankMatches) {
      for (const match of bankMatches) {
        violations.push({
          type: "FINANCIAL_DATA",
          severity: "high",
          description: "Bank account number detected",
          pattern: this.maskAccountNumber(match),
          suggestedAction: "redact",
        })
        riskScore += 25
      }
    }

    // Check for routing numbers
    const routingMatches = content.match(COMPLIANCE_PATTERNS.ROUTING_NUMBER.pattern)
    if (routingMatches) {
      for (const match of routingMatches) {
        violations.push({
          type: "FINANCIAL_DATA",
          severity: "high",
          description: "Bank routing number detected",
          pattern: match,
          suggestedAction: "redact",
        })
        riskScore += 20
      }
    }

    // Check for CVV patterns
    const cvvPattern = /\b(?:cvv|cvc|security.?code)[\s:]*(\d{3,4})\b/gi
    const cvvMatches = content.match(cvvPattern)
    if (cvvMatches) {
      violations.push({
        type: "FINANCIAL_DATA",
        severity: "critical",
        description: "CVV/CVC security code detected",
        pattern: "CVV: ***",
        suggestedAction: "block",
      })
      riskScore += 35
    }

    // Check for expiration dates near card numbers
    const expiryPattern = /\b(?:exp|expir)[\w\s]*(\d{1,2}\/\d{2,4}|\d{1,2}-\d{2,4})\b/gi
    const expiryMatches = content.match(expiryPattern)
    if (expiryMatches && cardMatches) {
      violations.push({
        type: "FINANCIAL_DATA",
        severity: "high",
        description: "Credit card expiration date detected with card number",
        pattern: "Expiry: **/**",
        suggestedAction: "redact",
      })
      riskScore += 15
    }

    // Check for financial keywords
    const financialKeywords = [
      "payment",
      "transaction",
      "cardholder",
      "merchant",
      "pos",
      "point of sale",
      "payment processor",
      "acquirer",
      "issuer",
    ]

    const lowerContent = content.toLowerCase()
    let financialKeywordCount = 0

    for (const keyword of financialKeywords) {
      if (lowerContent.includes(keyword)) {
        financialKeywordCount++
      }
    }

    if (financialKeywordCount >= 3 && (cardMatches || bankMatches)) {
      violations.push({
        type: "FINANCIAL_DATA",
        severity: "medium",
        description: "Financial context detected with payment data",
        pattern: "financial terminology",
        suggestedAction: "flag",
      })
      riskScore += 10
    }

    // Check filename for financial indicators
    if (filename) {
      const financialFilenamePatterns = [
        /payment/i,
        /card/i,
        /transaction/i,
        /financial/i,
        /billing/i,
        /invoice/i,
        /receipt/i,
      ]

      for (const pattern of financialFilenamePatterns) {
        if (pattern.test(filename)) {
          violations.push({
            type: "FINANCIAL_DATA",
            severity: "medium",
            description: "Filename suggests financial content",
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

  private detectCardBrand(cardNumber: string): string {
    for (const [brand, pattern] of Object.entries(this.CARD_BRANDS)) {
      if (pattern.test(cardNumber)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1)
      }
    }
    return "Unknown"
  }

  private maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 8) return "****"
    return cardNumber.slice(0, 4) + "*".repeat(cardNumber.length - 8) + cardNumber.slice(-4)
  }

  private maskAccountNumber(accountNumber: string): string {
    const digits = accountNumber.replace(/\D/g, "")
    if (digits.length < 4) return "****"
    return "*".repeat(digits.length - 4) + digits.slice(-4)
  }
}
