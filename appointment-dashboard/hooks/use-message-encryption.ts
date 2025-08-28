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
  const encryptMessage = useCallback(async (message: string): Promise<EncryptedMessage> => {
    try {
      console.log("[v0] 🔍 Starting message encryption process...");
      console.log("[v0] 🔍 Session ID:", sessionId);
      console.log("[v0] 🔍 Message to encrypt:", message);
      
      // Ensure session key exists before encryption
      console.log("[v0] 🔍 Generating session key...");
      await messageEncryptionManager.generateSessionKey(sessionId);
      console.log("[v0] 🔍 Session key generated successfully");
      
      console.log("[v0] 🔍 Calling messageEncryptionManager.encryptMessage...");
      const result = await messageEncryptionManager.encryptMessage(message, { sessionId });
      console.log("[v0] 🔍 Encryption result received:", result);
      
      // Enhanced console logging to match reference image format
      console.log("[v0] Message Encrypted Successfully (For Future Use)", {
        sessionId,
        originalMessage: message,
        originalLength: message.length,
        encryptedContent: result.encryptedContent,
        encryptedLength: result.encryptedContent.length,
        encryptionResult: {
          algorithm: result.metadata.algorithm,
          authTag: result.metadata.authTag,
          iv: result.metadata.iv,
          keyId: result.metadata.keyId,
          timestamp: result.metadata.timestamp,
          version: result.metadata.version
        },
        metadata: {
          algorithm: result.metadata.algorithm,
          authTag: result.metadata.authTag,
          iv: result.metadata.iv,
          keyId: result.metadata.keyId,
          timestamp: result.metadata.timestamp,
          version: result.metadata.version,
          originalLength: message.length,
          originalMessage: message,
          sessionId
        }
      });
      
      console.log("[v0] ✅ Message encryption completed successfully");
      return result;
    } catch (error) {
      console.error("[v0] ❌ Message encryption failed:", error);
      throw error;
    }
  }, [sessionId, messageEncryptionManager]);

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
