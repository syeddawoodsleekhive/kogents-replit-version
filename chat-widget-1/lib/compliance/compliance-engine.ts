// Main compliance orchestrator for all frameworks

import type { ComplianceResult, ComplianceFramework, ComplianceConfig, ProcessingLocation } from "./types"
import { GDPRDetector } from "./gdpr-detector"
import { HIPAADetector } from "./hipaa-detector"
import { PCIDetector } from "./pci-detector"
import { SOC2Detector } from "./soc2-detector"
import { NISTDetector } from "./nist-detector"

export class ComplianceEngine {
  private config: ComplianceConfig
  private detectors: Map<ComplianceFramework, any>

  constructor(config: ComplianceConfig) {
    this.config = config
    this.detectors = new Map([
      ["GDPR", new GDPRDetector()],
      ["CCPA", new GDPRDetector()], // CCPA uses similar patterns to GDPR
      ["HIPAA", new HIPAADetector()],
      ["PCI_DSS", new PCIDetector()],
      ["SOC2", new SOC2Detector()],
      ["NIST", new NISTDetector()],
    ])
  }

  async analyzeContent(content: string, filename?: string): Promise<ComplianceResult[]> {
    const results: ComplianceResult[] = []

    for (const framework of this.config.enabledFrameworks) {
      const detector = this.detectors.get(framework)
      if (!detector) continue

      try {
        const result = await detector.analyze(content, filename)
        results.push({
          ...result,
          framework,
          processingRecommendation: this.determineProcessingLocation(result),
        })
      } catch (error) {
        console.error(`[v0] Compliance analysis failed for ${framework}:`, error)
      }
    }

    return results
  }

  private determineProcessingLocation(result: any): ProcessingLocation {
    // Determine if content should be processed client-side, server-side, or blocked
    const criticalViolations = result.violations?.filter((v: any) => v.severity === "critical") || []
    const highViolations = result.violations?.filter((v: any) => v.severity === "high") || []

    // Block if critical violations found
    if (criticalViolations.length > 0) {
      return "blocked"
    }

    // Process client-side for sensitive content
    if (highViolations.length > 0 || result.riskScore > this.config.riskThreshold) {
      return "client"
    }

    // Server-side for general content
    return "server"
  }

  calculateOverallRisk(results: ComplianceResult[]): number {
    if (results.length === 0) return 0

    const maxRisk = Math.max(...results.map((r) => r.riskScore))
    const avgRisk = results.reduce((sum, r) => sum + r.riskScore, 0) / results.length

    // Weight towards highest risk found
    return Math.min(100, maxRisk * 0.7 + avgRisk * 0.3)
  }

  shouldProcessClientSide(results: ComplianceResult[]): boolean {
    return results.some((r) => r.processingRecommendation === "client")
  }

  shouldBlock(results: ComplianceResult[]): boolean {
    return results.some((r) => r.processingRecommendation === "blocked")
  }
}
