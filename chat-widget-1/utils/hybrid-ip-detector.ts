import type { GeolocationData } from "@/types/chat"

export interface IPDetectionResult {
  publicIP: string
  localIPs: string[]
  geolocation: GeolocationData | null
  mobileInfo: MobileDeviceInfo | null
  source: "server-headers" | "neutrinoapi" | "webrtc" | "fallback"
  confidence: number
}

export interface MobileDeviceInfo {
  isMobile: boolean
  deviceType: string
  userAgent: string
  detectedBy: string
  carrier: string | null
  network: string | null
  status: string | null
  phoneNumber: string | null
  deviceBrand: string | null
  deviceModel: string | null
  hlrData?: any
  userAgentData?: any
}

export class HybridIPDetector {
  private cache: Map<string, { data: IPDetectionResult; timestamp: number }> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  /**
   * Primary IP detection strategy:
   * 1. Server-side IP extraction from headers (most reliable)
   * 2. NeutrinoAPI for geolocation enhancement
   * 3. WebRTC for local network topology
   */
  async detectIP(): Promise<IPDetectionResult> {
    const cacheKey = "ip-detection"
    const cached = this.getCachedResult(cacheKey)
    if (cached) {
      return cached
    }

    try {
      
      console.log("🔍 Step 1: Server-side IP detection...");
      const serverResult = await this.getServerSideIP()
      console.log("📊 Server-side IP result:", serverResult);

      // Step 2: Get local IPs via WebRTC (non-blocking)
      console.log("🔍 Step 2: Local IP detection via WebRTC...");
      const localIPs = await this.getLocalIPs()
      console.log("📊 Local IPs detected:", localIPs);

      // Step 3: If no public IP from server, try NeutrinoAPI directly
      let publicIP = serverResult.publicIP;
      let source = serverResult.source;
      
      if (!publicIP) {
        console.log("⚠️  No public IP from server, trying NeutrinoAPI...");
        const neutrinoResult = await this.getNeutrinoAPIIP();
        publicIP = neutrinoResult.publicIP;
        source = neutrinoResult.source;
        console.log("📊 NeutrinoAPI result:", neutrinoResult);
      }

      // Step 4: Enhance with geolocation if we have a public IP
      let geolocation = null;
      if (publicIP) {
        geolocation = await this.enhanceWithGeolocation(publicIP);
      } else {
        console.log("⚠️  No public IP available, skipping geolocation enhancement");
      }

      // Step 5: Get mobile device information
      const mobileInfo = await this.getMobileDeviceInfo()
      console.log("📊 Mobile device info:", mobileInfo);

      const result: IPDetectionResult = {
        publicIP,
        localIPs,
        geolocation,
        mobileInfo,
        source,
        confidence: this.calculateConfidence({ publicIP, source }, localIPs, geolocation),
      }


      console.log("📊 Final result:", result);

      
      this.setCachedResult(cacheKey, result)
      return result
    } catch (error) {
      console.error("Error:", error);
      return this.getFallbackResult()
    }
  }

  /**
   * Server-side IP detection using request headers
   * This is the most reliable method for public IP
   */
  private async getServerSideIP(): Promise<{
    publicIP: string
    source: "server-headers" | "neutrinoapi" | "fallback"
  }> {
    try {
      // Call our server endpoint that extracts IP from headers
      const response = await fetch("/api/detect-ip", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        return {
          publicIP: data.ip || "",
          source: "server-headers",
        }
      }
    } catch (error) {
      console.warn("Server-side IP detection failed:", error)
    }

    // Fallback to NeutrinoAPI direct call
    return this.getNeutrinoAPIIP()
  }

  /**
   * NeutrinoAPI IP detection as fallback
   */
  private async getNeutrinoAPIIP(): Promise<{ publicIP: string; source: "neutrinoapi" | "fallback" }> {
    try {

      // Call our geolocation endpoint which will use NeutrinoAPI
      const response = await fetch("/api/geolocation", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })
      
      if (response.ok) {
        const data = await response.json()

        if (data.ip && data.ip !== "") {
          return {
            publicIP: data.ip,
            source: "neutrinoapi",
          }
        }
      } else {
        console.warn("NeutrinoAPI endpoint returned error:", response.status, response.statusText);
      }
    } catch (error) {
      console.warn("NeutrinoAPI IP detection failed:", error)
    }

