/**
 * Web Worker for cryptographic operations
 * Handles encryption/decryption without blocking the main thread
 */

// Import crypto utilities (simplified for worker context)
class WorkerCryptoManager {
  constructor() {
    this.sessionKeys = new Map()
    this.AES_KEY_LENGTH = 256
  }

  async generateSessionKey(sessionId) {
    try {
      const key = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: this.AES_KEY_LENGTH,
        },
        true,
        ["encrypt", "decrypt"],
      )

      this.sessionKeys.set(sessionId, key)
      return { success: true, sessionId }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async encryptData(data, sessionId) {
    try {
      const key = this.sessionKeys.get(sessionId)
      if (!key) {
        throw new Error("Session key not found")
      }

      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        data,
      )

      return {
        success: true,
        encryptedData,
        iv: Array.from(iv),
        authTag: Array.from(new Uint8Array(encryptedData.slice(-16))),
        keyId: sessionId,
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async decryptData(encryptedData, iv, sessionId) {
    try {
      const key = this.sessionKeys.get(sessionId)
      if (!key) {
        throw new Error("Session key not found")
      }

      const ivArray = new Uint8Array(iv)
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivArray,
        },
        key,
        encryptedData,
      )

      return {
        success: true,
        decryptedData,
        verified: true,
      }
    } catch (error) {
      return {
        success: false,
        decryptedData: new ArrayBuffer(0),
        verified: false,
        error: error.message,
      }
    }
  }

  async encryptText(text, sessionId) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    return await this.encryptData(data, sessionId)
  }

  async decryptText(encryptedData, iv, sessionId) {
    const result = await this.decryptData(encryptedData, iv, sessionId)
    if (result.success) {
      const decoder = new TextDecoder()
      result.text = decoder.decode(result.decryptedData)
    }
    return result
  }
}

const workerCrypto = new WorkerCryptoManager()

// Message handler
self.onmessage = async (e) => {
  const { id, type, payload } = e.data

  try {
    let result

    switch (type) {
      case "generateSessionKey":
        result = await workerCrypto.generateSessionKey(payload.sessionId)
        break

      case "encryptData":
        result = await workerCrypto.encryptData(payload.data, payload.sessionId)
        break

      case "decryptData":
        result = await workerCrypto.decryptData(payload.encryptedData, payload.iv, payload.sessionId)
        break

      case "encryptText":
        result = await workerCrypto.encryptText(payload.text, payload.sessionId)
        break

      case "decryptText":
        result = await workerCrypto.decryptText(payload.encryptedData, payload.iv, payload.sessionId)
        break

      case "cleanup":
        // Clean up session keys
        workerCrypto.sessionKeys.clear()
        result = { success: true }
        break

      default:
        result = { success: false, error: "Unknown operation type" }
    }

    self.postMessage({ id, result })
  } catch (error) {
    self.postMessage({
      id,
      result: { success: false, error: error.message },
    })
  }
}

// Handle worker termination
self.onclose = () => {
  workerCrypto.sessionKeys.clear()
}
