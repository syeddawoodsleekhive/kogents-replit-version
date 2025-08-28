export interface RedactionOptions {
  preserveFormat?: boolean
  redactionChar?: string
  partialRedaction?: boolean
  contextPreservation?: boolean
}

export interface RedactionResult {
  redactedText: string
  redactionMap: RedactionMapping[]
  confidence: number
  originalLength: number
}

export interface RedactionMapping {
  start: number
  end: number
  type: string
  confidence: number
  originalValue?: string
}

export class ContentRedactor {
  private static readonly DEFAULT_REDACTION_CHAR = "█"
  private static readonly PARTIAL_SHOW_LENGTH = 4

  static redactSensitiveContent(
    text: string,
    detectedPatterns: Array<{ type: string; value: string; start: number; end: number; confidence: number }>,
    options: RedactionOptions = {},
  ): RedactionResult {
    const {
      preserveFormat = true,
      redactionChar = this.DEFAULT_REDACTION_CHAR,
      partialRedaction = false,
      contextPreservation = true,
    } = options

    let redactedText = text
    const redactionMap: RedactionMapping[] = []
    let offset = 0

    // Sort patterns by start position (reverse order for proper offset handling)
    const sortedPatterns = [...detectedPatterns].sort((a, b) => b.start - a.start)

    for (const pattern of sortedPatterns) {
      const { type, value, start, end, confidence } = pattern

      // Skip low confidence detections
      if (confidence < 0.7) continue

      const redactedValue = this.generateRedaction(value, type, {
        preserveFormat,
        redactionChar,
        partialRedaction,
      })

      // Replace in text
      redactedText = redactedText.substring(0, start) + redactedValue + redactedText.substring(end)

      // Track redaction
      redactionMap.push({
        start: start - offset,
        end: start - offset + redactedValue.length,
        type,
        confidence,
        originalValue: contextPreservation ? undefined : value,
      })

      offset += end - start - redactedValue.length
    }

    return {
      redactedText,
      redactionMap,
      confidence: this.calculateOverallConfidence(detectedPatterns),
      originalLength: text.length,
    }
  }

  private static generateRedaction(
    value: string,
    type: string,
    options: { preserveFormat: boolean; redactionChar: string; partialRedaction: boolean },
  ): string {
    const { preserveFormat, redactionChar, partialRedaction } = options

    if (partialRedaction && this.shouldPartiallyRedact(type)) {
      return this.createPartialRedaction(value, redactionChar)
    }

    if (preserveFormat) {
      return this.createFormattedRedaction(value, redactionChar)
    }

    return `[${type.toUpperCase()}_REDACTED]`
  }

  private static shouldPartiallyRedact(type: string): boolean {
    const partialTypes = ["email", "phone", "credit_card"]
    return partialTypes.includes(type)
  }

  private static createPartialRedaction(value: string, redactionChar: string): string {
    if (value.length <= this.PARTIAL_SHOW_LENGTH * 2) {
      return redactionChar.repeat(value.length)
    }

    const showLength = Math.min(this.PARTIAL_SHOW_LENGTH, Math.floor(value.length / 4))
    const start = value.substring(0, showLength)
    const end = value.substring(value.length - showLength)
    const middle = redactionChar.repeat(value.length - showLength * 2)

    return `${start}${middle}${end}`
  }

  private static createFormattedRedaction(value: string, redactionChar: string): string {
    return value.replace(/[a-zA-Z0-9]/g, redactionChar)
  }

  private static calculateOverallConfidence(patterns: Array<{ confidence: number }>): number {
    if (patterns.length === 0) return 1.0

    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
    return Math.round(avgConfidence * 100) / 100
  }

  static createRedactionSummary(result: RedactionResult): string {
    const typeCount = result.redactionMap.reduce(
      (acc, mapping) => {
        acc[mapping.type] = (acc[mapping.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const summaryParts = Object.entries(typeCount).map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)

    return summaryParts.length > 0 ? `Redacted: ${summaryParts.join(", ")}` : "No sensitive content detected"
  }
}
