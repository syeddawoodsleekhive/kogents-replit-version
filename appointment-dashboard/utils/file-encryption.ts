/**
 * File encryption utilities for end-to-end encrypted file sharing
 */

import { cryptoManager, type EncryptionMetadata } from "./crypto-manager"

export interface EncryptedFile {
  encryptedData: ArrayBuffer
  metadata: EncryptionMetadata
  originalFileName: string
  originalSize: number
  mimeType: string
  thumbnail?: ArrayBuffer
}

export interface FileEncryptionOptions {
  sessionId: string
  generateThumbnail?: boolean
  thumbnailSize?: number
  preserveMetadata?: boolean
}

export interface FileDecryptionResult {
  file: File
  verified: boolean
  metadata: EncryptionMetadata
}

class FileEncryptionManager {
  private static instance: FileEncryptionManager
  private encryptionWorker: Worker | null = null

  private constructor() {}

  static getInstance(): FileEncryptionManager {
    if (!FileEncryptionManager.instance) {
      FileEncryptionManager.instance = new FileEncryptionManager()
    }
    return FileEncryptionManager.instance
  }

  /**
   * Initialize encryption worker
   */
  private async getEncryptionWorker(): Promise<Worker> {
    if (!this.encryptionWorker) {
      this.encryptionWorker = new Worker("/encryption-worker.js")
    }
    return this.encryptionWorker
  }

  /**
   * Generate session key for encryption
   */
  async generateSessionKey(sessionId: string): Promise<void> {
    try {
      await cryptoManager.generateSessionKey(sessionId)
    } catch (error) {
      console.error("[v0] Failed to generate session key:", error)
      throw new Error("Session key generation failed")
    }
  }

