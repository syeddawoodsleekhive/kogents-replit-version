/**
 * Privacy and Compliance Utilities
 * Handles GDPR compliance, data retention, and privacy controls.
 * NOTE: Consent state is only stored in localStorage/sessionStorage and never as a global variable.
 */

//#region --- Readiness & Third-Party Integration ---
function privacyReady() {
  // Add real checks for consent system readiness here
  // Currently: Always return true
  return true;
}

function thirdPartyPrivacyReady() {
  // Placeholder for third-party privacy readiness checks
  // Currently: Always return true
  return true;
}
//#endregion

//#region --- Rate Limiting ---
const PRIVACY_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const PRIVACY_RATE_LIMIT_MAX_REQUESTS = 10; // max requests per window
const privacyRateLimitStore: Record<
  string,
  { count: number; windowStart: number }
> = {};

function isPrivacyRateLimited(key: string): boolean {
  const now = Date.now();
  let store = privacyRateLimitStore[key];
  if (!store || now - store.windowStart > PRIVACY_RATE_LIMIT_WINDOW_MS) {
    privacyRateLimitStore[key] = { count: 1, windowStart: now };
    return false;
  }
  store.count++;
  if (store.count > PRIVACY_RATE_LIMIT_MAX_REQUESTS) return true;
  privacyRateLimitStore[key] = store;
  return false;
}
//#endregion

//#region --- Event Dispatch Utility ---
function dispatchPrivacyEvent(eventName: string, detail?: any) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent(`privacy-${eventName}`, { detail });
    window.dispatchEvent(event);
    // Cross-frame coordination
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: `privacy:${eventName}`, detail }, "*");
    }
  }
}
//#endregion

//#region --- Interfaces ---
export interface ConsentState {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: Date;
  version: string;
}

export interface RetentionPolicy {
  referrerData: number; // days
  urlHistory: number; // days
  sessionData: number; // days
  chatHistory: number; // days
}

export interface PrivacyConfig {
  enableGDPR: boolean;
  requireConsent: boolean;
  retentionPolicy: RetentionPolicy;
  anonymizeData: boolean;
}
//#endregion

//#region --- Config & Storage ---
export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  enableGDPR: true,
  requireConsent: false,
  retentionPolicy: {
    referrerData: 30,
    urlHistory: 7,
    sessionData: 30,
    chatHistory: 365,
  },
  anonymizeData: true,
};

export const PRIVACY_STORAGE_KEYS = {
  CONSENT: "kogents_privacy_consent",
  RETENTION_CLEANUP: "kogents_retention_cleanup",
  ANONYMIZED_DATA: "kogents_anonymized_data",
} as const;
//#endregion

//#region --- Consent Management ---
export function getConsentState(): ConsentState | null {
  if (!privacyReady() || !thirdPartyPrivacyReady()) return null;
  try {
    const stored = localStorage.getItem(PRIVACY_STORAGE_KEYS.CONSENT);
    if (!stored) return null;
    const consent = JSON.parse(stored);
    return { ...consent, timestamp: new Date(consent.timestamp) };
  } catch {
    return null;
  }
}

export function saveConsentState(consent: Partial<ConsentState>): void {
  if (!privacyReady() || !thirdPartyPrivacyReady()) return;
  if (isPrivacyRateLimited("saveConsent")) {
    dispatchPrivacyEvent("rate-limit-exceeded", { action: "saveConsent" });
    return;
  }
  try {
    const currentConsent = getConsentState();
    const newConsent: ConsentState = {
      analytics: consent.analytics ?? false,
      functional: consent.functional ?? true, // Always allow functional
      marketing: consent.marketing ?? false,
      timestamp: new Date(),
      version: "1.0",
      ...currentConsent,
      ...consent,
    };
    localStorage.setItem(
      PRIVACY_STORAGE_KEYS.CONSENT,
      JSON.stringify(newConsent)
    );
    dispatchPrivacyEvent("consent-saved", newConsent);
  } catch (error) {
    console.warn("Failed to save consent state:", error);
  }
}

export function isTrackingAllowed(
  type: "analytics" | "functional" | "marketing"
): boolean {
  if (!privacyReady() || !thirdPartyPrivacyReady()) return false;
  if (type === "functional") return true; // Always allow functional tracking
  const consent = getConsentState();
  return consent ? consent[type] === true : false;
}
//#endregion

//#region --- Data Anonymization ---
export function anonymizeData<T extends Record<string, any>>(data: T): T {
  if (!privacyReady() || !thirdPartyPrivacyReady()) return data;

  const anonymized: Record<string, any> = { ...data };
  const sensitiveKeys = ["email", "phone", "ip", "userId", "sessionId"];
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

  // Mask direct keys
  sensitiveKeys.forEach((key) => {
    if (
      Object.prototype.hasOwnProperty.call(anonymized, key) &&
      typeof anonymized[key] === "string"
    ) {
      anonymized[key] = anonymized[key].substring(0, 3) + "***";
    }
  });

  // Mask patterns in strings
  Object.keys(anonymized).forEach((key) => {
    if (typeof anonymized[key] === "string") {
      anonymized[key] = anonymized[key]
        .replace(emailPattern, "[EMAIL]")
        .replace(phonePattern, "[PHONE]")
        .replace(ipPattern, "[IP]");
    }
  });

  dispatchPrivacyEvent("data-anonymized", anonymized);
  return anonymized as T;
}
//#endregion

