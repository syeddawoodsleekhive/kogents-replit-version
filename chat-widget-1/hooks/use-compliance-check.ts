"use client"

// React hook for compliance validation

import { useState, useCallback } from "react"
import { ComplianceEngine } from "@/lib/compliance/compliance-engine"
import { OCREngine } from "@/lib/ocr/ocr-engine"
import type { ComplianceConfig } from "@/lib/compliance/types"
import type { OCRConfig } from "@/lib/ocr/types"

const DEFAULT_COMPLIANCE_CONFIG: ComplianceConfig = {
  enabledFrameworks: ["GDPR", "HIPAA", "PCI_DSS", "SOC2"],
  riskThreshold: 70,
  autoRedaction: false,
  auditLogging: true,
  processingPreference: "privacy-first",
}

const DEFAULT_OCR_CONFIG: OCRConfig = {
  clientSideEngine: "tesseract",
  serverSideProviders: ["google"],
  fallbackToServer: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ["jpg", "jpeg", "png", "pdf", "gif", "bmp", "tiff"],
  languages: ["eng", "ara", "chi_sim", "fra", "deu", "spa"],
}

export function useComplianceCheck() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [complianceEngine] = useState(() => new ComplianceEngine(DEFAULT_COMPLIANCE_CONFIG))
  const [ocrEngine] = useState(() => new OCREngine(DEFAULT_OCR_CONFIG))

  const checkFileCompliance = useCallback(
    async (
      file: File,
    ): Promise<{
      isCompliant: boolean
      shouldBlock: boolean
      shouldProcessClientSide: boolean
      riskScore: number
      violations: any[]
      processingTime: number
    }> => {
      const startTime = Date.now()
      setIsProcessing(true)

      try {
        console.log(`[v0] Starting compliance check for file: ${file.name}`)

        let textContent = ""
        let ocrResults: any = null

        // Check if file needs OCR processing
        if (ocrEngine.isSupported(file)) {
          try {
            ocrResults = await ocrEngine.processFile(file)
            textContent = ocrResults.text || ""
            console.log(`[v0] OCR extracted ${textContent.length} characters`)
          } catch (error) {
            console.warn("[v0] OCR processing failed, proceeding with filename-only analysis:", error)
          }
        }

        // Perform compliance analysis
        const complianceResults = await complianceEngine.analyzeContent(textContent, file.name)

        // Calculate overall compliance status
        const overallRisk = complianceEngine.calculateOverallRisk(complianceResults)
        const shouldBlock = complianceEngine.shouldBlock(complianceResults)
        const shouldProcessClientSide = complianceEngine.shouldProcessClientSide(complianceResults)
        const isCompliant = complianceResults.every((r) => r.isCompliant)

        // Collect all violations
        const allViolations = complianceResults.flatMap((r) => r.violations)

        const processingTime = Date.now() - startTime

        console.log(`[v0] Compliance check completed in ${processingTime}ms:`, {
          isCompliant,
          shouldBlock,
          shouldProcessClientSide,
          riskScore: overallRisk,
          violationCount: allViolations.length,
        })

        return {
          isCompliant,
          shouldBlock,
          shouldProcessClientSide,
          riskScore: overallRisk,
          violations: allViolations,
          processingTime,
        }
      } catch (error) {
        console.error("[v0] Compliance check failed:", error)

        // Fail-safe: if compliance check fails, allow file but log the error
        return {
          isCompliant: true,
          shouldBlock: false,
          shouldProcessClientSide: false,
          riskScore: 0,
          violations: [],
          processingTime: Date.now() - startTime,
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [complianceEngine, ocrEngine],
  )

  const checkTextCompliance = useCallback(
    async (
      text: string,
    ): Promise<{
      isCompliant: boolean
      riskScore: number
      violations: any[]
    }> => {
      try {
        // console.log(`[v0] Checking text compliance for ${text.length} characters`)

        const complianceResults = await complianceEngine.analyzeContent(text)
        const overallRisk = complianceEngine.calculateOverallRisk(complianceResults)
        const isCompliant = complianceResults.every((r) => r.isCompliant)
        const allViolations = complianceResults.flatMap((r) => r.violations)

        return {
          isCompliant,
          riskScore: overallRisk,
          violations: allViolations,
        }
      } catch (error) {
        console.error("[v0] Text compliance check failed:", error)
        return {
          isCompliant: true,
          riskScore: 0,
          violations: [],
        }
      }
    },
    [complianceEngine],
  )

  return {
    checkFileCompliance,
    checkTextCompliance,
    isProcessing,
  }
}