  /**
   * Encrypt a file with end-to-end encryption
   */
  async encryptFile(file: File, options: FileEncryptionOptions): Promise<EncryptedFile> {
    try {
      // Generate session key if not exists
      await cryptoManager.generateSessionKey(options.sessionId)

      // Read file data
      const fileData = await this.fileToArrayBuffer(file)

      // Encrypt file data
      const encryptionResult = await cryptoManager.encryptData(fileData, options.sessionId)

      // Create metadata
      const metadata = cryptoManager.createMetadata(encryptionResult)

      // Generate thumbnail if requested
      let thumbnail: ArrayBuffer | undefined
      if (options.generateThumbnail && this.isImageFile(file)) {
        thumbnail = await this.generateEncryptedThumbnail(file, options)
      }

      // Enhanced console output matching the user's image format
      const fileCategory = this.getFileCategory(file);
      const securityInfo = this.getSecurityInfo(file, fileData.byteLength);
      
      console.log(`[v0] File Encrypted Successfully (For Future Use)`, {
        sessionId: options.sessionId,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          extension: file.name.split('.').pop() || '',
          lastModified: file.lastModified
        },
        encryptionDetails: {
          compressionRatio: this.calculateCompressionRatio(fileData.byteLength, encryptionResult.encryptedData.byteLength),
          encryptedContentLength: encryptionResult.encryptedData.byteLength,
          encryptionResult: {
            algorithm: "AES-256-GCM",
            authTag: Array.from(encryptionResult.authTag).map(b => b.toString(16).padStart(2, "0")).join(""),
            iv: Array.from(encryptionResult.iv).map(b => b.toString(16).padStart(2, "0")).join(""),
            keyId: encryptionResult.keyId,
            timestamp: Date.now(),
            version: "1.0"
          },
          metadata: metadata,
          originalContentLength: fileData.byteLength
        },
        fileCategory: fileCategory,
        securityInfo: securityInfo
      });

      return {
        encryptedData: encryptionResult.encryptedData,
        metadata,
        originalFileName: file.name,
        originalSize: file.size,
        mimeType: file.type,
        thumbnail,
      }
    } catch (error) {
      console.error("[v0] File encryption failed:", error)
      throw new Error("File encryption failed")
    }
  }

  /**
   * Decrypt an encrypted file
   */
  async decryptFile(encryptedFile: EncryptedFile, sessionId: string): Promise<FileDecryptionResult> {
    try {
      // Parse metadata
      const { iv } = cryptoManager.parseMetadata(encryptedFile.metadata)

      // Decrypt file data
      const decryptionResult = await cryptoManager.decryptData(encryptedFile.encryptedData, iv, sessionId)

      if (!decryptionResult.verified) {
        throw new Error("File decryption verification failed")
      }

      // Create file from decrypted data
      const blob = new Blob([decryptionResult.decryptedData], { type: encryptedFile.mimeType })
      const file = new File([blob], encryptedFile.originalFileName, {
        type: encryptedFile.mimeType,
        lastModified: encryptedFile.metadata.timestamp,
      })

      return {
        file,
        verified: decryptionResult.verified,
        metadata: encryptedFile.metadata,
      }
    } catch (error) {
      console.error("[v0] File decryption failed:", error)
      throw new Error("File decryption failed")
    }
  }

  /**
   * Encrypt file using Web Worker for better performance
   */
  async encryptFileWithWorker(file: File, options: FileEncryptionOptions): Promise<EncryptedFile> {
    return new Promise(async (resolve, reject) => {
      try {
        const worker = await this.getEncryptionWorker()
        const fileData = await this.fileToArrayBuffer(file)

        // Generate session key
        await cryptoManager.generateSessionKey(options.sessionId)

        const messageId = `encrypt_${Date.now()}_${Math.random()}`

        const messageHandler = (e: MessageEvent) => {
          const { id, result } = e.data

          if (id === messageId) {
            worker.removeEventListener("message", messageHandler)

            if (result.success) {
              const metadata: EncryptionMetadata = {
                keyId: result.keyId,
                algorithm: "AES-256-GCM",
                iv: result.iv.map((b: number) => b.toString(16).padStart(2, "0")).join(""),
                authTag: result.authTag.map((b: number) => b.toString(16).padStart(2, "0")).join(""),
                timestamp: Date.now(),
                version: "1.0",
              }

              resolve({
                encryptedData: result.encryptedData,
                metadata,
                originalFileName: file.name,
                originalSize: file.size,
                mimeType: file.type,
              })
            } else {
              reject(new Error(result.error))
            }
          }
        }

        worker.addEventListener("message", messageHandler)

        worker.postMessage({
          id: messageId,
          type: "encryptData",
          payload: {
            data: fileData,
            sessionId: options.sessionId,
          },
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Decrypt file using Web Worker
   */
  async decryptFileWithWorker(encryptedFile: EncryptedFile, sessionId: string): Promise<FileDecryptionResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const worker = await this.getEncryptionWorker()
        const { iv } = cryptoManager.parseMetadata(encryptedFile.metadata)

        const messageId = `decrypt_${Date.now()}_${Math.random()}`

        const messageHandler = (e: MessageEvent) => {
          const { id, result } = e.data

          if (id === messageId) {
            worker.removeEventListener("message", messageHandler)

            if (result.success && result.verified) {
              const blob = new Blob([result.decryptedData], { type: encryptedFile.mimeType })
              const file = new File([blob], encryptedFile.originalFileName, {
                type: encryptedFile.mimeType,
                lastModified: encryptedFile.metadata.timestamp,
              })

              resolve({
                file,
                verified: result.verified,
                metadata: encryptedFile.metadata,
              })
            } else {
              reject(new Error(result.error || "Decryption verification failed"))
            }
          }
        }

        worker.addEventListener("message", messageHandler)

        worker.postMessage({
          id: messageId,
          type: "decryptData",
          payload: {
            encryptedData: encryptedFile.encryptedData,
            iv: Array.from(iv),
            sessionId,
          },
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Generate encrypted thumbnail for images
   */
  private async generateEncryptedThumbnail(
    file: File,
    options: FileEncryptionOptions,
  ): Promise<ArrayBuffer | undefined> {
    try {
      const thumbnailSize = options.thumbnailSize || 150
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) return undefined

      // Load image
      const img = await this.loadImage(file)

      // Calculate thumbnail dimensions
      const { width, height } = this.calculateThumbnailDimensions(img.width, img.height, thumbnailSize)

      canvas.width = width
      canvas.height = height

      // Draw thumbnail
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      const thumbnailBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8)
      })

      // Convert to ArrayBuffer and encrypt
      const thumbnailData = await this.blobToArrayBuffer(thumbnailBlob)
      const encryptionResult = await cryptoManager.encryptData(thumbnailData, options.sessionId)

      return encryptionResult.encryptedData
    } catch (error) {
      console.warn("[v0] Thumbnail generation failed:", error)
      return undefined
    }
  }

  /**
   * Helper: Convert file to ArrayBuffer
   */
  private fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Helper: Convert blob to ArrayBuffer
   */
  private blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error("Failed to read blob"))
      reader.readAsArrayBuffer(blob)
    })
  }

  /**
   * Helper: Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("Failed to load image"))
      }

      img.src = url
    })
  }

  /**
   * Helper: Calculate thumbnail dimensions
   */
  private calculateThumbnailDimensions(
    originalWidth: number,
    originalHeight: number,
    maxSize: number,
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight

    if (originalWidth > originalHeight) {
      return {
        width: Math.min(maxSize, originalWidth),
        height: Math.min(maxSize, originalWidth) / aspectRatio,
      }
    } else {
      return {
        width: Math.min(maxSize, originalHeight) * aspectRatio,
        height: Math.min(maxSize, originalHeight),
      }
    }
  }

  /**
   * Helper: Check if file is an image
   */
  private isImageFile(file: File): boolean {
    return file.type.startsWith("image/")
  }

  /**
   * Helper: Get file category
   */
  private getFileCategory(file: File): string {
    if (file.type.startsWith("image/")) {
      return "Image";
    } else if (file.type.startsWith("video/")) {
      return "Video";
    } else if (file.type.startsWith("audio/")) {
      return "Audio";
    } else if (file.type.includes("pdf") || file.type.includes("doc") || file.type.includes("txt")) {
      return "Document";
    }
    return "File";
  }

  /**
   * Helper: Get security info
   */
  private getSecurityInfo(file: File, originalSize: number): {
    estimatedEncryptionTime: string;
    isAudio: boolean;
    isDocument: boolean;
    isImage: boolean;
    isVideo: boolean;
  } {
    return {
      estimatedEncryptionTime: "5ms",
      isAudio: file.type.startsWith("audio/"),
      isDocument: file.type.includes("pdf") || file.type.includes("doc") || file.type.includes("txt"),
      isImage: file.type.startsWith("image/"),
      isVideo: file.type.startsWith("video/"),
    };
  }

  /**
   * Helper: Calculate compression ratio
   */
  private calculateCompressionRatio(originalSize: number, encryptedSize: number): string {
    if (originalSize === 0) return "0%";
    const ratio = ((encryptedSize - originalSize) / originalSize) * 100;
    return `${ratio > 0 ? "+" : ""}${ratio.toFixed(2)}%`;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.encryptionWorker) {
      this.encryptionWorker.terminate()
      this.encryptionWorker = null
    }
  }
}

export const fileEncryptionManager = FileEncryptionManager.getInstance()
