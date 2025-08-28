"use client"

import { getCompressionWorkerPool } from "@/utils/worker-pool"
import { useRef, useCallback, useEffect } from "react"

export interface CompressionTask {
  id: string
  file: File
  options?: CompressionOptions
  onProgress?: (progress: number) => void
  onComplete?: (result: CompressionResult) => void
  onError?: (error: string) => void
}

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  enableProgressiveRendering?: boolean
  chunkSize?: number
}

export interface CompressionResult {
  blob: Blob
  fileName: string
  outputFormat: string
  originalSize: number
  compressedSize: number
  compressionRatio: string
}

// New interfaces for chunked upload support
export interface ChunkedUploadTask {
  id: string
  file: File
  chunkSize: number
  totalChunks: number
  uploadedChunks: Set<number>
  failedChunks: Set<number>
  onProgress?: (progress: number) => void
  onComplete?: (result: CompressionResult) => void
  onError?: (error: string) => void
  onChunkComplete?: (chunkIndex: number, success: boolean) => void
}

export interface ChunkedUploadResult {
  taskId: string
  fileId: string
  totalChunks: number
  uploadedChunks: number
  failedChunks: number
  canResume: boolean
  resumeData?: {
    uploadedChunks: number[]
    failedChunks: number[]
  }
}

export interface ChunkData {
  taskId: string
  chunkIndex: number
  chunkData: Blob
  chunkSize: number
  totalChunks: number
  fileName: string
  fileSize: number
  checksum: string
}

