import { generateDeviceFingerprint } from "./device-fingerprinting"
import { detectUserIP } from "./hybrid-ip-detector"
import type { UnifiedUserInfo, DataCollectionConfig, GeolocationData, DeviceData, NetworkData } from "@/types/chat"

export class UnifiedDataCollector {
  private config: DataCollectionConfig
  private cache: Map<string, any> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor(config: DataCollectionConfig) {
    this.config = config
  }

  async collectUnifiedUserInfo(sessionId: string, visitorId: string): Promise<UnifiedUserInfo> {
    const timestamp = new Date()
    const cacheKey = `unified-${sessionId}-${visitorId}`

    // Check cache first
    const cached = this.getCachedData(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const [ipResult, device, fingerprint] = await Promise.allSettled([
        detectUserIP(),
        this.collectDeviceData(),
        this.config.enableFingerprinting ? this.collectFingerprintData() : Promise.resolve(null),
      ])

      // Extract results
      const ipData = this.extractValue(ipResult)
      const deviceData = this.extractValue(device) || this.getFallbackDevice()
      const fingerprintData = this.extractValue(fingerprint)

      // Extract page context
      const pageInfo = this.getPageInfo()

      // Determine privacy settings
      const privacySettings = this.getPrivacySettings()

      const unifiedInfo: UnifiedUserInfo = {
        sessionId,
        visitorId,
        timestamp,
        geolocation: ipData?.geolocation || this.getFallbackGeolocation(),
        device: deviceData,
        network: {
          localIPs: ipData?.localIPs || [],
          publicIP: ipData?.publicIP || "",
          connectionType: (navigator as any).connection?.type,
          effectiveType: (navigator as any).connection?.effectiveType,
          downlink: (navigator as any).connection?.downlink,
          rtt: (navigator as any).connection?.rtt,
        },
        fingerprint: fingerprintData || undefined,
        fingerprintSignature: fingerprintData?.metadata?.signature,
        fingerprintConfidence: fingerprintData?.metadata?.confidence,
        pageInfo,
        privacySettings,
        metadata: {
          dataCollectionMethod: this.config.enableFingerprinting ? "hybrid" : "basic",
          geolocationSource: ipData?.source || "fallback",
          deviceDataSource: this.config.enableFingerprinting ? "fingerprinting" : "user-agent",
          networkDataSource: ipData ? "hybrid-ip-detector" : "connection-api",
          collectionTimestamp: timestamp,
          version: "2.0.0",
        },
      }

      // Cache the result
      this.setCachedData(cacheKey, unifiedInfo)

      return unifiedInfo
    } catch (error) {
      console.error("Failed to collect unified user info:", error)
      return this.getFallbackUserInfo(sessionId, visitorId, timestamp)
    }
  }

  private async collectDeviceData(): Promise<DeviceData> {
    if (typeof window === "undefined") {
      return this.getFallbackDevice()
    }

    const userAgent = navigator.userAgent
    const screen = window.screen

    return {
      platform: this.detectPlatform(userAgent),
      device: this.detectDevice(userAgent),
      browser: this.detectBrowser(userAgent),
      browserVersion: this.detectBrowserVersion(userAgent),
      userAgent,
      deviceType: this.detectDeviceType(userAgent),
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      languages: Array.from(navigator.languages || [navigator.language]),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || "unspecified",
      touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      memory: (navigator as any).deviceMemory,
    }
  }

  private async collectFingerprintData() {
    if (!this.config.enableFingerprinting) {
      return null
    }

    return await generateDeviceFingerprint(true, this.config.fingerprintingOptions)
  }

  private getPageInfo() {
    if (typeof window === "undefined") {
      return {
        url: "",
        title: "",
        referrer: "",
        parentUrl: "",
        parentTitle: "",
      }
    }

    return {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      parentUrl: this.getParentUrl(),
      parentTitle: this.getParentTitle(),
    }
  }

  private getPrivacySettings() {
    return {
      consentGiven: this.config.requireConsent ? this.hasConsent() : true,
      dataProcessingAllowed: !this.config.respectPrivacy || this.hasDataProcessingConsent(),
      fingerprintingAllowed: this.config.enableFingerprinting && this.hasFingerprintingConsent(),
      anonymized: this.config.respectPrivacy && !this.hasFullDataConsent(),
    }
  }

  // Helper methods
  private extractValue<T>(result: PromiseSettledResult<T>): T | null {
    return result.status === "fulfilled" ? result.value : null
  }

  private getCachedData(key: string) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  // Fallback methods
  private getFallbackGeolocation(): GeolocationData {
    return {
      ip: "",
      city: "",
      region: "",
      country: "",
      countryCode: "",
      coordinates: "",
      organization: "",
      hostname: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      postalCode: "",
    }
  }

