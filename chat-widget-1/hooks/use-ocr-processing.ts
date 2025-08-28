"use client"

import { useState, useCallback, useRef } from "react"
import { OCREngine } from "@/lib/ocr/ocr-engine"
import type { OCRResult, ProcessingMethod } from "@/lib/ocr/types"
import { ComplianceLogger } from "@/lib/audit/compliance-logger"
import { AuditEventType, RiskLevel } from "@/lib/audit/audit-types"

export interface OCRProcessingState {
  isProcessing: boolean
  progress: number
  currentFile?: string
  error?: string
  results: OCRResult[]
}

export interface OCRProcessingOptions {
  method?: ProcessingMethod
  enableCompliance?: boolean
  onProgress?: (progress: number, fileName: string) => void
  onComplete?: (results: OCRResult[]) => void
  onError?: (error: string, fileName: string) => void
}

export function useOCRProcessing(options: OCRProcessingOptions = {}) {
  const [state, setState] = useState<OCRProcessingState>({
    isProcessing: false,
    progress: 0,
    results: [],
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const processingQueueRef = useRef<File[]>([])

  const processFiles = useCallback(
    async (files: File[]) => {
      if (state.isProcessing) {
        console.warn("[v0] OCR processing already in progress")
        return
      }

      // Reset state
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        progress: 0,
        error: undefined,
        results: [],
      }))

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()
      processingQueueRef.current = [...files]

      try {
        const results: OCRResult[] = []
        const totalFiles = files.length

        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          // Check if processing was cancelled
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error("Processing cancelled by user")
          }

          // Update current file
          setState((prev) => ({
            ...prev,
            currentFile: file.name,
            progress: (i / totalFiles) * 100,
          }))

          // Notify progress callback
          options.onProgress?.(Math.round((i / totalFiles) * 100), file.name)

          try {
            // Process file with OCR engine
            const result = await OCREngine.processFile(file, {
              method: options.method,
              enableCompliance: options.enableCompliance ?? true,
              signal: abortControllerRef.current.signal,
            })

            results.push(result)

            // Log OCR processing event
            if (options.enableCompliance) {
              await ComplianceLogger.logEvent(
                AuditEventType.OCR_PROCESSED,
                {
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                  processingMethod: result.processingMethod,
                  detectedPatterns: result.complianceResults?.detectedPatterns || [],
                },
                result.complianceResults?.frameworks,
                result.complianceResults?.riskLevel || RiskLevel.LOW,
              )
            }
          } catch (fileError) {
            const errorMessage = fileError instanceof Error ? fileError.message : "Unknown error"
            console.error(`[v0] OCR processing failed for ${file.name}:`, errorMessage)

            // Add error result
            results.push({
              fileName: file.name,
              success: false,
              error: errorMessage,
              extractedText: "",
              confidence: 0,
              processingTime: 0,
              processingMethod: options.method || "auto",
            })

            // Notify error callback
            options.onError?.(errorMessage, file.name)
          }
        }

        // Update final state
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          currentFile: undefined,
          results,
        }))

        // Notify completion callback
        options.onComplete?.(results)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "OCR processing failed"

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
          currentFile: undefined,
        }))

        console.error("[v0] OCR processing error:", errorMessage)
      } finally {
        // Cleanup
        abortControllerRef.current = null
        processingQueueRef.current = []
      }
    },
    [state.isProcessing, options],
  )

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort()

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: "Processing cancelled by user",
        currentFile: undefined,
      }))
    }
  }, [])

  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      results: [],
      error: undefined,
    }))
  }, [])

  const retryFailedFiles = useCallback(async () => {
    const failedFiles = processingQueueRef.current.filter((file, index) => {
      const result = state.results[index]
      return result && !result.success
    })

    if (failedFiles.length > 0) {
      await processFiles(failedFiles)
    }
  }, [processFiles, state]) // Updated dependency array to use state instead of state.results

  const getProcessingSummary = useCallback(() => {
    const { results } = state
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length
    const totalProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0)
    const averageConfidence =
      results.length > 0 ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length : 0

    return {
      total: results.length,
      successful,
      failed,
      totalProcessingTime,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
    }
  }, [state]) // Updated dependency array to use state instead of state.results

  return {
    // State
    ...state,

    // Actions
    processFiles,
    cancelProcessing,
    clearResults,
    retryFailedFiles,

    // Computed
    summary: getProcessingSummary(),

    // Status checks
    canProcess: !state.isProcessing,
    hasResults: state.results.length > 0,
    hasErrors: state.results.some((r) => !r.success) || !!state.error,
  }
}

export default useOCRProcessing
