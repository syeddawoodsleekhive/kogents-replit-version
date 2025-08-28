"use client"

/**
 * React hook for message encryption operations
 */

import { useState, useCallback, useRef, useEffect } from "react"
import {
  messageEncryptionManager,
  type EncryptedMessage,
  type MessageEncryptionOptions,
  type MessageDecryptionResult,
} from "@/utils/message-encryption"

export interface MessageEncryptionTask {
  id: string
  content: string
  status: "pending" | "encrypting" | "completed" | "error"
  progress: number
  error?: string
  result?: EncryptedMessage
}

export interface MessageDecryptionTask {
  id: string
  encryptedMessage: EncryptedMessage
  status: "pending" | "decrypting" | "completed" | "error"
  progress: number
  error?: string
  result?: MessageDecryptionResult
}

export function useMessageEncryption(sessionId: string) {
  const [encryptionTasks, setEncryptionTasks] = useState<Map<string, MessageEncryptionTask>>(new Map())
  const [decryptionTasks, setDecryptionTasks] = useState<Map<string, MessageDecryptionTask>>(new Map())
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true)
  const [encryptionCache, setEncryptionCache] = useState<Map<string, EncryptedMessage>>(new Map())
  const [decryptionCache, setDecryptionCache] = useState<Map<string, string>>(new Map())
  const taskIdCounter = useRef(0)

  /**
   * Generate unique task ID
   */
  const generateTaskId = useCallback(() => {
    return `msg_task_${Date.now()}_${++taskIdCounter.current}`
  }, [])

  /**
   * Encrypt a message
   */
  const encryptMessage = useCallback(
    async (content: string, options?: Partial<MessageEncryptionOptions>): Promise<EncryptedMessage> => {
      if (!isEncryptionEnabled) {
        // Return plaintext wrapped in encryption format for compatibility
        return {
          encryptedContent: btoa(content), // Simple base64 encoding for plaintext mode
          metadata: {
            keyId: "plaintext",
            algorithm: "none",
            iv: "",
            authTag: "",
            timestamp: Date.now(),
            version: "1.0",
          },
          messageType: "text",
          originalLength: content.length,
        }
      }

      // Check cache first
      const cacheKey = `${sessionId}_${content}`
      const cached = encryptionCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const taskId = generateTaskId()

      const task: MessageEncryptionTask = {
        id: taskId,
        content,
        status: "pending",
        progress: 0,
      }

      setEncryptionTasks((prev) => new Map(prev.set(taskId, task)))

      try {
        // Update status to encrypting
        setEncryptionTasks((prev) => {
          const updated = new Map(prev)
          const currentTask = updated.get(taskId)
          if (currentTask) {
            updated.set(taskId, { ...currentTask, status: "encrypting", progress: 50 })
          }
          return updated
        })

        const encryptionOptions: MessageEncryptionOptions = {
          sessionId,
          preserveFormatting: true,
          compressText: false,
          ...options,
        }

        const result = await messageEncryptionManager.encryptMessage(content, encryptionOptions)

        // Cache the result
        setEncryptionCache((prev) => new Map(prev.set(cacheKey, result)))

        // Update status to completed
        setEncryptionTasks((prev) => {
          const updated = new Map(prev)
          const currentTask = updated.get(taskId)
          if (currentTask) {
            updated.set(taskId, {
              ...currentTask,
              status: "completed",
              progress: 100,
              result,
            })
          }
          return updated
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Message encryption failed"

        setEncryptionTasks((prev) => {
          const updated = new Map(prev)
          const currentTask = updated.get(taskId)
          if (currentTask) {
            updated.set(taskId, {
              ...currentTask,
              status: "error",
              error: errorMessage,
            })
          }
          return updated
        })

        throw error
      }
    },
    [sessionId, isEncryptionEnabled, encryptionCache, generateTaskId],
  )

  /**
   * Decrypt a message
   */
  const decryptMessage = useCallback(
    async (encryptedMessage: EncryptedMessage): Promise<string> => {
      // Handle plaintext mode
      if (encryptedMessage.metadata.algorithm === "none") {
        return atob(encryptedMessage.encryptedContent)
      }

      // Check cache first
      const cacheKey = `${sessionId}_${encryptedMessage.encryptedContent}`
      const cached = decryptionCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const taskId = generateTaskId()

      const task: MessageDecryptionTask = {
        id: taskId,
        encryptedMessage,
        status: "pending",
        progress: 0,
      }

      setDecryptionTasks((prev) => new Map(prev.set(taskId, task)))

      try {
        // Update status to decrypting
        setDecryptionTasks((prev) => {
          const updated = new Map(prev)
          const currentTask = updated.get(taskId)
          if (currentTask) {
            updated.set(taskId, { ...currentTask, status: "decrypting", progress: 50 })
          }
          return updated
        })

        const result = await messageEncryptionManager.decryptMessage(encryptedMessage, sessionId)

        // Cache the result
        setDecryptionCache((prev) => new Map(prev.set(cacheKey, result.content)))

        // Update status to completed
        setDecryptionTasks((prev) => {
          const updated = new Map(prev)
          const currentTask = updated.get(taskId)
          if (currentTask) {
            updated.set(taskId, {
              ...currentTask,
              status: "completed",
              progress: 100,
              result,
            })
          }
          return updated
        })

        return result.content
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Message decryption failed"

        setDecryptionTasks((prev) => {
          const updated = new Map(prev)
          const currentTask = updated.get(taskId)
          if (currentTask) {
            updated.set(taskId, {
              ...currentTask,
              status: "error",
              error: errorMessage,
            })
          }
          return updated
        })

        throw error
      }
    },
    [sessionId, decryptionCache, generateTaskId],
  )

  /**
   * Toggle encryption on/off
   */
  const toggleEncryption = useCallback((enabled: boolean) => {
    setIsEncryptionEnabled(enabled)
    // Clear caches when toggling
    setEncryptionCache(new Map())
    setDecryptionCache(new Map())
  }, [])

  /**
   * Clear caches
   */
  const clearCaches = useCallback(() => {
    setEncryptionCache(new Map())
    setDecryptionCache(new Map())
  }, [])

  /**
   * Get encryption statistics
   */
  const getStats = useCallback(() => {
    const encryptionStats = {
      total: encryptionTasks.size,
      pending: 0,
      encrypting: 0,
      completed: 0,
      error: 0,
    }

    const decryptionStats = {
      total: decryptionTasks.size,
      pending: 0,
      decrypting: 0,
      completed: 0,
      error: 0,
    }

    for (const task of encryptionTasks.values()) {
      encryptionStats[task.status]++
    }

    for (const task of decryptionTasks.values()) {
      decryptionStats[task.status]++
    }

    return {
      encryption: encryptionStats,
      decryption: decryptionStats,
      isEnabled: isEncryptionEnabled,
      cacheSize: {
        encryption: encryptionCache.size,
        decryption: decryptionCache.size,
      },
    }
  }, [encryptionTasks, decryptionTasks, isEncryptionEnabled, encryptionCache, decryptionCache])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      messageEncryptionManager.cleanup()
    }
  }, [])

  return {
    encryptMessage,
    decryptMessage,
    toggleEncryption,
    clearCaches,
    getStats,
    isEncryptionEnabled,
    encryptionTasks: Array.from(encryptionTasks.values()),
    decryptionTasks: Array.from(decryptionTasks.values()),
  }
}
