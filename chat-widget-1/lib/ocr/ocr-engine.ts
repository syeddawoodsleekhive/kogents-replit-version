// Main OCR processing orchestrator

import type { OCRResult, OCRConfig } from "./types"
import { OCRDecisionEngine } from "./decision-engine"
import { ClientOCR } from "./client-ocr"
import { ServerOCR } from "./server-ocr"

export class OCREngine {
  private config: OCRConfig
  private decisionEngine: OCRDecisionEngine
  private clientOCR: ClientOCR
  private serverOCR: ServerOCR

  constructor(config: OCRConfig) {
    this.config = config
    this.decisionEngine = new OCRDecisionEngine()
    this.clientOCR = new ClientOCR(config)
    this.serverOCR = new ServerOCR(config)
  }

  async processFile(file: File, forceLocation?: "client" | "server"): Promise<OCRResult> {
    const startTime = Date.now()

    try {
      // Determine processing location
      const decision = forceLocation
        ? { location: forceLocation, reason: "Forced by caller", sensitivityLevel: 0, estimatedProcessingTime: 0 }
        : this.decisionEngine.determineProcessingLocation(file)

      console.log(`[v0] OCR processing decision: ${decision.location} - ${decision.reason}`)

      if (decision.location === "blocked") {
        return {
          text: "",
          confidence: 0,
          processingTime: Date.now() - startTime,
          processingLocation: "client",
          error: "File blocked due to sensitivity: " + decision.reason,
        }
      }

      // Process based on decision
      let result: OCRResult

      if (decision.location === "client") {
        result = await this.clientOCR.extractText(file)
      } else {
        // Try server-side, fallback to client if enabled
        try {
          result = await this.serverOCR.extractText(file)
        } catch (error) {
          if (this.config.fallbackToServer && this.config.clientSideEngine !== "disabled") {
            console.log("[v0] Server OCR failed, falling back to client-side")
            result = await this.clientOCR.extractText(file)
          } else {
            throw error
          }
        }
      }

      result.processingTime = Date.now() - startTime
      return result
    } catch (error) {
      console.error("[v0] OCR processing failed:", error)
      return {
        text: "",
        confidence: 0,
        processingTime: Date.now() - startTime,
        processingLocation: "client",
        error: error instanceof Error ? error.message : "Unknown OCR error",
      }
    }
  }

  async batchProcess(files: File[]): Promise<OCRResult[]> {
    const results: OCRResult[] = []

    // Process files in parallel with concurrency limit
    const concurrencyLimit = 3
    const chunks = this.chunkArray(files, concurrencyLimit)

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map((file) => this.processFile(file)))
      results.push(...chunkResults)
    }

    return results
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  isSupported(file: File): boolean {
    const extension = file.name.toLowerCase().split(".").pop() || ""
    return this.config.supportedFormats.includes(extension)
  }

  getEstimatedProcessingTime(file: File): number {
    const decision = this.decisionEngine.determineProcessingLocation(file)
    return decision.estimatedProcessingTime
  }
}
