// Session management utilities
export const getSessionId = (): string => {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("chat_session_id") || `session-${Date.now()}`
  }
  return `session-${Date.now()}`
}

// Referrer info cache
export let referrerInfoCache: any = null

// Set referrer info
export const setReferrerInfo = (info: any) => {
  referrerInfoCache = info
}

// Get referrer info
export const getReferrerInfo = () => {
  return referrerInfoCache
}

// Initialize referrer tracking
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    let data = event.data
    // Support both direct object and stringified JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data)
      } catch {
        return
      }
    }
    // Handle widget:referrer-update
    if (data && (data.type === "widget:referrer-update" || data === "widget:referrer-update")) {
      try {
        referrerInfoCache = data.payload || data.data || data
      } catch (err) {
        console.error("Error setting referrer info:", err)
      }
    }
  })
}
