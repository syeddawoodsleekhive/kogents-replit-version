// Sensitive parameters to remove from URLs
const SENSITIVE_PARAMS = [
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "key",
  "password",
  "pwd",
  "pass",
  "secret",
  "auth",
  "authorization",
  "session",
  "sessionid",
  "session_id",
  "sid",
  "ssid",
  "email",
  "user_id",
  "userid",
  "uid",
  "id",
  "credit_card",
  "cc",
  "cvv",
  "ssn",
  "social_security",
  "phone",
  "mobile",
  "tel",
  "telephone",
  "signature",
  "hash",
  "nonce",
  "state",
];

// PII patterns to detect in URLs
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card format
  /\b\d{10,15}\b/, // Phone numbers
];

// Search engines and social media domains
const SEARCH_ENGINES = [
  "google.com",
  "bing.com",
  "yahoo.com",
  "duckduckgo.com",
  "baidu.com",
  "yandex.com",
  "ask.com",
  "aol.com",
];

const SOCIAL_MEDIA = [
  "facebook.com",
  "twitter.com",
  "linkedin.com",
  "instagram.com",
  "youtube.com",
  "tiktok.com",
  "pinterest.com",
  "reddit.com",
  "snapchat.com",
  "whatsapp.com",
  "telegram.org",
  "discord.com",
  // Mobile app patterns
  "fb://", // Facebook app
  "twitter://", // Twitter app
  "instagram://", // Instagram app
  "linkedin://", // LinkedIn app
  "youtube://", // YouTube app
  "tiktok://", // TikTok app
  "pinterest://", // Pinterest app
  "reddit://", // Reddit app
];

const EMAIL_PROVIDERS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "hotmail.com",
  "mail.ru",
  "protonmail.com",
];

// Affiliate network parameters
const AFFILIATE_NETWORKS = {
  // ShareASale
  shareasale: ["sscid", "sscidmode"],

  // Commission Junction (CJ Affiliate)
  cj: ["cjevent", "cjdata"],

  // Impact (formerly Impact Radius)
  impact: ["irclickid", "irgwc"],

  // PartnerStack
  partnerstack: ["ps"],

  // ReferralCandy
  referralcandy: ["rc"],

  // Generic affiliate
  generic: ["aff", "affiliate", "ref", "partner"],

  // Amazon Associates
  amazon: ["tag"],

  // ClickBank
  clickbank: ["hop"],

  // Custom tracking
  custom: ["subid", "subid1", "subid2", "subid3", "subid4", "subid5"],
};

const config = {
  position: "right", // 'right' or 'left'
  color: "#3B82F6", // Primary color
  autoOpen: false, // Auto open chat on load
  greeting: "", // Custom greeting message
  apiToken: "",
  widgetUrl: "/widget", // URL to the widget iframe content
  trackReferrer: true, // Enable referrer tracking
  enableGDPR: true, // Enable GDPR compliance
  requireConsent: false, // Require explicit consent
  anonymizeData: true, // Anonymize sensitive data
  dataRetentionDays: 30, // Data retention period
  // Visitor tracking configuration
  enableVisitorTracking: true, // Enable visitor activity tracking
  visitorActivityTimeout: 30000, // 30 seconds before idle
  visitorAwayTimeout: 300000, // 5 minutes before away
  visitorTrackMouse: true, // Track mouse activity
  visitorTrackKeyboard: true, // Track keyboard activity
  visitorTrackScroll: true, // Track scroll activity
  visitorTrackTouch: true, // Track touch activity
  visitorDebounceMs: 1000, // Debounce activity events
};

// Privacy state
let consentState = null;
let privacyConfig = {
  enableGDPR: config.enableGDPR,
  requireConsent: config.requireConsent,
  anonymizeData: config.anonymizeData,
  dataRetentionDays: config.dataRetentionDays,
};

