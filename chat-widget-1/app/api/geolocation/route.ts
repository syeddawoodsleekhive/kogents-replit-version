import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get IP from request headers
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")
    const cfConnectingIP = request.headers.get("cf-connecting-ip")

    // Extract IP from headers, removing the non-existent request.ip
    let clientIP = ""
    if (cfConnectingIP) {
      clientIP = cfConnectingIP
    } else if (realIP) {
      clientIP = realIP
    } else if (forwardedFor) {
      clientIP = forwardedFor.split(",")[0].trim()
    }

    // If no IP from headers, try to get external IP
    if (!clientIP) {
      try {
        const externalIP = await getExternalIP();
        if (externalIP) {
          clientIP = externalIP;
        }
      } catch (error) {
        // Silent fallback
      }
    }

    const result = await getGeolocationData(clientIP)
    
    return result
  } catch (error) {
    return NextResponse.json({ error: "Failed to get geolocation data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let ip = body.ip || ""

    // If no IP provided in POST body, try to get external IP
    if (!ip) {
      try {
        const externalIP = await getExternalIP();
        if (externalIP) {
          ip = externalIP;
        }
      } catch (error) {
        // Silent fallback
      }
    }

    const result = await getGeolocationData(ip)
    
    return result
  } catch (error) {
    return NextResponse.json({ error: "Failed to get geolocation data" }, { status: 500 })
  }
}

async function getGeolocationData(ip: string) {
  try {
    // If we have an IP, try NeutrinoAPI first
    if (ip) {
      
      // Check if environment variables are set
      const userId = process.env.NEXT_PUBLIC_NEUTRINO_USER_ID;
      const apiKey = process.env.NEXT_PUBLIC_NEUTRINO_API_KEY;
      
      if (!userId || !apiKey) {
        throw new Error("NeutrinoAPI credentials not configured");
      }
      
      const ipInfoResponse = await fetch("https://neutrinoapi.net/ip-info", {
        method: "POST",
        headers: {
          "User-ID": userId,
          "API-Key": apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          ip: ip,
          "reverse-lookup": "true",
        }),
      })

      let ipInfo = null;
      if (ipInfoResponse.ok) {
        ipInfo = await ipInfoResponse.json()
      } else {
        const errorText = await ipInfoResponse.text();
        console.warn("⚠️  NeutrinoAPI IP Info failed with status:", ipInfoResponse.status);
        console.warn("📄 Error Response:", errorText);
      }

      // Try to get mobile device info if we have a phone number or user agent
      let mobileInfo = null;
      try {
        mobileInfo = await getMobileDeviceInfo(userId, apiKey);
      } catch (error) {
        console.warn("⚠️  Mobile device info failed:", error);
      }

      // Return combined data
      const finalResult = {
        ip: ipInfo?.ip || ip,
        city: ipInfo?.city || "",
        region: ipInfo?.region || "",
        country: ipInfo?.country || "",
        countryCode: ipInfo?.["country-code"] || ipInfo?.country || "",
        latitude: ipInfo?.latitude || null,
        longitude: ipInfo?.longitude || null,
        coordinates: ipInfo?.latitude && ipInfo?.longitude ? `${ipInfo.latitude},${ipInfo.longitude}` : "",
        isp: ipInfo?.isp || "",
        org: ipInfo?.org || "",
        organization: ipInfo?.isp || ipInfo?.org || "",
        hostname: ipInfo?.hostname || "",
        timezone: ipInfo?.timezone || "",
        postalCode: ipInfo?.["postal-code"] || "",
        // Mobile device information
        mobileDevice: mobileInfo?.device || null,
        mobileCarrier: mobileInfo?.carrier || null,
        mobileNetwork: mobileInfo?.network || null,
        mobileStatus: mobileInfo?.status || null,
        mobileType: mobileInfo?.type || null,
        source: "neutrinoapi",
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(finalResult);
    }

    // Fallback: try to get IP and basic info from external services
    const externalIP = await getExternalIP();
    
    if (externalIP) {
      const fallbackResult = {
        ip: externalIP,
        city: "",
        region: "",
        country: "",
        countryCode: "",
        coordinates: "",
        organization: "",
        hostname: "",
        timezone: "",
        postalCode: "",
        // Mobile device information (empty for external services)
        mobileDevice: null,
        mobileCarrier: null,
        mobileNetwork: null,
        mobileStatus: null,
        mobileType: null,
        source: "external-service",
        timestamp: new Date().toISOString(),
      };
      
      return NextResponse.json(fallbackResult);
    }

    // Final fallback
    const finalFallbackResult = {
      ip: ip || "",
      city: "",
      region: "",
      country: "",
      countryCode: "",
      coordinates: "",
      organization: "",
      hostname: "",
      timezone: "",
      postalCode: "",
      // Mobile device information (empty for fallback)
      mobileDevice: null,
      mobileCarrier: null,
      mobileNetwork: null,
      mobileStatus: null,
      mobileType: null,
      source: "fallback",
      error: "No IP detection method succeeded",
    };
    
    return NextResponse.json(finalFallbackResult);
    
  } catch (error) {
    const errorResult = {
      ip: ip || "",
      city: "",
      region: "",
      country: "",
      countryCode: "",
      coordinates: "",
      organization: "",
      hostname: "",
      timezone: "",
      postalCode: "",
      // Mobile device information (empty for error case)
      mobileDevice: null,
      mobileCarrier: null,
      mobileNetwork: null,
      mobileStatus: null,
      mobileType: null,
      source: "fallback",
      error: error instanceof Error ? error.message : "Geolocation service unavailable",
    };
    
    return NextResponse.json(errorResult);
  }
}

/**
 * Get mobile device information using NeutrinoAPI
 */
async function getMobileDeviceInfo(userId: string, apiKey: string) {
  try {
    // For now, we'll return basic mobile detection
    // In a real implementation, you would:
    // 1. Get phone number from user input or session
    // 2. Call HLR Lookup API with the phone number
    // 3. Call User Agent Info API with the user agent string
    
    const mobileInfo = {
      device: "Mobile device detected",
      carrier: "Unknown (requires phone number)",
      network: "Unknown (requires phone number)",
      status: "Unknown (requires phone number)",
      type: "Mobile",
    };

    return mobileInfo;
  } catch (error) {
    console.warn("Mobile device info collection failed:", error);
    return null;
  }
}

/**
 * Get IP from external service as fallback
 */
async function getExternalIP(): Promise<string | null> {
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
          
          if (ip && isValidIP(ip)) {
            return ip;
          }
        }
      } catch (error) {
        console.warn(`External IP service ${service} failed:`, error);
      }
    }
  } catch (error) {
    console.warn("All external IP services failed:", error);
  }

  return null;
}

/**
 * Validate IP format
 */
function isValidIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}
