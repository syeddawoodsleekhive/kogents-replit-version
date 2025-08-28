"use client"

// Client-side environment utilities
export const isDevelopment = process.env.NODE_ENV === "development"
export const isProduction = process.env.NODE_ENV === "production"

// Safe environment check that works on both client and server
export function getEnvironment(): "development" | "production" | "test" {
  if (typeof window === "undefined") {
    // Server-side
    return (process.env.NODE_ENV as "development" | "production" | "test") || "production"
  }

  // Client-side - use a more reliable method
  return window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("dev")
    ? "development"
    : "production"
}

export function shouldShowDebugInfo(): boolean {
  return getEnvironment() === "development"
}
