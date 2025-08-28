/**
 * Message encryption utilities for end-to-end encrypted messaging
 */

import { cryptoManager, type EncryptionMetadata } from "./crypto-manager"

export interface EncryptedMessage {
  encryptedContent: string
  metadata: EncryptionMetadata
  messageType: "text" | "file" | "system"
  originalLength: number
}

export interface MessageEncryptionOptions {
  sessionId: string
  preserveFormatting?: boolean
  compressText?: boolean
}

export interface MessageDecryptionResult {
  content: string
  verified: boolean
  metadata: EncryptionMetadata
  messageType: "text" | "file" | "system"
}

class MessageEncryptionManager {
  private static instance: MessageEncryptionManager
  private encryptionWorker: Worker | null = null

  private constructor() {}

  static getInstance(): MessageEncryptionManager {
    if (!MessageEncryptionManager.instance) {
      MessageEncryptionManager.instance = new MessageEncryptionManager()
    }
    return MessageEncryptionManager.instance
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
   * Encrypt a text message
   */
  async encryptMessage(content: string, options: MessageEncryptionOptions): Promise<EncryptedMessage> {
    try {
      // Generate session key if not exists
      await cryptoManager.generateSessionKey(options.sessionId)

      // Prepare text data
      const textData = new TextEncoder().encode(content)

      // Use direct encryption instead of worker to avoid session key issues
      const encryptionResult = await cryptoManager.encryptData(textData.buffer as ArrayBuffer, options.sessionId)

      // Create metadata
      const metadata = cryptoManager.createMetadata(encryptionResult)

      // Convert encrypted data to base64 for transmission
      const encryptedContent = this.arrayBufferToBase64(encryptionResult.encryptedData)

      // Single comprehensive console with all encrypted data information
      console.log(`[v0] 🔐 Message Encrypted Successfully`, {
        sessionId: options.sessionId,
        originalMessage: content,
        originalLength: content.length,
        encryptedContent: encryptedContent,
        encryptedLength: encryptedContent.length,
        metadata: metadata,
        encryptionResult: {
          keyId: encryptionResult.keyId,
          iv: Array.from(encryptionResult.iv),
          authTag: Array.from(encryptionResult.authTag),
          encryptedDataSize: encryptionResult.encryptedData.byteLength
        }
      });

      return {
        encryptedContent,
        metadata,
        messageType: "text",
        originalLength: content.length,
      }
    } catch (error) {
      console.error("[v0] Message encryption failed:", error)
      throw new Error("Message encryption failed")
    }
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(encryptedMessage: EncryptedMessage, sessionId: string): Promise<MessageDecryptionResult> {
    try {
      // Parse metadata
      const { iv } = cryptoManager.parseMetadata(encryptedMessage.metadata)

      // Convert base64 back to ArrayBuffer
      const encryptedData = this.base64ToArrayBuffer(encryptedMessage.encryptedContent)

      // Decrypt message content
      const decryptionResult = await cryptoManager.decryptData(encryptedData, iv, sessionId)

      if (!decryptionResult.verified) {
        throw new Error("Message decryption verification failed")
      }

      // Convert decrypted data back to text
      const content = new TextDecoder().decode(decryptionResult.decryptedData)

      return {
        content,
        verified: decryptionResult.verified,
        metadata: encryptedMessage.metadata,
        messageType: encryptedMessage.messageType,
      }
    } catch (error) {
      console.error("[v0] Message decryption failed:", error)
      throw new Error("Message decryption failed")
    }
  }

  /**
   * Encrypt message using Web Worker for better performance
   */
  async encryptMessageWithWorker(content: string, options: MessageEncryptionOptions): Promise<EncryptedMessage> {
    return new Promise(async (resolve, reject) => {
      try {
        const worker = await this.getEncryptionWorker()

        // Generate session key
        await cryptoManager.generateSessionKey(options.sessionId)

        const messageId = `encrypt_msg_${Date.now()}_${Math.random()}`
        console.log(messageId, 'messageId')

        const messageHandler = (e: MessageEvent) => {
          const { id, result } = e.data
          console.log(id, 'id')
          console.log(result, 'result')

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
              console.log(result, '1')

              resolve({
                encryptedContent: this.arrayBufferToBase64(result.encryptedData),
                metadata,
                messageType: "text",
                originalLength: content.length,
              })
            } else {
              console.log(result, '2')
              reject(new Error(result.error))
            }
          }
        }

        worker.addEventListener("message", messageHandler)

        worker.postMessage({
          id: messageId,
          type: "encryptText",
          payload: {
            text: content,
            sessionId: options.sessionId,
          },
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Decrypt message using Web Worker
   */
  async decryptMessageWithWorker(
    encryptedMessage: EncryptedMessage,
    sessionId: string,
  ): Promise<MessageDecryptionResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const worker = await this.getEncryptionWorker()
        const { iv } = cryptoManager.parseMetadata(encryptedMessage.metadata)

        const messageId = `decrypt_msg_${Date.now()}_${Math.random()}`

        const messageHandler = (e: MessageEvent) => {
          const { id, result } = e.data

          if (id === messageId) {
            worker.removeEventListener("message", messageHandler)

            if (result.success && result.verified) {
              resolve({
                content: result.text,
                verified: result.verified,
                metadata: encryptedMessage.metadata,
                messageType: encryptedMessage.messageType,
              })
            } else {
              reject(new Error(result.error || "Message decryption verification failed"))
            }
          }
        }

        worker.addEventListener("message", messageHandler)

        const encryptedData = this.base64ToArrayBuffer(encryptedMessage.encryptedContent)

        worker.postMessage({
          id: messageId,
          type: "decryptText",
          payload: {
            encryptedData,
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
   * Batch encrypt multiple messages
   */
  async encryptMessageBatch(messages: string[], options: MessageEncryptionOptions): Promise<EncryptedMessage[]> {
    const results: EncryptedMessage[] = []

    for (const message of messages) {
      try {
        const encrypted = await this.encryptMessageWithWorker(message, options)
        results.push(encrypted)
      } catch (error) {
        console.error("[v0] Batch encryption failed for message:", error)
        // Continue with other messages
      }
    }

    return results
  }

  /**
   * Batch decrypt multiple messages
   */
  async decryptMessageBatch(
    encryptedMessages: EncryptedMessage[],
    sessionId: string,
  ): Promise<MessageDecryptionResult[]> {
    const results: MessageDecryptionResult[] = []

    for (const encryptedMessage of encryptedMessages) {
      try {
        const decrypted = await this.decryptMessageWithWorker(encryptedMessage, sessionId)
        results.push(decrypted)
      } catch (error) {
        console.error("[v0] Batch decryption failed for message:", error)
        // Continue with other messages
      }
    }

    return results
  }

  /**
   * Helper: Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Helper: Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Check session key status and log details
   */
  async checkSessionKeyStatus(sessionId: string): Promise<boolean> {
    try {
      // Try to access the session key
      await cryptoManager.generateSessionKey(sessionId);
      return true;
    } catch (error) {
      console.error(`[v0] Session key check failed for ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Validate encrypted message format
   */
  validateEncryptedMessage(encryptedMessage: any): encryptedMessage is EncryptedMessage {
    return (
      typeof encryptedMessage === "object" &&
      typeof encryptedMessage.encryptedContent === "string" &&
      typeof encryptedMessage.metadata === "object" &&
      typeof encryptedMessage.messageType === "string" &&
      typeof encryptedMessage.originalLength === "number"
    )
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

export const messageEncryptionManager = MessageEncryptionManager.getInstance()

// Export the checkSessionKeyStatus function directly for easy access
export const checkSessionKeyStatus = (sessionId: string) => 
  messageEncryptionManager.checkSessionKeyStatus(sessionId);