  private getFallbackDevice(): DeviceData {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""

    return {
      platform: this.detectPlatform(userAgent),
      device: this.detectDevice(userAgent),
      browser: this.detectBrowser(userAgent),
      userAgent,
      deviceType: this.detectDeviceType(userAgent),
      screenResolution:
        typeof window !== "undefined" ? `${window.screen?.width || 0}x${window.screen?.height || 0}` : "0x0",
      language: typeof navigator !== "undefined" ? navigator.language : "en-US",
      languages: typeof navigator !== "undefined" ? Array.from(navigator.languages || [navigator.language]) : ["en-US"],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      cookieEnabled: typeof navigator !== "undefined" ? navigator.cookieEnabled : false,
      doNotTrack: typeof navigator !== "undefined" ? navigator.doNotTrack || "unspecified" : "unspecified",
      touchSupport: typeof window !== "undefined" ? "ontouchstart" in window : false,
      hardwareConcurrency: typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 1 : 1,
    }
  }

  private getFallbackNetwork(): NetworkData {
    return {
      localIPs: [],
      publicIP: "",
      connectionType: undefined,
      effectiveType: undefined,
      downlink: undefined,
      rtt: undefined,
    }
  }

  private getFallbackUserInfo(sessionId: string, visitorId: string, timestamp: Date): UnifiedUserInfo {
    return {
      sessionId,
      visitorId,
      timestamp,
      geolocation: this.getFallbackGeolocation(),
      device: this.getFallbackDevice(),
      network: this.getFallbackNetwork(),
      pageInfo: this.getPageInfo(),
      privacySettings: this.getPrivacySettings(),
      metadata: {
        dataCollectionMethod: "basic",
        geolocationSource: "fallback",
        deviceDataSource: "basic",
        networkDataSource: "server-headers",
        collectionTimestamp: timestamp,
        version: "2.0.0",
      },
    }
  }

  // Detection methods (simplified versions)
  private detectPlatform(userAgent: string): string {
    if (/Windows NT/i.test(userAgent)) return "Windows"
    if (/Macintosh|Mac OS X/i.test(userAgent)) return "macOS"
    if (/Android/i.test(userAgent)) return "Android"
    if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS"
    if (/Linux/i.test(userAgent)) return "Linux"
    return "Other"
  }

  private detectDevice(userAgent: string): string {
    if (/iPhone/i.test(userAgent)) return "iPhone"
    if (/iPad/i.test(userAgent)) return "iPad"
    if (/Android/i.test(userAgent) && /Mobile/i.test(userAgent)) return "Android Phone"
    if (/Android/i.test(userAgent)) return "Android Tablet"
    if (/Macintosh/i.test(userAgent)) return "Mac"
    if (/Windows/i.test(userAgent)) return "Windows PC"
    return "Other"
  }

  private detectBrowser(userAgent: string): string {
    if (/Edg\//.test(userAgent)) return "Edge"
    if (/Chrome/.test(userAgent) && !/Edg\//.test(userAgent)) return "Chrome"
    if (/Firefox/.test(userAgent)) return "Firefox"
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return "Safari"
    return "Unknown"
  }

  private detectBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+\.\d+)/i)
    return match ? match[2] : ""
  }

  private detectDeviceType(userAgent: string): "Desktop" | "Mobile" | "Tablet" {
    if (/iPad/.test(userAgent) || (navigator.maxTouchPoints && window.screen.width > 767)) {
      return "Tablet"
    }
    if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return "Mobile"
    }
    return "Desktop"
  }

  // Privacy consent methods (to be implemented based on requirements)
  private hasConsent(): boolean {
    // Implementation depends on consent management system
    return true
  }

  private hasDataProcessingConsent(): boolean {
    return true
  }

  private hasFingerprintingConsent(): boolean {
    return true
  }

  private hasFullDataConsent(): boolean {
    return true
  }

  private getParentUrl(): string {
    try {
      return window.parent !== window ? window.parent.location.href : ""
    } catch {
      return ""
    }
  }

  private getParentTitle(): string {
    try {
      return window.parent !== window ? window.parent.document.title : ""
    } catch {
      return ""
    }
  }
}

// Default configuration
export const defaultDataCollectionConfig: DataCollectionConfig = {
  enableFingerprinting: true,
  enableGeolocation: true,
  enableNetworkDetection: true,
  respectPrivacy: true,
  requireConsent: false,
  fallbackToBasic: true,
  timeout: 5000,
  fingerprintingOptions: {
    enableCanvas: true,
    enableWebGL: true,
    enableAudio: true,
    enableFonts: true,
    enableBattery: true,
    enableWebRTC: true,
    enablePlugins: true,
    enableMediaDevices: true,
    timeout: 5000,
    respectPrivacy: true,
  },
}