export function useCompressionWorker() {
  const tasksRef = useRef<Map<string, CompressionTask>>(new Map())
  const activeWorkersRef = useRef<Map<string, string>>(new Map()) // taskId -> workerId
  
  // New refs for chunked upload support
  const chunkedTasksRef = useRef<Map<string, ChunkedUploadTask>>(new Map())
  const chunkProgressRef = useRef<Map<string, Map<number, number>>>(new Map()) // taskId -> chunkIndex -> progress

  const handleWorkerMessage = useCallback((workerId: string, e: MessageEvent) => {
    const {
      type,
      taskId,
      progress,
      blob,
      fileName,
      outputFormat,
      originalSize,
      compressedSize,
      compressionRatio,
      error,
      chunkIndex,
      chunkProgress,
      chunkComplete,
    } = e.data

    console.log(`[WorkerHook] Processing message:`, { type, taskId, workerId, hasBlob: !!blob, chunkIndex });

    // Handle chunked upload messages
    if (type === "chunk_progress" || type === "chunk_complete" || type === "chunk_error") {
      handleChunkedUploadMessage(workerId, e.data);
      return;
    }

    const task = tasksRef.current.get(taskId)
    if (!task) {
      console.warn(`[WorkerHook] No task found for taskId: ${taskId}`);
      return;
    }

    console.log(`[WorkerHook] Task found:`, { taskId, fileName: task.file.name });

    switch (type) {
      case "progress":
        console.log(`[WorkerHook] Progress update for ${taskId}: ${progress}%`);
        task.onProgress?.(progress)
        break

      case "complete":
        console.log(`[WorkerHook] Compression complete for ${taskId}:`, {
          originalSize,
          compressedSize,
          compressionRatio,
          hasBlob: !!blob
        });
        task.onComplete?.({
          blob,
          fileName,
          outputFormat,
          originalSize,
          compressedSize,
          compressionRatio,
        })
        tasksRef.current.delete(taskId)
        activeWorkersRef.current.delete(taskId)
        getCompressionWorkerPool().releaseWorker(workerId)
        break

      case "error":
        console.error(`[WorkerHook] Compression error for ${taskId}:`, error);
        task.onError?.(error)
        tasksRef.current.delete(taskId)
        activeWorkersRef.current.delete(taskId)
        getCompressionWorkerPool().releaseWorker(workerId)
        break

      case "cancelled":
        console.log(`[WorkerHook] Task cancelled for ${taskId}`);
        tasksRef.current.delete(taskId)
        activeWorkersRef.current.delete(taskId)
        getCompressionWorkerPool().releaseWorker(workerId)
        break
    }
  }, [])

  // New function to handle chunked upload messages
  const handleChunkedUploadMessage = useCallback((workerId: string, data: any) => {
    const { type, taskId, chunkIndex, progress, error } = data;
    const task = chunkedTasksRef.current.get(taskId);
    
    if (!task) {
      console.warn(`[WorkerHook] No chunked task found for taskId: ${taskId}`);
      return;
    }

    switch (type) {
      case "chunk_progress":
        // Update chunk progress
        if (!chunkProgressRef.current.has(taskId)) {
          chunkProgressRef.current.set(taskId, new Map());
        }
        chunkProgressRef.current.get(taskId)!.set(chunkIndex, progress);
        
        // Calculate overall progress
        const overallProgress = calculateOverallProgress(taskId);
        task.onProgress?.(overallProgress);
        break;

      case "chunk_complete":
        // Mark chunk as uploaded
        task.uploadedChunks.add(chunkIndex);
        task.failedChunks.delete(chunkIndex);
        task.onChunkComplete?.(chunkIndex, true);
        
        // Check if all chunks are complete
        if (task.uploadedChunks.size === task.totalChunks) {
          handleChunkedUploadComplete(taskId);
        }
        break;

      case "chunk_error":
        // Mark chunk as failed
        task.failedChunks.add(chunkIndex);
        task.onChunkComplete?.(chunkIndex, false);
        console.error(`[WorkerHook] Chunk ${chunkIndex} failed for task ${taskId}:`, error);
        break;
    }
  }, []);

  // Calculate overall progress for chunked upload
  const calculateOverallProgress = useCallback((taskId: string): number => {
    const task = chunkedTasksRef.current.get(taskId);
    if (!task) return 0;

    const chunkProgress = chunkProgressRef.current.get(taskId);
    if (!chunkProgress) return 0;

    let totalProgress = 0;
    for (let i = 0; i < task.totalChunks; i++) {
      totalProgress += chunkProgress.get(i) || 0;
    }

    return Math.round(totalProgress / task.totalChunks);
  }, []);

  // Handle completion of chunked upload
  const handleChunkedUploadComplete = useCallback((taskId: string) => {
    const task = chunkedTasksRef.current.get(taskId);
    if (!task) return;

    // Create a mock result for now - in real implementation, this would come from backend
    const result: CompressionResult = {
      blob: new Blob([], { type: 'application/octet-stream' }),
      fileName: task.file.name,
      outputFormat: task.file.type,
      originalSize: task.file.size,
      compressedSize: task.file.size, // Would be actual compressed size from backend
      compressionRatio: "100%", // Would be actual ratio from backend
    };

    task.onComplete?.(result);
    
    // Cleanup
    chunkedTasksRef.current.delete(taskId);
    chunkProgressRef.current.delete(taskId);
  }, []);

  const compressImage = useCallback(
    async (task: CompressionTask): Promise<void> => {
      try {
        const pooledWorker = await getCompressionWorkerPool().acquireWorker()

        // Store task and worker association
        tasksRef.current.set(task.id, task)
        activeWorkersRef.current.set(task.id, pooledWorker.id)

        const messageHandler = (e: MessageEvent) => {
          console.log(`[WorkerHook] Received message from worker:`, e.data);
          handleWorkerMessage(pooledWorker.id, e);
        }
        pooledWorker.worker.onmessage = messageHandler

        console.log(`[WorkerHook] Worker ${pooledWorker.id} assigned to task ${task.id}`);
        console.log(`[WorkerHook] Message handler set for worker ${pooledWorker.id}`);

        pooledWorker.worker.onerror = (error) => {
          console.error(`[WorkerHook] Worker ${pooledWorker.id} error:`, error)
          task.onError?.("Worker error occurred")
          tasksRef.current.delete(task.id)
          activeWorkersRef.current.delete(task.id)
          getCompressionWorkerPool().releaseWorker(pooledWorker.id)
        }

        // Send file directly to worker
        pooledWorker.worker.postMessage({
          type: "compress",
          id: task.id,
          file: task.file,
          settings: task.options || {},
          networkQuality: "medium", // Default network quality
          formatSupport: {
            webp: true,
            avif: false, // Most browsers don't support AVIF encoding
            jxl: false,  // Most browsers don't support JPEG XL encoding
          },
        })

      } catch (error) {
        task.onError?.("Failed to acquire compression worker")
      }
    },
    [handleWorkerMessage],
  )

  // New function for chunked uploads
  const uploadFileInChunks = useCallback(
    async (task: ChunkedUploadTask): Promise<void> => {
      try {
        const pooledWorker = await getCompressionWorkerPool().acquireWorker();
        
        // Store chunked task
        chunkedTasksRef.current.set(task.id, task);
        chunkProgressRef.current.set(task.id, new Map());

        const messageHandler = (e: MessageEvent) => {
          console.log(`[WorkerHook] Received chunked upload message:`, e.data);
          handleChunkedUploadMessage(pooledWorker.id, e);
        };
        pooledWorker.worker.onmessage = messageHandler;

        console.log(`[WorkerHook] Worker ${pooledWorker.id} assigned to chunked task ${task.id}`);

        // Process each chunk
        for (let chunkIndex = 0; chunkIndex < task.totalChunks; chunkIndex++) {
          if (task.uploadedChunks.has(chunkIndex)) {
            continue; // Skip already uploaded chunks
          }

          const start = chunkIndex * task.chunkSize;
          const end = Math.min(start + task.chunkSize, task.file.size);
          const chunkBlob = task.file.slice(start, end);

          // Create chunk data
          const chunkData: ChunkData = {
            taskId: task.id,
            chunkIndex,
            chunkData: chunkBlob,
            chunkSize: chunkBlob.size,
            totalChunks: task.totalChunks,
            fileName: task.file.name,
            fileSize: task.file.size,
            checksum: await generateChecksum(chunkBlob),
          };

          // Send chunk to worker
          pooledWorker.worker.postMessage({
            type: "upload_chunk",
            chunkData,
            settings: {
              chunkSize: task.chunkSize,
              enableResume: true,
              maxRetries: 3,
            },
          });

          // Small delay between chunks to prevent overwhelming the worker
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`[WorkerHook] Failed to start chunked upload for task ${task.id}:`, error);
        task.onError?.("Failed to start chunked upload");
      }
    },
    [handleChunkedUploadMessage],
  );

  // Resume chunked upload from where it left off
  const resumeChunkedUpload = useCallback(
    async (taskId: string, resumeData: { uploadedChunks: number[]; failedChunks: number[] }): Promise<void> => {
      const task = chunkedTasksRef.current.get(taskId);
      if (!task) {
        console.warn(`[WorkerHook] No chunked task found for taskId: ${taskId}`);
        return;
      }

      // Restore state from resume data
      task.uploadedChunks = new Set(resumeData.uploadedChunks);
      task.failedChunks = new Set(resumeData.failedChunks);

      console.log(`[WorkerHook] Resuming chunked upload for task ${taskId}:`, {
        uploadedChunks: Array.from(task.uploadedChunks),
        failedChunks: Array.from(task.failedChunks),
        remainingChunks: task.totalChunks - task.uploadedChunks.size,
      });

      // Continue with remaining chunks
      await uploadFileInChunks(task);
    },
    [uploadFileInChunks],
  );

  // Generate checksum for chunk validation
  const generateChecksum = async (blob: Blob): Promise<string> => {
    try {
      const buffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Failed to generate checksum:', error);
      return '';
    }
  };

  // Create chunked upload task
  const createChunkedUploadTask = useCallback(
    (file: File, chunkSize: number = 2 * 1024 * 1024): ChunkedUploadTask => {
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      return {
        id: `chunked-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        chunkSize,
        totalChunks,
        uploadedChunks: new Set(),
        failedChunks: new Set(),
      };
    },
    [],
  );

  const cancelTask = useCallback((taskId: string) => {
    const workerId = activeWorkersRef.current.get(taskId)
    if (workerId) {
      const workerPool = getCompressionWorkerPool()
      const stats = workerPool.getStats()

      // Find the worker and send cancel message
      try {
        // Note: We can't directly access the worker from the pool,
        // so we'll rely on the worker's internal cancel handling
        // The worker will respond with a 'cancelled' message which will trigger cleanup
      } catch (error) {
        console.warn("Failed to cancel task:", error)
      }

      // Clean up references
      tasksRef.current.delete(taskId)
      activeWorkersRef.current.delete(taskId)
      workerPool.releaseWorker(workerId)
    }

    // Also handle chunked task cancellation
    const chunkedTask = chunkedTasksRef.current.get(taskId);
    if (chunkedTask) {
      console.log(`[WorkerHook] Cancelling chunked upload task ${taskId}`);
      chunkedTasksRef.current.delete(taskId);
      chunkProgressRef.current.delete(taskId);
    }
  }, [])

  // Get pending task count
  const getPendingTaskCount = useCallback(() => {
    return tasksRef.current.size + chunkedTasksRef.current.size;
  }, [])

  const getWorkerStats = useCallback(() => {
    return getCompressionWorkerPool().getStats()
  }, [])

  useEffect(() => {
    return () => {
      // Cancel all active tasks
      tasksRef.current.forEach((task, taskId) => {
        const workerId = activeWorkersRef.current.get(taskId)
        if (workerId) {
          getCompressionWorkerPool().releaseWorker(workerId)
        }
      })

      tasksRef.current.clear()
      activeWorkersRef.current.clear()
      
      // Clean up chunked tasks
      chunkedTasksRef.current.clear()
      chunkProgressRef.current.clear()
    }
  }, [])

  return {
    compressImage,
    uploadFileInChunks,
    resumeChunkedUpload,
    createChunkedUploadTask,
    cancelTask,
    getPendingTaskCount,
    getWorkerStats,
    isWorkerSupported: typeof Worker !== "undefined",
  }
}
