import { ComplianceEngine } from "../lib/compliance/compliance-engine"
import type { ComplianceFramework, ComplianceResult } from "../lib/compliance/types"

export interface ComplianceWorkerMessage {
  id: string
  type: "scan" | "cancel"
  payload?: {
    text: string
    frameworks: ComplianceFramework[]
    options?: {
      strictMode?: boolean
      includeContext?: boolean
    }
  }
}

export interface ComplianceWorkerResponse {
  id: string
  type: "result" | "error" | "progress"
  payload: ComplianceResult | { error: string } | { progress: number }
}

// Worker context
declare const self: DedicatedWorkerGlobalScope

class ComplianceWorker {
  private activeScans = new Map<string, boolean>()

  constructor() {
    self.addEventListener("message", this.handleMessage.bind(this))
  }

  private async handleMessage(event: MessageEvent<ComplianceWorkerMessage>) {
    const { id, type, payload } = event.data

    try {
      switch (type) {
        case "scan":
          await this.handleScan(id, payload!)
          break
        case "cancel":
          this.handleCancel(id)
          break
        default:
          this.sendError(id, `Unknown message type: ${type}`)
      }
    } catch (error) {
      this.sendError(id, error instanceof Error ? error.message : "Unknown error")
    }
  }

  private async handleScan(
    id: string,
    payload: {
      text: string
      frameworks: ComplianceFramework[]
      options?: { strictMode?: boolean; includeContext?: boolean }
    },
  ) {
    const { text, frameworks, options = {} } = payload

    // Mark scan as active
    this.activeScans.set(id, true)

    try {
      // Send initial progress
      this.sendProgress(id, 0)

      // Perform compliance scan
      const result = await this.performComplianceScan(id, text, frameworks, options)

      // Send final result if not cancelled
      if (this.activeScans.get(id)) {
        this.sendResult(id, result)
      }
    } catch (error) {
      if (this.activeScans.get(id)) {
        this.sendError(id, error instanceof Error ? error.message : "Scan failed")
      }
    } finally {
      // Cleanup
      this.activeScans.delete(id)
    }
  }

  private async performComplianceScan(
    id: string,
    text: string,
    frameworks: ComplianceFramework[],
    options: { strictMode?: boolean; includeContext?: boolean },
  ): Promise<ComplianceResult> {
    const totalFrameworks = frameworks.length
    let completedFrameworks = 0

    // Initialize result
    const result: ComplianceResult = {
      isCompliant: true,
      riskLevel: "low" as any,
      detectedPatterns: [],
      violations: [],
      frameworks: [],
      confidence: 1.0,
      processingTime: 0,
      recommendations: [],
    }

    const startTime = performance.now()

    // Process each framework
    for (const framework of frameworks) {
      // Check if scan was cancelled
      if (!this.activeScans.get(id)) {
        throw new Error("Scan cancelled")
      }

      // Update progress
      const progress = Math.round((completedFrameworks / totalFrameworks) * 100)
      this.sendProgress(id, progress)

      // Scan with specific framework
      const frameworkResult = await ComplianceEngine.scanContent(text, [framework], {
        strictMode: options.strictMode,
        includeContext: options.includeContext,
      })

      // Merge results
      result.detectedPatterns.push(...frameworkResult.detectedPatterns)
      result.violations.push(...frameworkResult.violations)
      result.frameworks.push(framework)
      result.recommendations.push(...frameworkResult.recommendations)

      // Update compliance status
      if (!frameworkResult.isCompliant) {
        result.isCompliant = false
      }

      // Update risk level (take highest)
      if (this.getRiskLevelValue(frameworkResult.riskLevel) > this.getRiskLevelValue(result.riskLevel)) {
        result.riskLevel = frameworkResult.riskLevel
      }

      completedFrameworks++

      // Small delay to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 1))
    }

    // Calculate final metrics
    result.processingTime = performance.now() - startTime
    result.confidence = this.calculateOverallConfidence(result.detectedPatterns)

    // Send final progress
    this.sendProgress(id, 100)

    return result
  }

  private handleCancel(id: string) {
    this.activeScans.set(id, false)
  }

  private sendResult(id: string, result: ComplianceResult) {
    const response: ComplianceWorkerResponse = {
      id,
      type: "result",
      payload: result,
    }
    self.postMessage(response)
  }

  private sendError(id: string, error: string) {
    const response: ComplianceWorkerResponse = {
      id,
      type: "error",
      payload: { error },
    }
    self.postMessage(response)
  }

  private sendProgress(id: string, progress: number) {
    const response: ComplianceWorkerResponse = {
      id,
      type: "progress",
      payload: { progress },
    }
    self.postMessage(response)
  }

  private getRiskLevelValue(level: string): number {
    const values: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    }
    return values[level] || 1
  }

  private calculateOverallConfidence(patterns: Array<{ confidence: number }>): number {
    if (patterns.length === 0) return 1.0

    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
    return Math.round(avgConfidence * 100) / 100
  }
}

// Initialize worker
new ComplianceWorker()
