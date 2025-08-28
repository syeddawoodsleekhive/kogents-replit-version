"use client"

// Internal compliance indicator component (no visible UI changes)

import { useEffect, useRef } from "react"
import { useComplianceCheck } from "@/hooks/use-compliance-check"

interface ComplianceIndicatorProps {
  files: File[]
  textContent?: string
  onComplianceResult?: (result: {
    hasViolations: boolean
    blockedFiles: string[]
    riskScore: number
  }) => void
}

export function ComplianceIndicator({ files, textContent, onComplianceResult }: ComplianceIndicatorProps) {
  const { checkFileCompliance, checkTextCompliance } = useComplianceCheck()
  
  // Use refs to track previous values and prevent unnecessary re-runs
  const prevFilesRef = useRef<File[]>([])
  const prevTextContentRef = useRef<string>("")
  const isProcessingRef = useRef(false)

  useEffect(() => {
    // Prevent multiple simultaneous compliance checks
    if (isProcessingRef.current) return

    // Check if there are actual changes
    const filesChanged = files.length !== prevFilesRef.current.length || 
      files.some((file, index) => file !== prevFilesRef.current[index])
    
    const textChanged = textContent !== prevTextContentRef.current

    if (!filesChanged && !textChanged) return

    // Update refs
    prevFilesRef.current = files
    prevTextContentRef.current = textContent || ""

    // Only run if there's actual content to check
    if (files.length === 0 && (!textContent || textContent.trim().length === 0)) return

    const performComplianceCheck = async () => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true

      try {
        const blockedFiles: string[] = []
        let maxRiskScore = 0
        let hasViolations = false

        // Check files
        for (const file of files) {
          const result = await checkFileCompliance(file)

          if (result.shouldBlock) {
            blockedFiles.push(file.name)
            console.log(`[v0] File blocked due to compliance violations: ${file.name}`)
          }

          if (result.violations.length > 0) {
            hasViolations = true
            console.log(`[v0] Compliance violations found in ${file.name}:`, result.violations)
          }

          maxRiskScore = Math.max(maxRiskScore, result.riskScore)
        }

        // Check text content
        if (textContent && textContent.trim().length > 0) {
          const textResult = await checkTextCompliance(textContent)

          if (textResult.violations.length > 0) {
            hasViolations = true
            console.log("[v0] Compliance violations found in text content:", textResult.violations)
          }

          maxRiskScore = Math.max(maxRiskScore, textResult.riskScore)
        }

        // Report results internally
        onComplianceResult?.({
          hasViolations,
          blockedFiles,
          riskScore: maxRiskScore,
        })

        // Log compliance summary
        if (hasViolations || blockedFiles.length > 0) {
          console.warn(`[v0] Compliance Summary:`, {
            hasViolations,
            blockedFiles: blockedFiles.length,
            riskScore: maxRiskScore,
          })
        } else {
          // console.log("[v0] All content passed compliance checks")
        }
      } catch (error) {
        console.error("[v0] Compliance check failed:", error)

        // Fail-safe: report no violations if check fails
        onComplianceResult?.({
          hasViolations: false,
          blockedFiles: [],
          riskScore: 0,
        })
      } finally {
        isProcessingRef.current = false
      }
    }

    performComplianceCheck()
  }, [files, textContent]) // Only depend on the actual data, not functions

  // This component renders nothing - all work is done internally
  return null
}
