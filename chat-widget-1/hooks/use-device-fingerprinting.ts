"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DeviceFingerprint } from "@/types/chat"
import type { FingerprintingOptions } from "@/types/fingerprint"

interface FingerprintingState {
  fingerprint: DeviceFingerprint | null
  isLoading: boolean
  progress: number
  errors: string[]
}

interface FingerprintingTask {
  type: string
  taskId: string
  timeout: number
}

export function useDeviceFingerprinting(options: Partial<FingerprintingOptions> = {}) {
  const [state, setState] = useState<FingerprintingState>({
    fingerprint: null,
    isLoading: false,
    progress: 0,
    errors: [],
  })

  const workerRef = useRef<Worker | null>(null)
  const taskTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const completedTasksRef = useRef<Set<string>>(new Set())

  // Initialize worker
  const initializeWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current

    try {
      workerRef.current = new Worker("/fingerprinting-worker.js")

      workerRef.current.onmessage = (e) => {
        const { taskId, type, success, result, error, processingTime } = e.data

        // Clear timeout for this task
        const timeout = taskTimeoutsRef.current.get(taskId)
        if (timeout) {
          clearTimeout(timeout)
          taskTimeoutsRef.current.delete(taskId)
        }

        completedTasksRef.current.add(taskId)

        setState((prev) => {
          const newFingerprint = { ...prev.fingerprint } as any

          if (success && result) {
            newFingerprint[type] = result
          }

          const totalTasks = Object.values(options).filter(Boolean).length
          const completedTasks = completedTasksRef.current.size
          const progress = Math.round((completedTasks / totalTasks) * 100)

          return {
            ...prev,
            fingerprint: newFingerprint,
            progress,
            isLoading: completedTasks < totalTasks,
            errors: error ? [...prev.errors, error] : prev.errors,
          }
        })
      }

      workerRef.current.onerror = (error) => {
        setState((prev) => ({
          ...prev,
          errors: [...prev.errors, `Worker error: ${error.message}`],
        }))
      }

      return workerRef.current
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errors: [...prev.errors, `Failed to initialize worker: ${error}`],
      }))
      return null
    }
  }, [options])

  // Execute fingerprinting task with timeout
  const executeTask = useCallback(
    (task: FingerprintingTask) => {
      const worker = initializeWorker()
      if (!worker) return

      // Set individual task timeout
      const timeout = setTimeout(() => {
        completedTasksRef.current.add(task.taskId)
        setState((prev) => ({
          ...prev,
          errors: [...prev.errors, `Task ${task.type} timed out`],
        }))
      }, task.timeout)

      taskTimeoutsRef.current.set(task.taskId, timeout)

      // Send task to worker
      worker.postMessage({
        type: task.type,
        taskId: task.taskId,
        options,
      })
    },
    [initializeWorker, options],
  )

  // Generate fingerprint using worker
  const generateFingerprint = useCallback(
    async (consentGiven = false) => {
      if (!consentGiven && options.respectPrivacy !== false) {
        setState((prev) => ({
          ...prev,
          errors: [...prev.errors, "Device fingerprinting requires user consent"],
        }))
        return null
      }

      setState({
        fingerprint: null,
        isLoading: true,
        progress: 0,
        errors: [],
      })

      completedTasksRef.current.clear()

      // Create tasks for enabled features
      const tasks: FingerprintingTask[] = []

      if (options.enableCanvas !== false) {
        tasks.push({
          type: "canvas",
          taskId: `canvas-${Date.now()}`,
          timeout: 2000,
        })
      }

      if (options.enableWebGL !== false) {
        tasks.push({
          type: "webgl",
          taskId: `webgl-${Date.now()}`,
          timeout: 3000,
        })
      }

      if (options.enableFonts !== false) {
        tasks.push({
          type: "fonts",
          taskId: `fonts-${Date.now()}`,
          timeout: 2000,
        })
      }

      // Execute tasks with staggered timing to prevent overwhelming
      tasks.forEach((task, index) => {
        if ("requestIdleCallback" in window) {
          requestIdleCallback(() => executeTask(task), { timeout: 1000 })
        } else {
          setTimeout(() => executeTask(task), index * 100)
        }
      })

      // Overall timeout
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }))
      }, options.timeout || 5000)
    },
    [options, executeTask],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all task timeouts
      taskTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      taskTimeoutsRef.current.clear()

      // Terminate worker
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "cleanup" })
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  return {
    ...state,
    generateFingerprint,
  }
}