    // Try external IP services as final fallback
    return await this.getExternalIPFallback();
  }

  /**
   * External IP services as final fallback
   */
  private async getExternalIPFallback(): Promise<{ publicIP: string; source: "neutrinoapi" | "fallback" }> {
    try {
      // Try multiple external IP services
      const ipServices = [
        "https://api.ipify.org?format=json",
        "https://api.myip.com",
        "https://ipapi.co/json",
      ];

      for (const service of ipServices) {
        try {
          const response = await fetch(service, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            const ip = data.ip || data.query;
            
            if (ip && this.isValidIP(ip)) {
              return {
                publicIP: ip,
                source: "neutrinoapi", // Still use this source for consistency
              };
            }
          }
        } catch (error) {
          console.warn(`External IP service ${service} failed:`, error);
        }
      }
    } catch (error) {
      console.warn("All external IP services failed:", error);
    }

    return {
      publicIP: "",
      source: "fallback",
    };
  }

  /**
   * Validate IP format
   */
  private isValidIP(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * WebRTC local IP detection (privacy-respecting)
   * Only detects local network IPs, not public IP
   */
  private async getLocalIPs(): Promise<string[]> {
    if (typeof window === "undefined") {
      return []
    }

    const RTCPeerConnection =
      window.RTCPeerConnection || (window as any).mozRTCPeerConnection || (window as any).webkitRTCPeerConnection

    if (!RTCPeerConnection) {
      return []
    }

    return new Promise((resolve) => {
      const localIPs: string[] = []

      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
        })

        pc.createDataChannel("")

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate
            const match = candidate.match(/(\d+\.\d+\.\d+\.\d+)/)

            if (match) {
              const ip = match[1]
              if (this.isPrivateIP(ip) && !localIPs.includes(ip)) {
                localIPs.push(ip)
              }
            }
          } else {
            pc.close()
            resolve(localIPs)
          }
        }

        pc.createOffer().then((offer) => pc.setLocalDescription(offer))

        // Timeout to prevent hanging
        setTimeout(() => {
          pc.close()
          resolve(localIPs)
        }, 2000) // Reduced timeout since we only need local IPs
      } catch (error) {
        console.warn("WebRTC local IP detection failed:", error)
        resolve([])
      }
    })
  }

  /**
   * Enhance IP with geolocation data from NeutrinoAPI
   */
  private async enhanceWithGeolocation(ip: string): Promise<GeolocationData | null> {
    try {
      console.log("Enhancing IP with geolocation data:", ip);
      
      const response = await fetch("/api/geolocation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ip }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Geolocation enhancement response:", data);
        
        // Check if we actually got geolocation data
        if (data.source === "neutrinoapi" && (data.city || data.country)) {
          return {
            ip: data.ip || ip,
            city: data.city || "",
            region: data.region || "",
            country: data.country || "",
            countryCode: data.countryCode || "",
            coordinates: data.coordinates || "",
            organization: data.organization || "",
            hostname: data.hostname || "",
            timezone: data.timezone || "",
            postalCode: data.postalCode || "",
          }
        } else {
          console.warn("Geolocation enhancement returned empty or invalid data:", data);
          return null;
        }
      } else {
        console.warn("Geolocation enhancement failed with status:", response.status);
        const errorText = await response.text();
        console.warn("Error response:", errorText);
      }
    } catch (error) {
      console.warn("Geolocation enhancement failed:", error)
    }

    return null
  }

  /**
   * Check if IP is private/local
   */
  private isPrivateIP(ip: string): boolean {
    return (
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.16.") ||
      ip.startsWith("172.17.") ||
      ip.startsWith("172.18.") ||
      ip.startsWith("172.19.") ||
      ip.startsWith("172.20.") ||
      ip.startsWith("172.21.") ||
      ip.startsWith("172.22.") ||
      ip.startsWith("172.23.") ||
      ip.startsWith("172.24.") ||
      ip.startsWith("172.25.") ||
      ip.startsWith("172.26.") ||
      ip.startsWith("172.27.") ||
      ip.startsWith("172.28.") ||
      ip.startsWith("172.29.") ||
      ip.startsWith("172.30.") ||
      ip.startsWith("172.31.") ||
      ip.startsWith("127.") ||
      ip.startsWith("169.254.")
    )
  }

  /**
   * Calculate confidence score based on data sources
   */
  private calculateConfidence(
    serverResult: { publicIP: string; source: string },
    localIPs: string[],
    geolocation: GeolocationData | null,
  ): number {
    let confidence = 0

    // Server-side IP detection is most reliable
    if (serverResult.publicIP && serverResult.source === "server-headers") {
      confidence += 60
    } else if (serverResult.publicIP && serverResult.source === "neutrinoapi") {
      confidence += 50
    }

    // Local IP detection adds network topology confidence
    if (localIPs.length > 0) {
      confidence += 15
    }

    // Geolocation data adds location confidence
    if (geolocation && geolocation.city && geolocation.country) {
      confidence += 25
    } else if (geolocation && geolocation.ip) {
      // Even basic IP info adds confidence
      confidence += 15
    }

    // Bonus confidence for having both public and local IPs
    if (serverResult.publicIP && localIPs.length > 0) {
      confidence += 10
    }

    return Math.min(confidence, 100)
  }

  /**
   * Get mobile device information
   */
  private async getMobileDeviceInfo(): Promise<MobileDeviceInfo | null> {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      // Call our mobile device detection endpoint
      const response = await fetch("/api/mobile-device", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.mobileInfo || null;
      }
    } catch (error) {
      console.warn("Mobile device detection failed:", error);
    }

    return null;
  }

  /**
   * Fallback result when all detection methods fail
   */
  private getFallbackResult(): IPDetectionResult {
    return {
      publicIP: "",
      localIPs: [],
      geolocation: null,
      mobileInfo: null,
      source: "fallback",
      confidence: 0,
    }
  }

  /**
   * Cache management
   */
  private getCachedResult(key: string): IPDetectionResult | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCachedResult(key: string, data: IPDetectionResult): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * Clear cache (useful for testing or privacy compliance)
   */
  public clearCache(): void {
    this.cache.clear()
  }
}

// Singleton instance for global use
export const hybridIPDetector = new HybridIPDetector()

// Utility function for easy access
export async function detectUserIP(): Promise<IPDetectionResult> {
  return hybridIPDetector.detectIP()
}
