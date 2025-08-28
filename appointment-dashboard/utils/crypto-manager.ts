/**
 * Enterprise-grade cryptographic utilities for end-to-end encryption
 * Supports AES-256-GCM for symmetric encryption and RSA-4096 for key exchange
 */

export interface EncryptionResult {
  encryptedData: ArrayBuffer
  iv: Uint8Array
  authTag: Uint8Array
  keyId: string
}

export interface DecryptionResult {
  decryptedData: ArrayBuffer
  verified: boolean
}

export interface KeyPair {
  publicKey: CryptoKey
  privateKey: CryptoKey
  keyId: string
  createdAt: number
}

export interface EncryptionMetadata {
  keyId: string
  algorithm: string
  iv: string
  authTag: string
  timestamp: number
  version: string
}

class CryptoManager {
  private static instance: CryptoManager
  private keyPairs: Map<string, KeyPair> = new Map()
  private sessionKeys: Map<string, CryptoKey> = new Map()
  private readonly ENCRYPTION_VERSION = "1.0"
  private readonly AES_KEY_LENGTH = 256
  private readonly RSA_KEY_LENGTH = 4096

  private constructor() {}

  static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager()
    }
    return CryptoManager.instance
  }

  /**
   * Generate RSA-4096 key pair for key exchange
   */
  async generateKeyPair(): Promise<KeyPair> {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: this.RSA_KEY_LENGTH,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
      )

      const keyId = await this.generateKeyId()
      const keyPairData: KeyPair = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        keyId,
        createdAt: Date.now(),
      }

      this.keyPairs.set(keyId, keyPairData)
      return keyPairData
    } catch (error) {
      console.error("[v0] Failed to generate key pair:", error)
      throw new Error("Key pair generation failed")
    }
  }

  /**
   * Generate AES-256 session key for symmetric encryption
   */
  async generateSessionKey(sessionId: string): Promise<CryptoKey> {
    try {
      console.log("[v0] 🔍 CryptoManager: Generating session key for:", sessionId);
      
      const key = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: this.AES_KEY_LENGTH,
        },
        true,
        ["encrypt", "decrypt"],
      )

      this.sessionKeys.set(sessionId, key)
      console.log("[v0] ✅ CryptoManager: Session key generated successfully for:", sessionId);
      console.log("[v0] 🔍 CryptoManager: Total session keys:", this.sessionKeys.size);
      
      return key
    } catch (error) {
      console.error("[v0] ❌ CryptoManager: Failed to generate session key for:", sessionId, error)
      throw new Error("Session key generation failed")
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encryptData(data: ArrayBuffer, sessionId: string, keyId?: string): Promise<EncryptionResult> {
    try {
      console.log("[v0] 🔍 CryptoManager: Starting encryption for session:", sessionId);
      console.log("[v0] 🔍 CryptoManager: Data size:", data.byteLength, "bytes");
      
      const key = this.sessionKeys.get(sessionId)
      if (!key) {
        console.error("[v0] ❌ CryptoManager: Session key not found for:", sessionId);
        console.error("[v0] 🔍 CryptoManager: Available session keys:", Array.from(this.sessionKeys.keys()));
        throw new Error("Session key not found")
      }
      
      console.log("[v0] ✅ CryptoManager: Session key found, proceeding with encryption");
      
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        data,
      )

      console.log("[v0] ✅ CryptoManager: Encryption completed successfully");
      console.log("[v0] 🔍 CryptoManager: Encrypted data size:", encryptedData.byteLength, "bytes");

      return {
        encryptedData,
        iv,
        authTag: new Uint8Array(encryptedData.slice(-16)),
        keyId: keyId || sessionId,
      }
    } catch (error) {
      console.error("[v0] ❌ CryptoManager: Encryption failed for session:", sessionId, error)
      throw new Error("Data encryption failed")
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decryptData(encryptedData: ArrayBuffer, iv: Uint8Array, sessionId: string): Promise<DecryptionResult> {
    try {
      const key = this.sessionKeys.get(sessionId)
      if (!key) {
        throw new Error("Session key not found")
      }

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        encryptedData,
      )

      return {
        decryptedData,
        verified: true,
      }
    } catch (error) {
      console.error("[v0] Decryption failed:", error)
      return {
        decryptedData: new ArrayBuffer(0),
        verified: false,
      }
    }
  }

  /**
   * Encrypt session key with RSA public key
   */
  async encryptSessionKey(sessionKey: CryptoKey, publicKey: CryptoKey): Promise<ArrayBuffer> {
    try {
      const keyData = await crypto.subtle.exportKey("raw", sessionKey)
      return await crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        publicKey,
        keyData,
      )
    } catch (error) {
      console.error("[v0] Session key encryption failed:", error)
      throw new Error("Session key encryption failed")
    }
  }

  /**
   * Decrypt session key with RSA private key
   */
  async decryptSessionKey(encryptedKey: ArrayBuffer, privateKey: CryptoKey): Promise<CryptoKey> {
    try {
      const keyData = await crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        privateKey,
        encryptedKey,
      )

      return await crypto.subtle.importKey(
        "raw",
        keyData,
        {
          name: "AES-GCM",
        },
        true,
        ["encrypt", "decrypt"],
      )
    } catch (error) {
      console.error("[v0] Session key decryption failed:", error)
      throw new Error("Session key decryption failed")
    }
  }

  /**
   * Export public key for sharing
   */
  async exportPublicKey(keyId: string): Promise<ArrayBuffer> {
    const keyPair = this.keyPairs.get(keyId)
    if (!keyPair) {
      throw new Error("Key pair not found")
    }

    return await crypto.subtle.exportKey("spki", keyPair.publicKey)
  }

  /**
   * Import public key from remote party
   */
  async importPublicKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      "spki",
      keyData,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    )
  }

  /**
   * Generate unique key identifier
   */
  private async generateKeyId(): Promise<string> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16))
    const hashBuffer = await crypto.subtle.digest("SHA-256", randomBytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16)
  }

  /**
   * Create encryption metadata
   */
  createMetadata(result: EncryptionResult): EncryptionMetadata {
    return {
      keyId: result.keyId,
      algorithm: "AES-256-GCM",
      iv: Array.from(result.iv)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      authTag: Array.from(result.authTag)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      timestamp: Date.now(),
      version: this.ENCRYPTION_VERSION,
    }
  }

  /**
   * Parse encryption metadata
   */
  parseMetadata(metadata: EncryptionMetadata): { iv: Uint8Array; authTag: Uint8Array } {
    const iv = new Uint8Array(metadata.iv.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [])
    const authTag = new Uint8Array(metadata.authTag.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [])

    return { iv, authTag }
  }

  /**
   * Clean up expired keys and sessions
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    for (const [keyId, keyPair] of this.keyPairs.entries()) {
      if (now - keyPair.createdAt > maxAge) {
        this.keyPairs.delete(keyId)
      }
    }
  }

  /**
   * Get encryption statistics
   */
  getStats(): { keyPairs: number; sessionKeys: number } {
    return {
      keyPairs: this.keyPairs.size,
      sessionKeys: this.sessionKeys.size,
    }
  }
}

export const cryptoManager = CryptoManager.getInstance()
