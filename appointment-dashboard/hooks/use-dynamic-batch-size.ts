"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface DeviceCapabilities {
  concurrency: number
  memory: number
  connectionType: string
  effectiveType: string
  downlink: number
}

interface BatchConfig {
  maxConcurrent: number
  chunkSize: number
  adaptiveQuality: boolean
  progressiveRendering: boolean
}

export function useDynamicBatchSize() {
  const [batchConfig, setBatchConfig] = useState<BatchConfig>({
    maxConcurrent: 2,
    chunkSize: 100,
    adaptiveQuality: true,
    progressiveRendering: true,
  })

  const performanceMetrics = useRef({
    averageCompressionTime: 0,
    successRate: 100,
    memoryUsage: 0,
    taskCount: 0,
  })

  // Detect device capabilities
  const detectCapabilities = useCallback((): DeviceCapabilities => {
    const nav = navigator as any

    return {
      concurrency: nav.hardwareConcurrency || 4,
      memory: nav.deviceMemory || 4, // GB
      connectionType: nav.connection?.type || "unknown",
      effectiveType: nav.connection?.effectiveType || "4g",
      downlink: nav.connection?.downlink || 10, // Mbps
    }
  }, [])

  // Calculate optimal batch size based on device capabilities
  const calculateOptimalBatch = useCallback((capabilities: DeviceCapabilities): BatchConfig => {
    let maxConcurrent = 2
    let chunkSize = 100
    let adaptiveQuality = true
    let progressiveRendering = true

    // Adjust based on CPU cores
    if (capabilities.concurrency >= 8) {
      maxConcurrent = 4
    } else if (capabilities.concurrency >= 4) {
      maxConcurrent = 3
    } else {
      maxConcurrent = 2
    }

    // Adjust based on memory
    if (capabilities.memory >= 8) {
      chunkSize = 150
      maxConcurrent = Math.min(maxConcurrent + 1, 6)
    } else if (capabilities.memory <= 2) {
      chunkSize = 50
      maxConcurrent = Math.max(maxConcurrent - 1, 1)
      progressiveRendering = true // Force progressive on low memory
    }

    // Adjust based on network
    if (capabilities.effectiveType === "slow-2g" || capabilities.effectiveType === "2g") {
      adaptiveQuality = true
      maxConcurrent = 1
    } else if (capabilities.effectiveType === "3g") {
      maxConcurrent = Math.max(maxConcurrent - 1, 1)
    }

    // Adjust based on connection downlink
    if (capabilities.downlink < 1) {
      maxConcurrent = 1
      adaptiveQuality = true
    }

    return {
      maxConcurrent,
      chunkSize,
      adaptiveQuality,
      progressiveRendering,
    }
  }, [])

  // Update performance metrics
  const updateMetrics = useCallback((compressionTime: number, success: boolean, memoryDelta = 0) => {
    const metrics = performanceMetrics.current

    metrics.taskCount++

    // Update average compression time
    metrics.averageCompressionTime =
      (metrics.averageCompressionTime * (metrics.taskCount - 1) + compressionTime) / metrics.taskCount

    // Update success rate
    const successCount = Math.round((metrics.successRate * (metrics.taskCount - 1)) / 100)
    const newSuccessCount = success ? successCount + 1 : successCount
    metrics.successRate = (newSuccessCount / metrics.taskCount) * 100

    // Update memory usage
    metrics.memoryUsage += memoryDelta

    // Adapt batch size based on performance
    adaptBatchSize()
  }, [])

  // Adapt batch size based on current performance
  const adaptBatchSize = useCallback(() => {
    const metrics = performanceMetrics.current
    const currentConfig = batchConfig

    // If compression is taking too long, reduce batch size
    if (metrics.averageCompressionTime > 5000) {
      // 5 seconds
      setBatchConfig((prev) => ({
        ...prev,
        maxConcurrent: Math.max(prev.maxConcurrent - 1, 1),
        chunkSize: Math.max(prev.chunkSize - 25, 25),
      }))
    }

    // If success rate is low, be more conservative
    if (metrics.successRate < 90) {
      setBatchConfig((prev) => ({
        ...prev,
        maxConcurrent: Math.max(prev.maxConcurrent - 1, 1),
        progressiveRendering: true,
      }))
    }

    // If performance is good, try to increase efficiency
    if (metrics.averageCompressionTime < 2000 && metrics.successRate > 95) {
      const capabilities = detectCapabilities()
      const optimalConfig = calculateOptimalBatch(capabilities)

      setBatchConfig((prev) => ({
        ...prev,
        maxConcurrent: Math.min(prev.maxConcurrent + 1, optimalConfig.maxConcurrent),
        chunkSize: Math.min(prev.chunkSize + 25, optimalConfig.chunkSize),
      }))
    }
  }, [batchConfig, detectCapabilities, calculateOptimalBatch])

  // Get compression options based on file size and current config
  const getCompressionOptions = useCallback(
    (fileSize: number) => {
      const baseQuality =
        fileSize > 5 * 1024 * 1024 ? 0.6 : fileSize > 2 * 1024 * 1024 ? 0.7 : fileSize > 1024 * 1024 ? 0.8 : 0.9

      return {
        quality: batchConfig.adaptiveQuality ? baseQuality : 0.8,
        enableProgressiveRendering: batchConfig.progressiveRendering,
        chunkSize: batchConfig.chunkSize,
        maxWidth: fileSize > 10 * 1024 * 1024 ? 1000 : 1200,
        maxHeight: fileSize > 10 * 1024 * 1024 ? 1000 : 1200,
      }
    },
    [batchConfig],
  )

  // Initialize with device-specific settings
  useEffect(() => {
    const capabilities = detectCapabilities()
    const optimalConfig = calculateOptimalBatch(capabilities)
    setBatchConfig(optimalConfig)
  }, [detectCapabilities, calculateOptimalBatch])

  // Monitor network changes
  useEffect(() => {
    const connection = (navigator as any).connection
    if (!connection) return

    const handleConnectionChange = () => {
      const capabilities = detectCapabilities()
      const optimalConfig = calculateOptimalBatch(capabilities)
      setBatchConfig(optimalConfig)
    }

    connection.addEventListener("change", handleConnectionChange)
    return () => connection.removeEventListener("change", handleConnectionChange)
  }, [detectCapabilities, calculateOptimalBatch])

  return {
    batchConfig,
    updateMetrics,
    getCompressionOptions,
    performanceMetrics: performanceMetrics.current,
  }
}
