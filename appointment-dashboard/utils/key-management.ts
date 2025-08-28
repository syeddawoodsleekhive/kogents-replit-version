/**
 * Client-side key management with secure storage and rotation
 */

import { cryptoManager, type KeyPair } from "./crypto-manager"

export interface StoredKeyPair {
  keyId: string
  publicKey: string
  encryptedPrivateKey: string
  createdAt: number
  expiresAt: number
}

export interface KeyRotationPolicy {
  rotationInterval: number // milliseconds
  maxKeyAge: number // milliseconds
  autoRotate: boolean
}

class KeyManager {
  private static instance: KeyManager
  private currentKeyPair: KeyPair | null = null
  private rotationPolicy: KeyRotationPolicy = {
    rotationInterval: 24 * 60 * 60 * 1000, // 24 hours
    maxKeyAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    autoRotate: true,
  }
  private rotationTimer: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager()
    }
    return KeyManager.instance
  }

  /**
   * Initialize key management for a session
   */
  async initialize(sessionId: string, userConsent = true): Promise<KeyPair> {
    try {
      // Check for existing key pair
      const storedKeyPair = await this.loadStoredKeyPair(sessionId)

      if (storedKeyPair && !this.isKeyExpired(storedKeyPair)) {
        this.currentKeyPair = await this.restoreKeyPair(storedKeyPair)
      } else {
        // Generate new key pair
        this.currentKeyPair = await cryptoManager.generateKeyPair()

        if (userConsent) {
          await this.storeKeyPair(sessionId, this.currentKeyPair)
        }
      }

      // Start key rotation if enabled
      if (this.rotationPolicy.autoRotate) {
        this.startKeyRotation(sessionId)
      }

      return this.currentKeyPair
    } catch (error) {
      console.error("[v0] Key management initialization failed:", error)
      throw new Error("Key management initialization failed")
    }
  }

  /**
   * Get current key pair
   */
  getCurrentKeyPair(): KeyPair | null {
    return this.currentKeyPair
  }

  /**
   * Rotate keys manually
   */
  async rotateKeys(sessionId: string): Promise<KeyPair> {
    try {
      // Generate new key pair
      const newKeyPair = await cryptoManager.generateKeyPair()

      // Store old key pair for decryption of existing messages
      if (this.currentKeyPair) {
        await this.archiveKeyPair(sessionId, this.currentKeyPair)
      }

      // Update current key pair
      this.currentKeyPair = newKeyPair
      await this.storeKeyPair(sessionId, newKeyPair)

      console.log("[v0] Keys rotated successfully")
      return newKeyPair
    } catch (error) {
      console.error("[v0] Key rotation failed:", error)
      throw new Error("Key rotation failed")
    }
  }

  /**
   * Store key pair securely in localStorage
   */
  private async storeKeyPair(sessionId: string, keyPair: KeyPair): Promise<void> {
    try {
      const publicKeyData = await cryptoManager.exportPublicKey(keyPair.keyId)
      const publicKeyString = Array.from(new Uint8Array(publicKeyData))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")

      // For demo purposes, we'll store the private key reference
      // In production, this would be encrypted with a user-derived key
      const storedKeyPair: StoredKeyPair = {
        keyId: keyPair.keyId,
        publicKey: publicKeyString,
        encryptedPrivateKey: keyPair.keyId, // Reference to key in memory
        createdAt: keyPair.createdAt,
        expiresAt: keyPair.createdAt + this.rotationPolicy.maxKeyAge,
      }

      localStorage.setItem(`chat_keypair_${sessionId}`, JSON.stringify(storedKeyPair))
    } catch (error) {
      console.error("[v0] Failed to store key pair:", error)
    }
  }

  /**
   * Load stored key pair from localStorage
   */
  private async loadStoredKeyPair(sessionId: string): Promise<StoredKeyPair | null> {
    try {
      const stored = localStorage.getItem(`chat_keypair_${sessionId}`)
      if (!stored) return null

      return JSON.parse(stored) as StoredKeyPair
    } catch (error) {
      console.error("[v0] Failed to load stored key pair:", error)
      return null
    }
  }

  /**
   * Restore key pair from stored data
   */
  private async restoreKeyPair(storedKeyPair: StoredKeyPair): Promise<KeyPair> {
    // In a real implementation, this would decrypt the private key
    // For demo purposes, we'll generate a new key pair
    return await cryptoManager.generateKeyPair()
  }

  /**
   * Check if key is expired
   */
  private isKeyExpired(storedKeyPair: StoredKeyPair): boolean {
    return Date.now() > storedKeyPair.expiresAt
  }

  /**
   * Archive old key pair for message decryption
   */
  private async archiveKeyPair(sessionId: string, keyPair: KeyPair): Promise<void> {
    const archiveKey = `chat_keypair_archive_${sessionId}_${keyPair.keyId}`
    const publicKeyData = await cryptoManager.exportPublicKey(keyPair.keyId)

    const archivedKeyPair: StoredKeyPair = {
      keyId: keyPair.keyId,
      publicKey: Array.from(new Uint8Array(publicKeyData))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      encryptedPrivateKey: keyPair.keyId,
      createdAt: keyPair.createdAt,
      expiresAt: keyPair.createdAt + this.rotationPolicy.maxKeyAge,
    }

    localStorage.setItem(archiveKey, JSON.stringify(archivedKeyPair))
  }

  /**
   * Start automatic key rotation
   */
  private startKeyRotation(sessionId: string): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer)
    }

    this.rotationTimer = setInterval(async () => {
      try {
        await this.rotateKeys(sessionId)
      } catch (error) {
        console.error("[v0] Automatic key rotation failed:", error)
      }
    }, this.rotationPolicy.rotationInterval)
  }

  /**
   * Stop key rotation
   */
  stopKeyRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer)
      this.rotationTimer = null
    }
  }

  /**
   * Clean up expired keys
   */
  async cleanup(sessionId: string): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(
        (key) => key.startsWith(`chat_keypair_${sessionId}`) || key.startsWith(`chat_keypair_archive_${sessionId}`),
      )

      for (const key of keys) {
        const stored = localStorage.getItem(key)
        if (stored) {
          const keyPair = JSON.parse(stored) as StoredKeyPair
          if (this.isKeyExpired(keyPair)) {
            localStorage.removeItem(key)
          }
        }
      }

      this.stopKeyRotation()
      cryptoManager.cleanup()
    } catch (error) {
      console.error("[v0] Key cleanup failed:", error)
    }
  }

  /**
   * Update rotation policy
   */
  updateRotationPolicy(policy: Partial<KeyRotationPolicy>): void {
    this.rotationPolicy = { ...this.rotationPolicy, ...policy }
  }

  /**
   * Get key management statistics
   */
  getStats(): { currentKeyAge: number; rotationPolicy: KeyRotationPolicy } {
    const currentKeyAge = this.currentKeyPair ? Date.now() - this.currentKeyPair.createdAt : 0

    return {
      currentKeyAge,
      rotationPolicy: this.rotationPolicy,
    }
  }
}

export const keyManager = KeyManager.getInstance()