//#region --- Retention & Cleanup ---
export function shouldRetainData(
  timestamp: Date,
  dataType: keyof RetentionPolicy,
  policy: RetentionPolicy = DEFAULT_PRIVACY_CONFIG.retentionPolicy
): boolean {
  const now = new Date();
  const ageInDays =
    (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays <= policy[dataType];
}

export function cleanupExpiredData(
  policy: RetentionPolicy = DEFAULT_PRIVACY_CONFIG.retentionPolicy
): void {
  if (!privacyReady() || !thirdPartyPrivacyReady()) return;
  if (isPrivacyRateLimited("cleanupExpiredData")) {
    dispatchPrivacyEvent("rate-limit-exceeded", {
      action: "cleanupExpiredData",
    });
    return;
  }
  try {
    const now = new Date();

    // Referrer data
    const referrerKey = "kogents_referrer_data";
    const referrerData = sessionStorage.getItem(referrerKey);
    if (referrerData) {
      try {
        const parsed = JSON.parse(referrerData);
        if (
          parsed.timestamp &&
          !shouldRetainData(new Date(parsed.timestamp), "referrerData", policy)
        ) {
          sessionStorage.removeItem(referrerKey);
        }
      } catch {}
    }

    // URL history
    const historyKey = "url_tracking_history";
    const historyData = localStorage.getItem(historyKey);
    if (historyData) {
      try {
        const parsed = JSON.parse(historyData);
        const filtered = parsed.filter((entry: any) =>
          shouldRetainData(new Date(entry.timestamp), "urlHistory", policy)
        );
        if (filtered.length !== parsed.length) {
          localStorage.setItem(historyKey, JSON.stringify(filtered));
        }
      } catch {}
    }

    // Session data
    const sessionKeys = ["kogents_session", "kogents_last_unsent_session"];
    sessionKeys.forEach((key) => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.expires && new Date(parsed.expires) < now) {
            localStorage.removeItem(key);
          }
        } catch {}
      }
    });

    // Update cleanup timestamp
    localStorage.setItem(
      PRIVACY_STORAGE_KEYS.RETENTION_CLEANUP,
      now.toISOString()
    );
    dispatchPrivacyEvent("expired-data-cleaned", { timestamp: now });
  } catch (error) {
    console.warn("Failed to cleanup expired data:", error);
  }
}
//#endregion

//#region --- GDPR: User Rights ---
export function deleteAllUserData(): void {
  if (!privacyReady() || !thirdPartyPrivacyReady()) return;
  if (isPrivacyRateLimited("deleteAllUserData")) {
    dispatchPrivacyEvent("rate-limit-exceeded", {
      action: "deleteAllUserData",
    });
    return;
  }
  try {
    const keysToRemove = [
      "kogents_session",
      "kogents_last_unsent_session",
      "kogents_referrer_data",
      "url_tracking_history",
      "chatSettings",
      PRIVACY_STORAGE_KEYS.CONSENT,
      PRIVACY_STORAGE_KEYS.RETENTION_CLEANUP,
      PRIVACY_STORAGE_KEYS.ANONYMIZED_DATA,
    ];
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Remove cookies
    const cookiesToRemove = ["sessionId"];
    cookiesToRemove.forEach((cookie) => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    dispatchPrivacyEvent("user-data-deleted", { timestamp: new Date() });
    console.log("All user data deleted successfully");
  } catch (error) {
    console.error("Failed to delete user data:", error);
  }
}

export function exportUserData(): Record<string, any> {
  if (!privacyReady() || !thirdPartyPrivacyReady()) return {};
  if (isPrivacyRateLimited("exportUserData")) {
    dispatchPrivacyEvent("rate-limit-exceeded", { action: "exportUserData" });
    return {};
  }
  try {
    const userData: Record<string, any> = {};
    const storageKeys = [
      "kogents_session",
      "kogents_referrer_data",
      "url_tracking_history",
      "chatSettings",
      PRIVACY_STORAGE_KEYS.CONSENT,
    ];
    storageKeys.forEach((key) => {
      const data = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (data) {
        try {
          userData[key] = JSON.parse(data);
        } catch {
          userData[key] = data;
        }
      }
    });

    userData._export_metadata = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      source: "kogents-chat-widget",
    };

    dispatchPrivacyEvent("user-data-exported", userData);
    return userData;
  } catch (error) {
    console.error("Failed to export user data:", error);
    return {};
  }
}
//#endregion

//#region --- Retention Scheduling ---
export function scheduleRetentionCleanup(
  policy: RetentionPolicy = DEFAULT_PRIVACY_CONFIG.retentionPolicy
): void {
  if (!privacyReady() || !thirdPartyPrivacyReady()) return;
  if (isPrivacyRateLimited("scheduleRetentionCleanup")) {
    dispatchPrivacyEvent("rate-limit-exceeded", {
      action: "scheduleRetentionCleanup",
    });
    return;
  }
  try {
    const lastCleanup = localStorage.getItem(
      PRIVACY_STORAGE_KEYS.RETENTION_CLEANUP
    );
    if (lastCleanup) {
      const lastCleanupDate = new Date(lastCleanup);
      const now = new Date();
      const hoursSinceCleanup =
        (now.getTime() - lastCleanupDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCleanup < 24) return; // Skip if cleaned recently
    }

    cleanupExpiredData(policy);

    // Schedule next run in 24h
    setTimeout(() => scheduleRetentionCleanup(policy), 24 * 60 * 60 * 1000);
  } catch (error) {
    console.warn("Failed to schedule retention cleanup:", error);
  }
}
//#endregion
