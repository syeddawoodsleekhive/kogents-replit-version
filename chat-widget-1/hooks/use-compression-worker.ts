"use client"

import { getCompressionWorkerPool } from "@/utils/worker-pool"
import { useRef, useCallback, useEffect } from "react"
import { useFileEncryption } from "./use-file-encryption"

// Chunk upload constants
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks to match backend
const MAX_CHUNK_RETRIES = 3;
const CHUNK_UPLOAD_DELAY = 100; // 100ms between chunks
const CHUNK_PROGRESS_UPDATE_INTERVAL = 100; // Update progress every 100ms

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
  encryptionTaskId?: string
  isEncrypted?: boolean
}

// Chunk upload interfaces
export interface ChunkUploadTask {
  id: string
  file: File
  chunks: Blob[]
  totalChunks: number
  uploadedChunks: number
  currentChunk: number
  status: "pending" | "uploading" | "paused" | "completed" | "error" | "cancelled"
  progress: number
  error?: string
  retryCount: number
  uploadStartTime?: number
  estimatedTimeRemaining?: number
  onProgress?: (progress: number) => void
  onComplete?: (result: ChunkUploadResult) => void
  onError?: (error: string) => void
}

export interface ChunkUploadResult {
  fileId: string
  fileName: string
  totalChunks: number
  uploadedChunks: number
  timestamp: string
  uploadDuration: number
}

export interface ChunkUploadProgress {
  fileId: string
  chunkIndex: number
  progress: number
  uploadedChunks: number
  totalChunks: number
  estimatedTimeRemaining?: number
}