// Utility to collect onboarding tracking data from client side
export async function getOnboardingTrackingData() {
  // Helper to get query param
  const getUTMParams = () => {
    if (typeof window === "undefined")
      return {
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmTerm: "",
        utmContent: "",
      };
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmTerm: params.get("utm_term") || "",
      utmContent: params.get("utm_content") || "",
    };
  };

  // Get geolocation (async)
  const getGeo = (): Promise<{ latitude: string; longitude: string }> =>
    Promise.resolve({ latitude: "", longitude: "" });

  // Get country code from geolocation API
  const getCountryCode = async () => {
    try {
      const res = await fetch("/api/country");
      const data = await res.json();
      if (data.country) {
        return data.country;
      }
    } catch (e) {
      console.log("Country API error:", e);
    }
    // Fallback to locale-based method
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      const match = locale.match(/-([A-Z]{2})$/i);
      return match ? match[1].toUpperCase() : "";
    }
    return "";
  };

  const [geo, countryCode] = await Promise.all([getGeo(), getCountryCode()]);

  // Privacy and Compliance Functions
  function getConsentState() {
    try {
      const stored = localStorage.getItem("kogents_privacy_consent");
      if (!stored) return null;

      const consent = JSON.parse(stored);
      return {
        ...consent,
        timestamp: new Date(consent.timestamp),
      };
    } catch {
      return null;
    }
  }

  function isTrackingAllowed(type: string) {
    // Always allow functional tracking
    if (type === "functional") return true;

    // Check consent if required
    if (privacyConfig.requireConsent) {
      const consent = getConsentState();
      if (!consent) return false;
      return consent[type] === true;
    }

    return true;
  }

  function anonymizeData(data: any) {
    if (!privacyConfig.anonymizeData) return data;

    const anonymized = { ...data };

    // Patterns to anonymize
    const sensitiveKeys = ["email", "phone", "ip", "userId", "sessionId"];
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

    // Anonymize specific keys
    sensitiveKeys.forEach((key) => {
      if (anonymized[key]) {
        if (typeof anonymized[key] === "string") {
          anonymized[key] = anonymized[key].substring(0, 3) + "***";
        }
      }
    });

    // Anonymize patterns in string values
    Object.keys(anonymized).forEach((key) => {
      if (typeof anonymized[key] === "string") {
        anonymized[key] = anonymized[key]
          .replace(emailPattern, "[EMAIL]")
          .replace(phonePattern, "[PHONE]")
          .replace(ipPattern, "[IP]");
      }
    });

    return anonymized;
  }

  function sanitizeURL(url: string) {
    try {
      if (!url || typeof url !== "string") return "";

      const urlObj = new URL(url);

      // Remove sensitive parameters
      SENSITIVE_PARAMS.forEach((param) => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.delete(param);
        }
      });

      let sanitizedUrl = urlObj.toString();

      // Remove PII patterns
      PII_PATTERNS.forEach((pattern) => {
        sanitizedUrl = sanitizedUrl.replace(pattern, "[REDACTED]");
      });

      return sanitizedUrl;
    } catch (error) {
      console.warn("URL sanitization failed:", error);
      return "[INVALID_URL]";
    }
  }

  function extractDomain(url: string) {
    try {
      if (!url) return "";
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, "");
    } catch (error) {
      return "";
    }
  }

  // Get stored referrer data from session
  const storedReferrer = getStoredReferrerData();

  function getStoredReferrerData() {
    try {
      const stored = sessionStorage.getItem("kogents_referrer_data");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  function getReferrerData() {
    try {
      const referrer = document.referrer || "";
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);

      // Check referrer policy
      const referrerPolicy = "default";

      // Detect protocol downgrade (HTTPS to HTTP)
      let protocolDowngrade = false;
      try {
        if (referrer && currentUrl) {
          const referrerProtocol = new URL(referrer).protocol;
          const currentProtocol = new URL(currentUrl).protocol;
          protocolDowngrade =
            referrerProtocol === "https:" && currentProtocol === "http:";
        }
      } catch {}

      // Extract UTM parameters
      const utmData = {
        source: urlParams.get("utm_source"),
        medium: urlParams.get("utm_medium"),
        campaign: urlParams.get("utm_campaign"),
        term: urlParams.get("utm_term"),
        content: urlParams.get("utm_content"),
      };

      // Extract other tracking parameters
      const trackingData = {
        gclid: urlParams.get("gclid"), // Google Ads
        fbclid: urlParams.get("fbclid"), // Facebook
        msclkid: urlParams.get("msclkid"), // Microsoft Ads
        ttclid: urlParams.get("ttclid"), // TikTok
        li_fat_id: urlParams.get("li_fat_id"), // LinkedIn
      };

      // Extract affiliate parameters
      const affiliateData: { [key: string]: string } = {};
      Object.values(AFFILIATE_NETWORKS)
        .flat()
        .forEach((param) => {
          const value = urlParams.get(param);
          if (value) {
            affiliateData[param] = value;
          }
        });

      const referrerInfo = {
        referrer: sanitizeURL(referrer),
        currentUrl: sanitizeURL(currentUrl),
        domain: extractDomain(referrer),
        isFirstVisit: !storedReferrer,
        timestamp: new Date().toISOString(),
        utm: utmData,
        tracking: trackingData,
        affiliate: affiliateData,
        landingPage: storedReferrer
          ? storedReferrer.landingPage
          : sanitizeURL(currentUrl),
        sessionReferrer: storedReferrer
          ? storedReferrer.sessionReferrer
          : sanitizeURL(referrer),
        referrerPolicy: referrerPolicy,
        protocolDowngrade: protocolDowngrade,
      };
      console.log("referrerInfo:", referrerInfo);

      return privacyConfig.anonymizeData
        ? anonymizeData(referrerInfo)
        : referrerInfo;
    } catch (error) {
      console.warn("Error getting referrer data:", error);
      return null;
    }
  }

  const utm = getUTMParams();

  const result = {
    countryCode: countryCode || "",
    latitude: (geo as { latitude: string }).latitude || "",
    longitude: (geo as { longitude: string }).longitude || "",
    timezone:
      (typeof Intl !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "",
    referrerUrl: (typeof document !== "undefined" && document.referrer) || "",
    landingPage: (typeof window !== "undefined" && window.location.href) || "",
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    utmTerm: utm.utmTerm,
    utmContent: utm.utmContent,
  };
  console.log("Onboarding Tracking Data:", result);
  return result;
}
