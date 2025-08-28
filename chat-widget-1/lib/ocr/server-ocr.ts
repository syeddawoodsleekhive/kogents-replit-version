// Server-side OCR using backend API

import type { OCRResult, OCRConfig } from "./types"

export class ServerOCR {
  private config: OCRConfig

  constructor(config: OCRConfig) {
    this.config = config
  }

  async extractText(file: File): Promise<OCRResult> {
    const startTime = Date.now()

    try {
      console.log(`[v0] Sending file to backend for OCR processing`)

      const result = await this.processWithBackend(file)
      result.processingTime = Date.now() - startTime
      result.processingLocation = "server"

      return result
    } catch (error) {
      console.warn(`[v0] Backend OCR failed:`, error)
      throw new Error("Backend OCR processing failed")
    }
  }

  private async processWithBackend(file: File): Promise<Omit<OCRResult, "processingTime" | "processingLocation">> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("sensitivity", this.determineSensitivity(file))
    formData.append("compliance_requirements", JSON.stringify(this.config.complianceFrameworks || []))

    const response = await fetch("/api/ocr/process", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Backend OCR API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      text: data.extractedText || "",
      confidence: data.confidence || 0,
      language: data.detectedLanguage || "unknown",
    }
  }

  private determineSensitivity(file: File): string {
    const filename = file.name.toLowerCase()
    const sensitivePatterns = [
      "medical",
      "patient",
      "health",
      "hipaa",
      "financial",
      "bank",
      "credit",
      "ssn",
      "legal",
      "confidential",
      "classified",
    ]

    for (const pattern of sensitivePatterns) {
      if (filename.includes(pattern)) {
        return "high"
      }
    }

    // Check file type for common sensitive document types
    if (file.type.includes("pdf") || filename.endsWith(".pdf")) {
      return "medium"
    }

    return "low"
  }
}
