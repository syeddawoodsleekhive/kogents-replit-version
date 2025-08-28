"use client"

import { useState, useEffect } from "react"

export type NetworkQuality = "high" | "medium" | "low" | "unknown"
type ConnectionType = "4g" | "3g" | "2g" | "slow-2g" | "unknown"

interface NetworkInfo {
  quality: NetworkQuality
  connectionType: ConnectionType
  effectiveType: string
  downlink: number
  rtt: number
}

export function useNetworkQuality() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    quality: "unknown",
    connectionType: "unknown",
    effectiveType: "unknown",
    downlink: 0,
    rtt: 0,
  })

  useEffect(() => {
    const updateNetworkInfo = () => {
      // Check if the browser supports the Network Information API
      const connection =
        (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      if (connection) {
        const effectiveType = connection.effectiveType || "unknown"
        const downlink = connection.downlink || 0
        const rtt = connection.rtt || 0

        // Determine connection type
        let connectionType: ConnectionType = "unknown"
        switch (effectiveType) {
          case "4g":
            connectionType = "4g"
            break
          case "3g":
            connectionType = "3g"
            break
          case "2g":
            connectionType = "2g"
            break
          case "slow-2g":
            connectionType = "slow-2g"
            break
          default:
            connectionType = "unknown"
        }

        // Determine quality based on connection metrics
        let quality: NetworkQuality = "unknown"
        if (downlink >= 10 && rtt <= 100) {
          quality = "high"
        } else if (downlink >= 1.5 && rtt <= 300) {
          quality = "medium"
        } else if (downlink > 0) {
          quality = "low"
        }

        setNetworkInfo({
          quality,
          connectionType,
          effectiveType,
          downlink,
          rtt,
        })
      } else {
        // Fallback: assume medium quality if API is not available
        setNetworkInfo({
          quality: "medium",
          connectionType: "unknown",
          effectiveType: "unknown",
          downlink: 0,
          rtt: 0,
        })
      }
    }

    // Initial check
    updateNetworkInfo()

    // Listen for network changes
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener("change", updateNetworkInfo)

      return () => {
        connection.removeEventListener("change", updateNetworkInfo)
      }
    }
  }, [])

  return networkInfo
}
