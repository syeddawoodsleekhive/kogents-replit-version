import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get IP from request headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");
    const xClientIP = request.headers.get("x-client-ip");
    const xForwardedProto = request.headers.get("x-forwarded-proto");

    let clientIP = "";

    // Priority order for IP extraction
    if (cfConnectingIP) {
      // Cloudflare provides the most reliable IP
      clientIP = cfConnectingIP;
    } else if (realIP) {
      // Nginx real IP
      clientIP = realIP;
    } else if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      clientIP = forwardedFor.split(",")[0].trim();
    } else if (xClientIP) {
      // Alternative client IP header
      clientIP = xClientIP;
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(clientIP)) {
      clientIP = "";
    }

    // If no IP found in headers, try external IP service as fallback
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

    const finalResult = {
      ip: clientIP,
      clientIP: clientIP,
      source: clientIP ? "server-headers" : "external-service",
      headers: {
        "x-forwarded-for": forwardedFor,
        "x-real-ip": realIP,
        "cf-connecting-ip": cfConnectingIP,
        "x-client-ip": xClientIP,
        "x-forwarded-proto": xForwardedProto,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(finalResult);

  } catch (error) {
    return NextResponse.json({ error: "Failed to detect IP", ip: "" }, { status: 500 });
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
        // Silent fallback
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate IP format
 */
function isValidIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}