export function useCompressionWorker(sessionId?: string) {
  const tasksRef = useRef<Map<string, CompressionTask>>(new Map())
  const activeWorkersRef = useRef<Map<string, string>>(new Map()) // taskId -> workerId
  const { encryptFile, isEncryptionEnabled } = useFileEncryption(sessionId || "default")
  
  // Chunk upload state
  const chunkUploadsRef = useRef<Map<string, ChunkUploadTask>>(new Map())
  const activeChunkUploadsRef = useRef<Set<string>>(new Set())
  const uploadQueueRef = useRef<string[]>([])

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
    } = e.data

    console.log(`[WorkerHook] Processing message:`, { type, taskId, workerId, hasBlob: !!blob });

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
        task.onComplete?.({
          blob: new Blob(),
          fileName: task.file.name,
          outputFormat: task.file.type,
          originalSize: task.file.size,
          compressedSize: task.file.size,
          compressionRatio: "1:1",
        })
        tasksRef.current.delete(taskId)
        activeWorkersRef.current.delete(taskId)
        getCompressionWorkerPool().releaseWorker(workerId)
        break
    }
  }, [])

  // Chunk upload utility functions
  const createFileChunks = useCallback((file: File): Blob[] => {
    const chunks: Blob[] = [];
    let start = 0;
    
    while (start < file.size) {
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunks.push(file.slice(start, end));
      start = end;
    }
    
    return chunks;
  }, []);

  const calculateUploadProgress = useCallback((uploadTask: ChunkUploadTask): number => {
    if (uploadTask.totalChunks === 0) return 0;
    return Math.round((uploadTask.uploadedChunks / uploadTask.totalChunks) * 100);
  }, []);

  const estimateTimeRemaining = useCallback((uploadTask: ChunkUploadTask): number | undefined => {
    if (!uploadTask.uploadStartTime || uploadTask.uploadedChunks === 0) return undefined;
    
    const elapsed = Date.now() - uploadTask.uploadStartTime;
    const rate = uploadTask.uploadedChunks / elapsed;
    const remaining = uploadTask.totalChunks - uploadTask.uploadedChunks;
    
    return Math.round(remaining / rate);
  }, []);

  const updateChunkUploadProgress = useCallback((fileId: string, updates: Partial<ChunkUploadTask>) => {
    const current = chunkUploadsRef.current.get(fileId);
    if (!current) return;
    
    const updated = { ...current, ...updates };
    if (updates.uploadedChunks !== undefined) {
      updated.progress = calculateUploadProgress(updated);
    }
    if (updates.progress !== undefined) {
      updated.estimatedTimeRemaining = estimateTimeRemaining(updated);
    }
    
    chunkUploadsRef.current.set(fileId, updated);
    
    // Notify progress callback
    updated.onProgress?.(updated.progress);
  }, [calculateUploadProgress, estimateTimeRemaining]);

  // Initialize chunk upload
  const initializeChunkUpload = useCallback((file: File, callbacks?: {
    onProgress?: (progress: number) => void
    onComplete?: (result: ChunkUploadResult) => void
    onError?: (error: string) => void
  }): string => {
    const fileId = `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chunks = createFileChunks(file);
    
    const uploadTask: ChunkUploadTask = {
      id: fileId,
      file,
      chunks,
      totalChunks: chunks.length,
      uploadedChunks: 0,
      currentChunk: 0,
      status: "pending",
      progress: 0,
      retryCount: 0,
      uploadStartTime: Date.now(),
      onProgress: callbacks?.onProgress,
      onComplete: callbacks?.onComplete,
      onError: callbacks?.onError,
    };
    
    chunkUploadsRef.current.set(fileId, uploadTask);
    uploadQueueRef.current.push(fileId);
    
    return fileId;
  }, [createFileChunks]);

  // Upload individual chunk
  const uploadChunk = useCallback(async (fileId: string, chunkIndex: number): Promise<boolean> => {
    const uploadTask = chunkUploadsRef.current.get(fileId);
    if (!uploadTask) return false;
    
    const chunk = uploadTask.chunks[chunkIndex];
    if (!chunk) return false;
    
    try {
      // Simulate chunk upload (replace with actual upload logic)
      await new Promise<void>((resolve, reject) => {
        const uploadTime = Math.random() * 1000 + 200; // 200-1200ms
        
        setTimeout(() => {
          // Simulate occasional failures for testing
          if (Math.random() < 0.05) { // 5% failure rate
            reject(new Error("Network error"));
          } else {
            resolve();
          }
        }, uploadTime);
      });
      
      // Mark chunk as completed
      const newUploadedChunks = uploadTask.uploadedChunks + 1;
      updateChunkUploadProgress(fileId, { 
        uploadedChunks: newUploadedChunks,
        currentChunk: chunkIndex + 1
      });
      
      // Check if all chunks are uploaded
      if (newUploadedChunks === uploadTask.totalChunks) {
        await completeChunkUpload(fileId);
      }
      
      return true;
    } catch (error) {
      console.error(`Chunk ${chunkIndex} upload failed:`, error);
      return false;
    }
  }, [updateChunkUploadProgress]);

  // Complete chunk upload
  const completeChunkUpload = useCallback(async (fileId: string) => {
    const uploadTask = chunkUploadsRef.current.get(fileId);
    if (!uploadTask) return;
    
    updateChunkUploadProgress(fileId, { 
      status: "completed",
      progress: 100 
    });
    
    // Remove from active uploads
    activeChunkUploadsRef.current.delete(fileId);
    
    // Remove from queue
    uploadQueueRef.current = uploadQueueRef.current.filter(id => id !== fileId);
    
    // Calculate upload duration
    const uploadDuration = uploadTask.uploadStartTime ? Date.now() - uploadTask.uploadStartTime : 0;
    
    // Notify completion
    uploadTask.onComplete?.({
      fileId,
      fileName: uploadTask.file.name,
      totalChunks: uploadTask.totalChunks,
      uploadedChunks: uploadTask.uploadedChunks,
      timestamp: new Date().toISOString(),
      uploadDuration,
    });
    
    // Clean up
    chunkUploadsRef.current.delete(fileId);
    
    // Process next upload in queue
    processUploadQueue();
  }, [updateChunkUploadProgress]);

  // Process upload queue
  const processUploadQueue = useCallback(async () => {
    if (uploadQueueRef.current.length === 0 || activeChunkUploadsRef.current.size >= 3) return;
    
    const fileId = uploadQueueRef.current.shift();
    if (!fileId) return;
    
    const uploadTask = chunkUploadsRef.current.get(fileId);
    if (!uploadTask || uploadTask.status !== "pending") return;
    
    // Start uploading this file
    activeChunkUploadsRef.current.add(fileId);
    updateChunkUploadProgress(fileId, { status: "uploading" });
    
    // Upload chunks sequentially
    for (let i = 0; i < uploadTask.chunks.length; i++) {
      const currentStatus = chunkUploadsRef.current.get(fileId)?.status;
      if (currentStatus === "paused" || currentStatus === "cancelled") {
        break;
      }
      
      const success = await uploadChunk(fileId, i);
      if (!success) {
        // Chunk failed, will be retried later
        break;
      }
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, CHUNK_UPLOAD_DELAY));
    }
  }, [uploadChunk, updateChunkUploadProgress]);

  // Start chunk upload
  const startChunkUpload = useCallback((fileId: string) => {
    const uploadTask = chunkUploadsRef.current.get(fileId);
    if (!uploadTask || uploadTask.status !== "pending") return;
    
    updateChunkUploadProgress(fileId, { status: "uploading" });
    processUploadQueue();
  }, [processUploadQueue, updateChunkUploadProgress]);

  // Pause chunk upload
  const pauseChunkUpload = useCallback((fileId: string) => {
    updateChunkUploadProgress(fileId, { status: "paused" });
    activeChunkUploadsRef.current.delete(fileId);
  }, [updateChunkUploadProgress]);

  // Resume chunk upload
  const resumeChunkUpload = useCallback((fileId: string) => {
    const uploadTask = chunkUploadsRef.current.get(fileId);
    if (!uploadTask || uploadTask.status !== "paused") return;
    
    updateChunkUploadProgress(fileId, { status: "uploading" });
    uploadQueueRef.current.unshift(fileId); // Add back to front of queue
    processUploadQueue();
  }, [processUploadQueue, updateChunkUploadProgress]);

  // Cancel chunk upload
  const cancelChunkUpload = useCallback((fileId: string) => {
    updateChunkUploadProgress(fileId, { status: "cancelled" });
    activeChunkUploadsRef.current.delete(fileId);
    uploadQueueRef.current = uploadQueueRef.current.filter(id => id !== fileId);
    
    // Clean up
    chunkUploadsRef.current.delete(fileId);
  }, [updateChunkUploadProgress]);

  // Retry chunk upload
  const retryChunkUpload = useCallback(async (fileId: string, chunkIndex: number) => {
    const uploadTask = chunkUploadsRef.current.get(fileId);
    if (!uploadTask) return;
    
    if (uploadTask.retryCount >= MAX_CHUNK_RETRIES) {
      updateChunkUploadProgress(fileId, { 
        status: "error", 
        error: `Chunk ${chunkIndex} failed after ${MAX_CHUNK_RETRIES} retries` 
      });
      return;
    }
    
    updateChunkUploadProgress(fileId, { 
      retryCount: uploadTask.retryCount + 1 
    });
    
    // Retry the chunk
    await uploadChunk(fileId, chunkIndex);
  }, [uploadChunk, updateChunkUploadProgress]);

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

        // Convert file to data URL for encryption support
        const reader = new FileReader()
        reader.onload = (e) => {
          const fileData = e.target?.result as string

          pooledWorker.worker.postMessage({
            type: "compress",
            id: task.id,
            fileData,
            fileName: task.file.name,
            fileType: task.file.type,
            settings: task.options || {},
            networkQuality: "medium", // Default network quality
            formatSupport: {
              webp: true,
              avif: false, // Most browsers don't support AVIF encoding
              jxl: false,  // Most browsers don't support JPEG XL encoding
            },
            enableEncryption: isEncryptionEnabled && sessionId,
            sessionId: sessionId,
          })
        }

        reader.onerror = () => {
          task.onError?.("Failed to read file")
          tasksRef.current.delete(task.id)
          activeWorkersRef.current.delete(task.id)
          getCompressionWorkerPool().releaseWorker(pooledWorker.id)
        }

        reader.readAsDataURL(task.file)

      } catch (error) {
        task.onError?.("Failed to acquire compression worker")
      }
    },
    [handleWorkerMessage, isEncryptionEnabled, sessionId],
  )

  const compressAndEncryptImage = useCallback(
    async (task: CompressionTask): Promise<void> => {
      if (!isEncryptionEnabled || !sessionId) {
        return compressImage(task)
      }

      try {
        // First compress the image
        await new Promise<void>((resolve, reject) => {
          const encryptionTask: CompressionTask = {
            ...task,
            onComplete: async (result) => {
              try {
                // Convert blob to file for encryption
                const compressedFile = new File([result.blob], result.fileName, {
                  type: result.outputFormat,
                  lastModified: Date.now(),
                })

                // Encrypt the compressed file
                const encryptionTaskId = await encryptFile(compressedFile)

                // Call original completion handler with encryption info
                task.onComplete?.({
                  ...result,
                  encryptionTaskId,
                  isEncrypted: true,
                } as any)

                resolve()
              } catch (error) {
                reject(error)
              }
            },
            onError: reject,
          }

          compressImage(encryptionTask)
        })
      } catch (error) {
        task.onError?.("Compression and encryption failed")
      }
    },
    [compressImage, encryptFile, isEncryptionEnabled, sessionId],
  )

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
  }, [])

  // Get pending task count
  const getPendingTaskCount = useCallback(() => {
    return tasksRef.current.size
  }, [])

  const getWorkerStats = useCallback(() => {
    return getCompressionWorkerPool().getStats()
  }, [])

  // Get chunk upload stats
  const getChunkUploadStats = useCallback(() => {
    const total = chunkUploadsRef.current.size;
    const active = activeChunkUploadsRef.current.size;
    const queued = uploadQueueRef.current.length;
    const completed = Array.from(chunkUploadsRef.current.values()).filter(u => u.status === "completed").length;
    const failed = Array.from(chunkUploadsRef.current.values()).filter(u => u.status === "error").length;
    
    return {
      total,
      active,
      queued,
      completed,
      failed,
      chunkSize: CHUNK_SIZE,
      maxRetries: MAX_CHUNK_RETRIES,
    };
  }, []);

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
      
      // Cancel all chunk uploads
      chunkUploadsRef.current.clear()
      activeChunkUploadsRef.current.clear()
      uploadQueueRef.current = []
    }
  }, [])

  return {
    compressImage,
    compressAndEncryptImage,
    cancelTask,
    getPendingTaskCount,
    getWorkerStats,
    isWorkerSupported: typeof Worker !== "undefined",
    isEncryptionEnabled,
    
    // Chunk upload methods
    initializeChunkUpload,
    startChunkUpload,
    pauseChunkUpload,
    resumeChunkUpload,
    cancelChunkUpload,
    retryChunkUpload,
    getChunkUploadStats,
    
    // Constants
    CHUNK_SIZE,
    MAX_CHUNK_RETRIES,
  }
}
