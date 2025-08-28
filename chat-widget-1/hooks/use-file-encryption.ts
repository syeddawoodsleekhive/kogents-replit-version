"use client"

/**
 * React hook for file encryption operations
 */

import { useState, useCallback, useRef, useEffect } from "react"
import {
  fileEncryptionManager,
  type EncryptedFile,
  type FileEncryptionOptions,
  type FileDecryptionResult,
} from "@/utils/file-encryption"

export interface EncryptionTask {
  id: string
  file: File
  status: "pending" | "encrypting" | "completed" | "error"
  progress: number
  error?: string
  result?: EncryptedFile
}

export interface DecryptionTask {
  id: string
  encryptedFile: EncryptedFile
  status: "pending" | "decrypting" | "completed" | "error"
  progress: number
  error?: string
  result?: FileDecryptionResult
}

export function useFileEncryption(sessionId: string) {
  const [encryptionTasks, setEncryptionTasks] = useState<Map<string, EncryptionTask>>(new Map())
  const [decryptionTasks, setDecryptionTasks] = useState<Map<string, DecryptionTask>>(new Map())
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true)
  const taskIdCounter = useRef(0)

  /**
   * Generate unique task ID
   */
  const generateTaskId = useCallback(() => {
    return `task_${Date.now()}_${++taskIdCounter.current}`
  }, [])

  /**
   * Encrypt a file
   */
  const encryptFile = useCallback(
    async (file: File, options?: Partial<FileEncryptionOptions>): Promise<string> => {
      const taskId = generateTaskId()

      const task: EncryptionTask = {
        id: taskId,
        file,
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

        const encryptionOptions: FileEncryptionOptions = {
          sessionId,
          generateThumbnail: true,
          thumbnailSize: 150,
          preserveMetadata: false,
          ...options,
        }

        const result = await fileEncryptionManager.encryptFileWithWorker(file, encryptionOptions)

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

        return taskId
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Encryption failed"

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
    [sessionId, generateTaskId],
  )

  /**
   * Decrypt a file
   */
  const decryptFile = useCallback(
    async (encryptedFile: EncryptedFile): Promise<string> => {
      const taskId = generateTaskId()

      const task: DecryptionTask = {
        id: taskId,
        encryptedFile,
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

        const result = await fileEncryptionManager.decryptFileWithWorker(encryptedFile, sessionId)

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

        return taskId
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Decryption failed"

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
    [sessionId, generateTaskId],
  )

  /**
   * Get encryption task by ID
   */
  const getEncryptionTask = useCallback(
    (taskId: string): EncryptionTask | undefined => {
      return encryptionTasks.get(taskId)
    },
    [encryptionTasks],
  )

  /**
   * Get decryption task by ID
   */
  const getDecryptionTask = useCallback(
    (taskId: string): DecryptionTask | undefined => {
      return decryptionTasks.get(taskId)
    },
    [decryptionTasks],
  )

  /**
   * Remove completed tasks
   */
  const clearCompletedTasks = useCallback(() => {
    setEncryptionTasks((prev) => {
      const updated = new Map()
      for (const [id, task] of prev) {
        if (task.status !== "completed") {
          updated.set(id, task)
        }
      }
      return updated
    })

    setDecryptionTasks((prev) => {
      const updated = new Map()
      for (const [id, task] of prev) {
        if (task.status !== "completed") {
          updated.set(id, task)
        }
      }
      return updated
    })
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
    }
  }, [encryptionTasks, decryptionTasks, isEncryptionEnabled])

  /**
   * Toggle encryption on/off
   */
  const toggleEncryption = useCallback((enabled: boolean) => {
    setIsEncryptionEnabled(enabled)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fileEncryptionManager.cleanup()
    }
  }, [])

  return {
    encryptFile,
    decryptFile,
    getEncryptionTask,
    getDecryptionTask,
    clearCompletedTasks,
    getStats,
    toggleEncryption,
    isEncryptionEnabled,
    encryptionTasks: Array.from(encryptionTasks.values()),
    decryptionTasks: Array.from(decryptionTasks.values()),
  }
}
