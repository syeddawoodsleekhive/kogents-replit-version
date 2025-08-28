/**
 * Web Worker Pool Manager
 * Manages a pool of reusable workers to avoid creation/termination overhead
 */

interface PooledWorker {
  worker: Worker
  id: string
  isActive: boolean
  lastUsed: number
  taskCount: number
}

interface WorkerPoolOptions {
  maxWorkers?: number
  maxIdleTime?: number // milliseconds
  maxTasksPerWorker?: number
  workerScript: string
}

export class WorkerPool {
  private workers: Map<string, PooledWorker> = new Map()
  private queue: Array<{ resolve: (worker: PooledWorker) => void; reject: (error: Error) => void }> = []
  private options: Required<WorkerPoolOptions>
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(options: WorkerPoolOptions) {
    this.options = {
      maxWorkers: options.maxWorkers || Math.min(4, navigator.hardwareConcurrency || 2),
      maxIdleTime: options.maxIdleTime || 5 * 60 * 1000, // 5 minutes
      maxTasksPerWorker: options.maxTasksPerWorker || 50,
      workerScript: options.workerScript,
    }

    this.startCleanupTimer()
  }

  private startCleanupTimer(): void {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleWorkers()
    }, 60000) // Check every minute
  }

  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  private cleanupIdleWorkers(): void {
    const now = Date.now()
    const workersToRemove: string[] = []

    this.workers.forEach((pooledWorker, id) => {
      if (!pooledWorker.isActive && now - pooledWorker.lastUsed > this.options.maxIdleTime) {
        workersToRemove.push(id)
      }
    })

    workersToRemove.forEach((id) => {
      const pooledWorker = this.workers.get(id)
      if (pooledWorker) {
        pooledWorker.worker.terminate()
        this.workers.delete(id)
      }
    })
  }

  private createWorker(): PooledWorker {
    const id = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`[WorkerPool] Creating worker ${id} with script: ${this.options.workerScript}`)
    
    try {
      const worker = new Worker(this.options.workerScript)
      console.log(`[WorkerPool] Worker ${id} created successfully`)

      const pooledWorker: PooledWorker = {
        worker,
        id,
        isActive: false,
        lastUsed: Date.now(),
        taskCount: 0,
      }

      worker.onerror = (error) => {
        console.error(`[WorkerPool] Worker ${id} error:`, error)
        this.removeWorker(id)
      }

      this.workers.set(id, pooledWorker)
      return pooledWorker
    } catch (error) {
      console.error(`[WorkerPool] Failed to create worker ${id}:`, error)
      throw error
    }
  }

  private removeWorker(id: string): void {
    const pooledWorker = this.workers.get(id)
    if (pooledWorker) {
      pooledWorker.worker.terminate()
      this.workers.delete(id)
    }
  }

  async acquireWorker(): Promise<PooledWorker> {
    const availableWorker = Array.from(this.workers.values()).find((w) => !w.isActive)

    if (availableWorker) {
      availableWorker.isActive = true
      availableWorker.lastUsed = Date.now()
      return availableWorker
    }

    if (this.workers.size < this.options.maxWorkers) {
      const newWorker = this.createWorker()
      newWorker.isActive = true
      return newWorker
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject })

      // Timeout after 30 seconds
      setTimeout(() => {
        const index = this.queue.findIndex((item) => item.resolve === resolve)
        if (index !== -1) {
          this.queue.splice(index, 1)
          reject(new Error("Worker acquisition timeout"))
        }
      }, 30000)
    })
  }

  releaseWorker(workerId: string): void {
    const pooledWorker = this.workers.get(workerId)
    if (!pooledWorker) return

    pooledWorker.isActive = false
    pooledWorker.lastUsed = Date.now()
    pooledWorker.taskCount++

    if (pooledWorker.taskCount >= this.options.maxTasksPerWorker) {
      this.removeWorker(workerId)
    }

    if (this.queue.length > 0) {
      const nextRequest = this.queue.shift()
      if (nextRequest && !pooledWorker.isActive && this.workers.has(workerId)) {
        pooledWorker.isActive = true
        pooledWorker.lastUsed = Date.now()
        nextRequest.resolve(pooledWorker)
      }
    }
  }

  getStats(): {
    totalWorkers: number
    activeWorkers: number
    queueLength: number
    averageTasksPerWorker: number
  } {
    const workers = Array.from(this.workers.values())
    const activeWorkers = workers.filter((w) => w.isActive).length
    const totalTasks = workers.reduce((sum, w) => sum + w.taskCount, 0)

    return {
      totalWorkers: this.workers.size,
      activeWorkers,
      queueLength: this.queue.length,
      averageTasksPerWorker: workers.length > 0 ? totalTasks / workers.length : 0,
    }
  }

  terminate(): void {
    this.stopCleanupTimer()

    // Reject all queued requests
    this.queue.forEach(({ reject }) => {
      reject(new Error("Worker pool terminated"))
    })
    this.queue.length = 0

    // Terminate all workers
    this.workers.forEach((pooledWorker) => {
      pooledWorker.worker.terminate()
    })
    this.workers.clear()
  }
}

// Singleton instance for compression workers
let compressionWorkerPool: WorkerPool | null = null

export function getCompressionWorkerPool(): WorkerPool {
  if (!compressionWorkerPool) {
    compressionWorkerPool = new WorkerPool({
      maxWorkers: Math.min(4, navigator.hardwareConcurrency || 2),
      maxIdleTime: 5 * 60 * 1000, // 5 minutes
      maxTasksPerWorker: 50,
      workerScript: "/compression-worker.js",
    })
  }
  return compressionWorkerPool
}

export function terminateCompressionWorkerPool(): void {
  if (compressionWorkerPool) {
    compressionWorkerPool.terminate()
    compressionWorkerPool = null
  }
}

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", terminateCompressionWorkerPool)
  window.addEventListener("unload", terminateCompressionWorkerPool)
}
