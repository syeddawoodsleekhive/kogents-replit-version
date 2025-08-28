// Blob URL lifecycle management to prevent memory leaks

export interface ManagedUrl {
  url: string
  file: File
  createdAt: number
  lastAccessed: number
  accessCount: number
  autoCleanup: boolean
}

export interface UrlManagerOptions {
  maxUrls?: number
  maxAge?: number // milliseconds
  cleanupInterval?: number // milliseconds
  autoCleanup?: boolean
}

class ObjectUrlManager {
  private urls: Map<string, ManagedUrl> = new Map()
  private cleanupTimer: NodeJS.Timeout | null = null
  private readonly options: Required<UrlManagerOptions>

  constructor(options: UrlManagerOptions = {}) {
    this.options = {
      maxUrls: options.maxUrls ?? 100,
      maxAge: options.maxAge ?? 5 * 60 * 1000, // 5 minutes
      cleanupInterval: options.cleanupInterval ?? 60 * 1000, // 1 minute
      autoCleanup: options.autoCleanup ?? true,
    }

    if (this.options.autoCleanup) {
      this.startCleanupTimer()
    }
  }

  /**
   * Creates a managed object URL for a file
   */
  createUrl(file: File, autoCleanup = true): string {
    // Check if we already have a URL for this file
    const existingEntry = Array.from(this.urls.values()).find(
      (entry) => entry.file === file || (entry.file.name === file.name && entry.file.size === file.size),
    )

    if (existingEntry) {
      existingEntry.lastAccessed = Date.now()
      existingEntry.accessCount++
      return existingEntry.url
    }

    // Create new URL
    const url = URL.createObjectURL(file)
    const now = Date.now()

    const managedUrl: ManagedUrl = {
      url,
      file,
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      autoCleanup,
    }

    this.urls.set(url, managedUrl)

    // Enforce max URLs limit
    if (this.urls.size > this.options.maxUrls) {
      this.cleanupOldest()
    }

    return url
  }

  /**
   * Manually revokes a URL
   */
  revokeUrl(url: string): boolean {
    const managedUrl = this.urls.get(url)
    if (!managedUrl) return false

    URL.revokeObjectURL(url)
    this.urls.delete(url)
    return true
  }

  /**
   * Updates access time for a URL
   */
  accessUrl(url: string): boolean {
    const managedUrl = this.urls.get(url)
    if (!managedUrl) return false

    managedUrl.lastAccessed = Date.now()
    managedUrl.accessCount++
    return true
  }

  /**
   * Gets information about a managed URL
   */
  getUrlInfo(url: string): ManagedUrl | null {
    return this.urls.get(url) || null
  }

  /**
   * Gets all managed URLs
   */
  getAllUrls(): ManagedUrl[] {
    return Array.from(this.urls.values())
  }

  /**
   * Gets URLs for a specific file
   */
  getUrlsForFile(file: File): ManagedUrl[] {
    return Array.from(this.urls.values()).filter(
      (entry) => entry.file === file || (entry.file.name === file.name && entry.file.size === file.size),
    )
  }

  /**
   * Cleans up expired URLs
   */
  cleanup(): number {
    const now = Date.now()
    let cleanedCount = 0

    for (const [url, managedUrl] of this.urls.entries()) {
      const age = now - managedUrl.createdAt
      const timeSinceAccess = now - managedUrl.lastAccessed

      // Clean up if:
      // 1. URL is older than maxAge
      // 2. URL hasn't been accessed recently and we're over capacity
      // 3. URL is marked for auto cleanup and hasn't been accessed in a while
      const shouldCleanup =
        age > this.options.maxAge ||
        (this.urls.size > this.options.maxUrls * 0.8 && timeSinceAccess > 60000) ||
        (managedUrl.autoCleanup && timeSinceAccess > this.options.maxAge / 2)

      if (shouldCleanup) {
        URL.revokeObjectURL(url)
        this.urls.delete(url)
        cleanedCount++
      }
    }

    return cleanedCount
  }

  /**
   * Cleans up the oldest URLs when over capacity
   */
  private cleanupOldest(): void {
    const entries = Array.from(this.urls.entries())
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

    const toRemove = Math.ceil(this.options.maxUrls * 0.1) // Remove 10%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const [url] = entries[i]
      URL.revokeObjectURL(url)
      this.urls.delete(url)
    }
  }

  /**
   * Starts the automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) return

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.options.cleanupInterval)
  }

  /**
   * Stops the automatic cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * Revokes all URLs and clears the manager
   */
  clear(): void {
    for (const [url] of this.urls) {
      URL.revokeObjectURL(url)
    }
    this.urls.clear()
  }

  /**
   * Gets memory usage statistics
   */
  getStats(): {
    totalUrls: number
    totalSize: number
    averageAge: number
    averageAccessCount: number
    oldestUrl: number
    newestUrl: number
  } {
    const now = Date.now()
    const urls = Array.from(this.urls.values())

    if (urls.length === 0) {
      return {
        totalUrls: 0,
        totalSize: 0,
        averageAge: 0,
        averageAccessCount: 0,
        oldestUrl: 0,
        newestUrl: 0,
      }
    }

    const totalSize = urls.reduce((sum, url) => sum + url.file.size, 0)
    const totalAge = urls.reduce((sum, url) => sum + (now - url.createdAt), 0)
    const totalAccessCount = urls.reduce((sum, url) => sum + url.accessCount, 0)
    const ages = urls.map((url) => now - url.createdAt)

    return {
      totalUrls: urls.length,
      totalSize,
      averageAge: totalAge / urls.length,
      averageAccessCount: totalAccessCount / urls.length,
      oldestUrl: Math.max(...ages),
      newestUrl: Math.min(...ages),
    }
  }

  /**
   * Cleanup on destruction
   */
  destroy(): void {
    this.stopCleanupTimer()
    this.clear()
  }
}

// Global instance
export const objectUrlManager = new ObjectUrlManager()

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    objectUrlManager.destroy()
  })
}

/**
 * Convenience function to create a managed URL
 */
export function createManagedUrl(file: File, autoCleanup = true): string {
  return objectUrlManager.createUrl(file, autoCleanup)
}

/**
 * Convenience function to revoke a managed URL
 */
export function revokeManagedUrl(url: string): boolean {
  return objectUrlManager.revokeUrl(url)
}

/**
 * Convenience function to access a URL (updates access time)
 */
export function accessManagedUrl(url: string): boolean {
  return objectUrlManager.accessUrl(url)
}

/**
 * Hook for React components to create managed URLs with automatic cleanup
 */
export function useManagedUrl(file: File | null): string | null {
  if (typeof window === "undefined" || !file) return null

  const url = objectUrlManager.createUrl(file, true)

  // Cleanup function for React
  const cleanup = () => {
    objectUrlManager.revokeUrl(url)
  }

  // Return URL and cleanup function
  return url
}
